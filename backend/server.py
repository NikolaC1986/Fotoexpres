from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, Header, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
import shutil
import asyncio
import zipfile

from models.order import Order, OrderDetails, OrderResponse
from models.admin import AdminLogin, AdminToken, ChangeCredentials, ChangeViewerPassword, create_access_token, verify_token, verify_admin_credentials, update_env_file
from utils.order_utils import generate_order_number, create_order_zip
from utils.email_utils import send_order_notification
from utils.security_utils import (
    validate_email, validate_phone, validate_name, 
    validate_address, validate_city, validate_zip_code,
    sanitize_filename, validate_price, validate_positive_number
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix with increased body size limit
app = FastAPI()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create directories for orders and uploads
ORDERS_DIR = ROOT_DIR / "orders"
ORDERS_ZIPS_DIR = ROOT_DIR / "orders_zips"
UPLOADS_DIR = ROOT_DIR / "uploads"
PRODUCT_IMAGES_DIR = UPLOADS_DIR / "products"
ORDERS_DIR.mkdir(exist_ok=True)
ORDERS_ZIPS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)
PRODUCT_IMAGES_DIR.mkdir(exist_ok=True)

# Initialize database indexes on startup
async def init_db_indexes():
    """Create unique index on orderNumber to prevent duplicates"""
    try:
        await db.orders.create_index("orderNumber", unique=True)
        logging.info("✅ Database index created: orderNumber (unique)")
    except Exception as e:
        logging.error(f"Failed to create database index: {str(e)}")

# Will be called on startup
@app.on_event("startup")
async def startup_event():
    await init_db_indexes()
    logging.info("🚀 Backend server started successfully")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/orders/create", response_model=OrderResponse)
async def create_order(
    photos: List[UploadFile] = File(...),
    order_details: str = Form(...),
    request: Request = None
):
    order_number = None
    order_dir = None
    
    try:
        logging.info("=" * 80)
        logging.info(f"NEW ORDER REQUEST RECEIVED - Timestamp: {datetime.now(timezone.utc).isoformat()}")
        
        # SECURITY: Validate file uploads
        ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'}
        ALLOWED_MIME_TYPES = {
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/bmp', 'image/webp', 'image/heic', 'image/heif'
        }
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB per file
        
        logging.info(f"Step 1: Validating {len(photos)} photo files...")
        for i, photo in enumerate(photos):
            # Check file extension
            file_ext = os.path.splitext(photo.filename)[1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                logging.error(f"Invalid file extension: {file_ext} for file {photo.filename}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Nedozvoljen tip fajla: {file_ext}. Dozvoljeni: {', '.join(ALLOWED_EXTENSIONS)}"
                )
            
            # Check MIME type
            if photo.content_type not in ALLOWED_MIME_TYPES:
                logging.error(f"Invalid MIME type: {photo.content_type} for file {photo.filename}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Nedozvoljen MIME tip: {photo.content_type}"
                )
            
            # Check file size (read first chunk to verify it's not empty)
            content = await photo.read(MAX_FILE_SIZE + 1)
            if len(content) == 0:
                logging.error(f"Empty file: {photo.filename}")
                raise HTTPException(status_code=400, detail=f"Fajl je prazan: {photo.filename}")
            if len(content) > MAX_FILE_SIZE:
                logging.error(f"File too large: {photo.filename} ({len(content)} bytes)")
                raise HTTPException(
                    status_code=400,
                    detail=f"Fajl je prevelik: {photo.filename} (max 50MB)"
                )
            # Reset file pointer
            await photo.seek(0)
        
        logging.info(f"Step 1: ✅ All {len(photos)} files validated successfully")
        
        # Parse order details
        logging.info("Step 2: Parsing order details...")
        order_data = json.loads(order_details)
        
        # SECURITY: Validate and sanitize contact info
        logging.info("Step 2.1: Validating contact information...")
        if 'contactInfo' in order_data:
            contact = order_data['contactInfo']
            logging.info(f"Contact info fields: {list(contact.keys())}")
            try:
                contact['fullName'] = validate_name(contact.get('fullName', ''))
                contact['email'] = validate_email(contact.get('email', ''))
                contact['phone'] = validate_phone(contact.get('phone', ''))
                # Check for both 'street' and 'address' field names
                if 'street' in contact and contact['street']:
                    contact['street'] = validate_address(contact['street'])
                elif 'address' in contact and contact['address']:
                    contact['address'] = validate_address(contact['address'])
                else:
                    # If neither field has value, raise error
                    raise HTTPException(status_code=400, detail="Adresa ne može biti prazna")
                
                contact['city'] = validate_city(contact.get('city', ''))
                
                # Check for both 'postalCode' and 'zipCode' field names
                if 'postalCode' in contact and contact['postalCode']:
                    contact['postalCode'] = validate_zip_code(contact['postalCode'])
                elif 'zipCode' in contact and contact['zipCode']:
                    contact['zipCode'] = validate_zip_code(contact['zipCode'])
                else:
                    # If neither field has value, raise error
                    raise HTTPException(status_code=400, detail="Poštanski broj ne može biti prazan")
            except HTTPException as e:
                logging.error(f"Validation error: {e.detail}")
                raise
        
        # SECURITY: Validate prices
        if 'totalPrice' in order_data:
            order_data['totalPrice'] = validate_price(order_data['totalPrice'], "Ukupna cena")
        if 'deliveryFee' in order_data:
            order_data['deliveryFee'] = validate_price(order_data['deliveryFee'], "Cena dostave")
        
        order_details_obj = OrderDetails(**order_data)
        logging.info(f"Step 2: ✅ Order details validated and parsed - Customer: {order_details_obj.contactInfo.fullName}")
        
        # Check if this is a chunked upload
        is_chunked = 'chunkIndex' in order_data
        chunk_index = order_data.get('chunkIndex', 0)
        total_chunks = order_data.get('totalChunks', 1)
        is_last_chunk = order_data.get('isLastChunk', True)
        existing_order_number = order_data.get('orderNumber')
        
        # Generate or use existing order number
        if existing_order_number:
            order_number = existing_order_number
            logging.info(f"Step 3: Using existing order number: {order_number} (chunk {chunk_index + 1}/{total_chunks})")
        else:
            order_number = generate_order_number()
            logging.info(f"Step 3: ✅ Generated new order number: {order_number}")
        
        # Calculate total photos
        total_photos = sum(p.quantity for p in order_details_obj.photoSettings)
        
        # Get processing options
        crop_option = order_data.get('cropOption', False)
        fill_white_option = order_data.get('fillWhiteOption', False)
        
        # Get price information from order details
        price_info = {
            'totalPrice': order_data.get('totalPrice', 0),
            'quantityDiscountAmount': order_data.get('quantityDiscountAmount', 0),
            'promotionDiscountAmount': order_data.get('promotionDiscountAmount', 0),
            'quantityDiscountPercent': order_data.get('quantityDiscountPercent', 0),
            'promotionDiscountPercent': order_data.get('promotionDiscountPercent', 0),
            'deliveryFee': order_data.get('deliveryFee', 400),
            'deliveryPrice': order_data.get('deliveryPrice', 400),
            'freeDeliveryLimit': order_data.get('freeDeliveryLimit', 5000),
            'prices': order_data.get('prices', {})
        }
        
        # For chunked uploads (not last chunk), just save files and return
        if is_chunked and not is_last_chunk:
            logging.info(f"Step 4: Processing chunk {chunk_index + 1}/{total_chunks} (NOT final chunk)")
            
            # Create order directory
            order_dir = ORDERS_DIR / order_number
            order_dir.mkdir(exist_ok=True)
            
            # Save photos from this chunk
            saved_files = []
            for photo in photos:
                file_path = order_dir / photo.filename
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(photo.file, buffer)
                saved_files.append(photo.filename)
            
            logging.info(f"Step 4: ✅ Chunk {chunk_index + 1}/{total_chunks} saved - {len(saved_files)} files")
            
            return OrderResponse(
                success=True,
                orderNumber=order_number,
                message=f"Chunk {chunk_index + 1}/{total_chunks} uploaded successfully",
                zipFilePath=""
            )
        
        # LAST CHUNK OR NON-CHUNKED: Complete the order
        logging.info(f"Step 4: Processing FINAL {'chunk' if is_chunked else 'upload'} - Creating complete order...")
        
        # ===== CRITICAL SECTION START =====
        # STEP A: First, create DB record with "processing" status to claim this order number
        logging.info(f"Step 4A: Creating database record for order {order_number}...")
        
        # Check if order already exists
        existing_order = await db.orders.find_one({"orderNumber": order_number})
        if existing_order:
            logging.warning(f"Order {order_number} already exists in database - likely duplicate submission")
            # Return the existing order info
            return OrderResponse(
                success=True,
                orderNumber=order_number,
                message="Order already exists",
                zipFilePath=existing_order.get('zipFilePath', '')
            )
        
        # Create initial order record with "processing" status
        try:
            # Get products from order data if any
            products = order_data.get('products', [])
            gift_products = order_data.get('giftProducts', [])
            
            order_doc = {
                "orderNumber": order_number,
                "contactInfo": order_details_obj.contactInfo.model_dump(),
                "photoSettings": [p.model_dump() for p in order_details_obj.photoSettings],
                "products": products,  # Include products
                "giftProducts": gift_products,  # Include gift products
                "totalPhotos": total_photos,
                "status": "processing",  # Mark as processing
                "zipFilePath": "",  # Will be updated after ZIP creation
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            
            result = await db.orders.insert_one(order_doc)
            products_count = len(products)
            gifts_count = len(gift_products)
            logging.info(f"Step 4A: ✅ Database record created with ID: {result.inserted_id} - Status: PROCESSING ({products_count} products, {gifts_count} gifts)")

        except Exception as db_error:
            logging.error(f"Step 4A: ❌ CRITICAL - Failed to create database record: {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
        
        # STEP B: Save photo files
        logging.info(f"Step 4B: Saving {len(photos)} photo files to disk...")
        order_dir = ORDERS_DIR / order_number
        order_dir.mkdir(exist_ok=True)
        
        saved_files = []
        try:
            for photo in photos:
                file_path = order_dir / photo.filename
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(photo.file, buffer)
                saved_files.append(photo.filename)
            logging.info(f"Step 4B: ✅ All {len(saved_files)} main photo files saved to {order_dir}")
            
            # Save product-specific photos if any
            products = order_data.get('products', [])
            if products:
                product_photos_dir = order_dir / "product_photos"
                product_photos_dir.mkdir(exist_ok=True)
                
                # Process product photos from FormData
                form_data = await request.form()
                for product_idx, product in enumerate(products):
                    field_name = f"product_photos_{product_idx}"
                    if field_name in form_data:
                        product_files = form_data.getlist(field_name)
                        product_photo_names = []
                        
                        for product_file in product_files:
                            if hasattr(product_file, 'filename'):
                                product_file_path = product_photos_dir / f"product_{product_idx}_{product_file.filename}"
                                with open(product_file_path, "wb") as buffer:
                                    content = await product_file.read()
                                    buffer.write(content)
                                product_photo_names.append(product_file.filename)
                        
                        # Update product with actual saved photo names
                        products[product_idx]['photoFileNames'] = product_photo_names
                        logging.info(f"Step 4B: ✅ Saved {len(product_photo_names)} photos for product {product_idx}")
            
            logging.info(f"Step 4B: ✅ All files saved to {order_dir}")
        except Exception as file_error:
            logging.error(f"Step 4B: ❌ Failed to save files: {str(file_error)}")
            # Cleanup: delete the database record
            await db.orders.delete_one({"orderNumber": order_number})
            logging.info(f"Step 4B: Cleaned up database record for failed order {order_number}")
            raise HTTPException(status_code=500, detail=f"Failed to save files: {str(file_error)}")
        
        # STEP C: Create ZIP file
        logging.info(f"Step 4C: Creating ZIP archive...")
        zip_file_name = f"order-{order_number}.zip"
        zip_path = ORDERS_ZIPS_DIR / zip_file_name
        
        try:
            # Get products from order data
            products = order_data.get('products', [])
            
            create_order_zip(
                str(order_dir),
                str(zip_path),
                order_number,
                order_details_obj.contactInfo.model_dump(),
                [p.model_dump() for p in order_details_obj.photoSettings],
                total_photos,
                crop_option,
                fill_white_option,
                price_info,
                products,
                gift_products
            )
            logging.info(f"Step 4C: ✅ ZIP archive created at {zip_path}")
        except Exception as zip_error:
            logging.error(f"Step 4C: ❌ Failed to create ZIP: {str(zip_error)}")
            # Cleanup: delete the database record
            await db.orders.delete_one({"orderNumber": order_number})
            logging.info(f"Step 4C: Cleaned up database record for failed order {order_number}")
            raise HTTPException(status_code=500, detail=f"Failed to create ZIP: {str(zip_error)}")
        
        # STEP D: Update database record to "completed" with ZIP path
        logging.info(f"Step 4D: Updating database record to COMPLETED status...")
        try:
            update_result = await db.orders.update_one(
                {"orderNumber": order_number},
                {
                    "$set": {
                        "status": "completed",
                        "zipFilePath": str(zip_path),
                        "completedAt": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            if update_result.modified_count == 0:
                logging.error(f"Step 4D: ❌ Failed to update order status - no document modified")
                raise HTTPException(status_code=500, detail="Failed to complete order")
            
            logging.info(f"Step 4D: ✅ Order {order_number} status updated to COMPLETED")
        except Exception as update_error:
            logging.error(f"Step 4D: ❌ Failed to update order status: {str(update_error)}")
            # Order is partially created - log the issue but don't fail completely
            logging.error(f"Step 4D: WARNING - Order {order_number} may be in inconsistent state")
        
        # ===== CRITICAL SECTION END =====
        
        # STEP E: Send email notification (non-critical - don't fail if this errors)
        logging.info(f"Step 4E: Sending email notification...")
        try:
            send_order_notification(
                order_number,
                order_details_obj.contactInfo.model_dump(),
                [p.model_dump() for p in order_details_obj.photoSettings],
                total_photos,
                str(zip_path)
            )
            logging.info(f"Step 4E: ✅ Email notification sent successfully")
        except Exception as email_error:
            logging.error(f"Step 4E: ⚠️  Email notification failed (non-critical): {str(email_error)}")
            # Don't fail the order creation if email fails
        
        # FINAL: Verify order exists in database before returning success
        logging.info(f"Step 5: Final verification - checking order {order_number} exists in database...")
        final_check = await db.orders.find_one({"orderNumber": order_number})
        
        if not final_check:
            logging.error(f"Step 5: ❌ CRITICAL - Order {order_number} NOT FOUND in database after creation!")
            raise HTTPException(status_code=500, detail="Order creation verification failed")
        
        logging.info(f"Step 5: ✅ Order {order_number} verified in database - Status: {final_check.get('status')}")
        logging.info("=" * 80)
        logging.info(f"ORDER {order_number} COMPLETED SUCCESSFULLY ✅")
        logging.info("=" * 80)
        
        # Return success response
        return OrderResponse(
            success=True,
            orderNumber=order_number,
            message="Order created successfully",
            zipFilePath=str(zip_path)
        )
        
    except json.JSONDecodeError as json_err:
        logging.error(f"JSON parsing error: {str(json_err)}")
        raise HTTPException(status_code=400, detail="Invalid order details format")
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logging.error(f"UNEXPECTED ERROR creating order {order_number if order_number else 'UNKNOWN'}: {str(e)}")
        logging.error(f"Exception type: {type(e).__name__}")
        logging.error(f"Exception details: {str(e)}")
        
        # Cleanup on unexpected error
        if order_number:
            try:
                await db.orders.delete_one({"orderNumber": order_number})
                logging.info(f"Cleaned up database record for failed order {order_number}")
            except Exception as cleanup_err:
                logging.error(f"Failed to cleanup order {order_number}: {str(cleanup_err)}")
        
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@api_router.get("/orders/{order_number}")
async def get_order(order_number: str):
    order = await db.orders.find_one({"orderNumber": order_number})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Convert ObjectId to string for JSON serialization
    order["_id"] = str(order["_id"])
    return order

# Admin Authentication Helper
async def verify_admin_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload

# Admin Login
@api_router.post("/admin/login", response_model=AdminToken)
@limiter.limit("5/minute")  # SECURITY: Max 5 login attempts per minute
async def admin_login(request: Request, credentials: AdminLogin):
    role = verify_admin_credentials(credentials.username, credentials.password)
    if not role:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": credentials.username, "role": role})
    
    return AdminToken(
        success=True,
        token=token,
        message="Login successful",
        role=role
    )

# Change Admin Credentials (Admin Only)
@api_router.post("/admin/change-credentials")
async def change_admin_credentials(
    credentials: ChangeCredentials,
    admin = Depends(verify_admin_token)
):
    """Change admin username and/or password"""
    try:
        # Verify current password
        current_username = os.environ.get('ADMIN_USERNAME', 'Vlasnik')
        current_password = os.environ.get('ADMIN_PASSWORD', 'Fotoexpres2025!')
        
        if credentials.currentPassword != current_password:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Validate new credentials
        if credentials.newPassword and len(credentials.newPassword) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        
        if credentials.newUsername and len(credentials.newUsername.strip()) == 0:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        
        # Update .env file
        success = update_env_file(
            new_username=credentials.newUsername,
            new_password=credentials.newPassword
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update credentials")
        
        # Save to MongoDB settings collection for backup
        await db.admin_settings.update_one(
            {"_id": "admin_credentials"},
            {
                "$set": {
                    "username": credentials.newUsername or current_username,
                    "lastUpdated": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Credentials updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error changing credentials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to change credentials: {str(e)}")

# Change Viewer Password (Admin Only)
@api_router.post("/admin/change-viewer-password")
async def change_viewer_password(
    request: ChangeViewerPassword,
    admin = Depends(verify_admin_token)
):
    """Admin can change viewer (Menadzer) password"""
    try:
        # Check if user is admin (not viewer)
        if admin.get('role') != 'admin':
            raise HTTPException(status_code=403, detail="Only admin can change viewer password")
        
        # Validate new password
        if len(request.newViewerPassword) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        
        # Update .env file for viewer password
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        
        with open(env_path, 'r') as file:
            lines = file.readlines()
        
        with open(env_path, 'w') as file:
            for line in lines:
                if line.startswith('VIEWER_PASSWORD='):
                    file.write(f'VIEWER_PASSWORD={request.newViewerPassword}\n')
                else:
                    file.write(line)
        
        # Update environment variable
        os.environ['VIEWER_PASSWORD'] = request.newViewerPassword
        
        # Save to MongoDB for backup
        await db.admin_settings.update_one(
            {"_id": "viewer_credentials"},
            {
                "$set": {
                    "lastUpdated": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Viewer password updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error changing viewer password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to change viewer password: {str(e)}")

# Get All Orders (Admin Only)
@api_router.get("/admin/orders")
async def get_all_orders(admin = Depends(verify_admin_token)):
    try:
        orders = await db.orders.find().sort("createdAt", -1).to_list(1000)
        
        # Convert ObjectId to string
        for order in orders:
            order["_id"] = str(order["_id"])
        
        # Calculate stats
        total = len(orders)
        pending = sum(1 for order in orders if order.get("status") == "pending")
        completed = sum(1 for order in orders if order.get("status") == "completed")
        
        return {
            "orders": orders,
            "stats": {
                "total": total,
                "pending": pending,
                "completed": completed
            }
        }
    except Exception as e:
        logging.error(f"Error fetching orders: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch orders")

# Download Order ZIP (Admin Only)
@api_router.get("/admin/orders/{order_number}/download")
async def download_order_zip(order_number: str, admin = Depends(verify_admin_token)):
    order = await db.orders.find_one({"orderNumber": order_number})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    zip_path = order.get("zipFilePath")
    
    if not zip_path or not os.path.exists(zip_path):
        raise HTTPException(status_code=404, detail="ZIP file not found")
    
    return FileResponse(
        path=zip_path,
        filename=f"order-{order_number}.zip",
        media_type="application/zip"
    )

# Update Order Status (Admin Only)
@api_router.put("/admin/orders/{order_number}/status")
async def update_order_status(
    order_number: str, 
    status_update: dict,
    admin = Depends(verify_admin_token)
):
    new_status = status_update.get("status")
    
    if new_status not in ["pending", "processing", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"orderNumber": order_number},
        {"$set": {"status": new_status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"success": True, "message": "Status updated"}

# Delete Order (Admin Only)
@api_router.delete("/admin/orders/{order_number}")
async def delete_order(
    order_number: str,
    admin = Depends(verify_admin_token)
):
    try:
        # Find the order first to get file paths
        order = await db.orders.find_one({"orderNumber": order_number})
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Delete the ZIP file if it exists
        zip_path = order.get("zipFilePath")
        if zip_path and os.path.exists(zip_path):
            try:
                os.remove(zip_path)
                logging.info(f"Deleted ZIP file: {zip_path}")
            except Exception as e:
                logging.error(f"Error deleting ZIP file: {str(e)}")
        
        # Delete the order directory if it exists
        order_dir = ORDERS_DIR / order_number
        if order_dir.exists():
            try:
                shutil.rmtree(order_dir)
                logging.info(f"Deleted order directory: {order_dir}")
            except Exception as e:
                logging.error(f"Error deleting order directory: {str(e)}")
        
        # Delete from database
        result = await db.orders.delete_one({"orderNumber": order_number})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Order not found in database")
        
        return {
            "success": True,
            "message": f"Order {order_number} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete order: {str(e)}")

# Download System Logs and Statistics (Admin Only)
@api_router.get("/admin/download-logs")
async def download_logs(admin = Depends(verify_admin_token)):
    """
    Generate and download a comprehensive log report including:
    - Statistics (total orders, total photos, success/failure rates)
    - Successful orders from database
    - Failed order attempts from backend logs
    """
    try:
        from datetime import datetime
        import re
        
        logging.info("Generating system logs report for admin download...")
        
        # === SECTION 1: STATISTICS ===
        report_lines = []
        report_lines.append("=" * 80)
        report_lines.append("FOTOEXPRES - SISTEM IZVEŠTAJ O PORUDŽBINAMA")
        report_lines.append("=" * 80)
        report_lines.append(f"Datum generisanja: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
        report_lines.append("")
        
        # Get all orders from database
        all_orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
        
        total_orders = len(all_orders)
        completed_orders = len([o for o in all_orders if o.get('status') == 'completed'])
        processing_orders = len([o for o in all_orders if o.get('status') == 'processing'])
        total_photos = sum(o.get('totalPhotos', 0) for o in all_orders)
        
        report_lines.append("--- STATISTIKA ---")
        report_lines.append(f"Ukupan broj porudžbina u bazi: {total_orders}")
        report_lines.append(f"  - Završene (completed): {completed_orders}")
        report_lines.append(f"  - U obradi (processing): {processing_orders}")
        report_lines.append(f"Ukupan broj fotografija: {total_photos}")
        report_lines.append("")
        
        # === SECTION 2: SUCCESSFUL ORDERS ===
        report_lines.append("=" * 80)
        report_lines.append("USPEŠNE PORUDŽBINE")
        report_lines.append("=" * 80)
        report_lines.append("")
        
        if all_orders:
            # Sort by createdAt (handle both datetime and string formats)
            def get_sort_key(order):
                created_at = order.get('createdAt', '')
                if isinstance(created_at, str):
                    return created_at
                return created_at.isoformat() if hasattr(created_at, 'isoformat') else ''
            
            for order in sorted(all_orders, key=get_sort_key, reverse=True):
                order_num = order.get('orderNumber', 'N/A')
                created_at = order.get('createdAt', 'N/A')
                status = order.get('status', 'N/A')
                contact = order.get('contactInfo', {})
                customer_name = contact.get('fullName', 'N/A')
                customer_email = contact.get('email', 'N/A')
                customer_phone = contact.get('phone', 'N/A')
                total_photos_order = order.get('totalPhotos', 0)
                
                report_lines.append(f"Porudžbina: {order_num}")
                report_lines.append(f"  Datum: {created_at}")
                report_lines.append(f"  Status: {status}")
                report_lines.append(f"  Kupac: {customer_name}")
                report_lines.append(f"  Email: {customer_email}")
                report_lines.append(f"  Telefon: {customer_phone}")
                report_lines.append(f"  Broj fotografija: {total_photos_order}")
                report_lines.append("")
        else:
            report_lines.append("Nema porudžbina u bazi podataka.")
            report_lines.append("")
        
        # === SECTION 3: FAILED ORDER ATTEMPTS ===
        report_lines.append("=" * 80)
        report_lines.append("NEUSPEŠNI POKUŠAJI KREIRANJA PORUDŽBINA")
        report_lines.append("=" * 80)
        report_lines.append("")
        
        # Parse backend logs for failed attempts
        log_file_path = "/var/log/supervisor/backend.err.log"
        failed_attempts = []
        
        try:
            if os.path.exists(log_file_path):
                with open(log_file_path, 'r', encoding='utf-8', errors='ignore') as log_file:
                    log_content = log_file.read()
                    
                    # Find all order processing that started but didn't complete
                    # Pattern: "NEW ORDER REQUEST RECEIVED" followed by errors
                    order_starts = re.finditer(r'NEW ORDER REQUEST RECEIVED - Timestamp: (.*?)$', log_content, re.MULTILINE)
                    completed_orders_from_log = re.findall(r'ORDER (ORD-\d+) COMPLETED SUCCESSFULLY', log_content)
                    
                    # Find errors with order numbers
                    error_patterns = [
                        r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*?(ERROR|CRITICAL).*?(ORD-\d+)?.*?:(.*?)$',
                        r'Step \d[A-Z]?: ❌.*?(ORD-\d+)?.*?-(.*?)$'
                    ]
                    
                    for pattern in error_patterns:
                        errors = re.finditer(pattern, log_content, re.MULTILINE)
                        for error_match in errors:
                            groups = error_match.groups()
                            if len(groups) >= 3:
                                timestamp = groups[0] if len(groups[0]) > 5 else "N/A"
                                order_num = groups[2] if len(groups) > 2 and groups[2] else "Unknown"
                                error_msg = groups[-1].strip() if groups[-1] else "Unknown error"
                                
                                # Skip if this order was completed successfully
                                if order_num != "Unknown" and order_num in completed_orders_from_log:
                                    continue
                                
                                failed_attempts.append({
                                    'timestamp': timestamp,
                                    'order_number': order_num,
                                    'error': error_msg
                                })
                
                if failed_attempts:
                    report_lines.append(f"Pronađeno neuspešnih pokušaja: {len(failed_attempts)}")
                    report_lines.append("")
                    
                    # Group by order number
                    from collections import defaultdict
                    errors_by_order = defaultdict(list)
                    for attempt in failed_attempts:
                        errors_by_order[attempt['order_number']].append(attempt)
                    
                    for order_num, errors in errors_by_order.items():
                        report_lines.append(f"Order: {order_num}")
                        for error in errors[:5]:  # Max 5 errors per order
                            report_lines.append(f"  [{error['timestamp']}] {error['error']}")
                        if len(errors) > 5:
                            report_lines.append(f"  ... i još {len(errors) - 5} grešaka")
                        report_lines.append("")
                else:
                    report_lines.append("Nema zabeleženih neuspešnih pokušaja u logovima.")
                    report_lines.append("")
            else:
                report_lines.append(f"Log fajl ne postoji: {log_file_path}")
                report_lines.append("")
                
        except Exception as log_error:
            report_lines.append(f"Greška pri čitanju log fajla: {str(log_error)}")
            report_lines.append("")
        
        # === SECTION 4: RECENT BACKEND ERRORS ===
        report_lines.append("=" * 80)
        report_lines.append("NEDAVNE BACKEND GREŠKE (Poslednjih 50)")
        report_lines.append("=" * 80)
        report_lines.append("")
        
        try:
            if os.path.exists(log_file_path):
                with open(log_file_path, 'r', encoding='utf-8', errors='ignore') as log_file:
                    lines = log_file.readlines()
                    error_lines = [line for line in lines if 'ERROR' in line or 'CRITICAL' in line or '❌' in line]
                    recent_errors = error_lines[-50:] if len(error_lines) > 50 else error_lines
                    
                    if recent_errors:
                        for error_line in recent_errors:
                            report_lines.append(error_line.strip())
                    else:
                        report_lines.append("Nema zabeleženih grešaka.")
            else:
                report_lines.append("Log fajl nije dostupan.")
        except Exception as e:
            report_lines.append(f"Greška pri čitanju grešaka: {str(e)}")
        
        report_lines.append("")
        report_lines.append("=" * 80)
        report_lines.append("KRAJ IZVEŠTAJA")
        report_lines.append("=" * 80)
        
        # Generate report content
        report_content = "\n".join(report_lines)
        
        # Create filename with timestamp
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        filename = f"fotoexpres_logs_{timestamp}.txt"
        
        logging.info(f"System logs report generated: {len(report_lines)} lines")
        
        # Return as downloadable file
        from fastapi.responses import Response
        return Response(
            content=report_content,
            media_type="text/plain; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        logging.error(f"Error generating logs report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate logs: {str(e)}")

# Get Prices (Admin Only)
@api_router.get("/admin/prices")
async def get_prices(admin = Depends(verify_admin_token)):
    try:
        prices_doc = await db.prices.find_one({"_id": "default_prices"})
        
        # Default prices if not found
        default_prices = {
            '9x13': 12,
            '10x15': 18,
            '13x18': 25,
            '15x21': 50,
            '20x30': 150,
            '30x45': 250
        }
        
        if prices_doc:
            return {"prices": prices_doc.get("prices", default_prices)}
        else:
            return {"prices": default_prices}
    except Exception as e:
        logging.error(f"Error fetching prices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch prices")

# Update Prices (Admin Only)
@api_router.put("/admin/prices")
async def update_prices(
    price_update: dict,
    admin = Depends(verify_admin_token)
):
    try:
        prices = price_update.get("prices")
        
        if not prices:
            raise HTTPException(status_code=400, detail="Prices object required")
        
        # Upsert prices document
        await db.prices.update_one(
            {"_id": "default_prices"},
            {"$set": {"prices": prices}},
            upsert=True
        )
        
        return {"success": True, "message": "Prices updated"}
    except Exception as e:
        logging.error(f"Error updating prices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update prices")

# Get Prices (Public - for frontend)
@api_router.get("/prices")
async def get_public_prices():
    try:
        prices_doc = await db.prices.find_one({"_id": "default_prices"})
        
        # Default prices
        default_prices = {
            '9x13': 12,
            '10x15': 18,
            '13x18': 25,
            '15x21': 50,
            '20x30': 150,
            '30x45': 250
        }
        
        if prices_doc:
            return {"prices": prices_doc.get("prices", default_prices)}
        else:
            return {"prices": default_prices}
    except Exception as e:
        logging.error(f"Error fetching public prices: {str(e)}")
        return {"prices": default_prices}

# Get Settings (Admin Only)
@api_router.get("/admin/settings")
async def get_settings(admin = Depends(verify_admin_token)):
    try:
        settings_doc = await db.settings.find_one({"_id": "site_settings"})
        
        # Default settings
        default_settings = {
            'freeDeliveryLimit': 5000,
            'deliveryPrice': 400,
            'contactPhone': '+381 65 46 000 46',
            'contactEmail': 'kontakt@fotoexpres.rs',
            'workingHours': 'Pon-Pet: 08:00-17:00, Sub: 09:00-14:00',
            'heroImageUrl': 'https://customer-assets.emergentagent.com/job_swift-image-portal/artifacts/1ogmpeji_8%20copy.jpg'
        }
        
        if settings_doc:
            return {"settings": settings_doc.get("settings", default_settings)}
        else:
            return {"settings": default_settings}
    except Exception as e:
        logging.error(f"Error fetching settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

# Upload Hero Image (Admin Only)
@api_router.post("/admin/upload-hero-image")
async def upload_hero_image(
    file: UploadFile = File(...),
    admin = Depends(verify_admin_token)
):
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"hero_{uuid.uuid4()}.{file_extension}"
        file_path = UPLOADS_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Return the URL path
        image_url = f"/api/uploads/{unique_filename}"
        
        return {
            "success": True,
            "imageUrl": image_url,
            "filename": unique_filename
        }
    except Exception as e:
        logging.error(f"Error uploading hero image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# Serve Uploaded Images
@api_router.get("/uploads/{filename}")
async def get_uploaded_image(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

# Update Settings (Admin Only)
@api_router.put("/admin/settings")
async def update_settings(
    settings_update: dict,
    admin = Depends(verify_admin_token)
):
    try:
        settings = settings_update.get("settings")
        
        if not settings:
            raise HTTPException(status_code=400, detail="Settings object required")
        
        # Upsert settings document
        await db.settings.update_one(
            {"_id": "site_settings"},
            {"$set": {"settings": settings}},
            upsert=True
        )
        
        return {"success": True, "message": "Settings updated"}
    except Exception as e:
        logging.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

# Get Settings (Public - for frontend)
@api_router.get("/settings")
async def get_public_settings():
    try:
        settings_doc = await db.settings.find_one({"_id": "site_settings"})
        
        # Default settings
        default_settings = {
            'freeDeliveryLimit': 5000,
            'deliveryPrice': 400,
            'contactPhone': '+381 65 46 000 46',
            'contactEmail': 'kontakt@fotoexpres.rs',
            'workingHours': 'Pon-Pet: 08:00-17:00, Sub: 09:00-14:00',
            'heroImageUrl': 'https://customer-assets.emergentagent.com/job_swift-image-portal/artifacts/1ogmpeji_8%20copy.jpg'
        }
        
        if settings_doc:
            return {"settings": settings_doc.get("settings", default_settings)}
        else:
            return {"settings": default_settings}
    except Exception as e:
        logging.error(f"Error fetching settings: {str(e)}")
        return {"settings": {'freeDeliveryLimit': 5000, 'workingHours': 'Pon-Pet: 08:00-17:00, Sub: 09:00-14:00'}}

# Get Quantity Discounts (Admin Only)
@api_router.get("/admin/discounts")
async def get_discounts(admin = Depends(verify_admin_token)):
    try:
        discounts_doc = await db.discounts.find_one({"_id": "quantity_discounts"})
        
        # Default discounts
        default_discounts = {
            '50': 5,   # 5% discount for 50+ photos
            '100': 10, # 10% discount for 100+ photos
            '200': 15  # 15% discount for 200+ photos
        }
        
        if discounts_doc:
            return {"discounts": discounts_doc.get("discounts", default_discounts)}
        else:
            return {"discounts": default_discounts}
    except Exception as e:
        logging.error(f"Error fetching discounts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch discounts")

# Update Quantity Discounts (Admin Only)
@api_router.put("/admin/discounts")
async def update_discounts(
    discount_update: dict,
    admin = Depends(verify_admin_token)
):
    try:
        discounts = discount_update.get("discounts")
        
        if not discounts:
            raise HTTPException(status_code=400, detail="Discounts object required")
        
        # Upsert discounts document
        await db.discounts.update_one(
            {"_id": "quantity_discounts"},
            {"$set": {"discounts": discounts}},
            upsert=True
        )
        
        return {"success": True, "message": "Discounts updated"}
    except Exception as e:
        logging.error(f"Error updating discounts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update discounts")

# Get Quantity Discounts (Public - for frontend)
@api_router.get("/discounts")
async def get_public_discounts():
    try:
        discounts_doc = await db.discounts.find_one({"_id": "quantity_discounts"})
        
        # Default discounts
        default_discounts = {
            '50': 5,
            '100': 10,
            '200': 15
        }
        
        if discounts_doc:
            return {"discounts": discounts_doc.get("discounts", default_discounts)}
        else:
            return {"discounts": default_discounts}
    except Exception as e:
        logging.error(f"Error fetching discounts: {str(e)}")
        return {"discounts": {'50': 5, '100': 10, '200': 15}}

# Get Promotion (Admin Only)
@api_router.get("/admin/promotion")
async def get_promotion(admin = Depends(verify_admin_token)):
    try:
        promotion_doc = await db.promotions.find_one({"_id": "active_promotion"})
        
        # Default promotion
        default_promotion = {
            'isActive': False,
            'format': 'all',  # 'all' or specific format like '10x15'
            'discountPercent': 10,
            'validUntil': '',
            'message': '10% popusta na sve porudžbine!',
            'customDisplayText': '',  # Custom tekst za badge (npr. "Album na poklon")
            'applyDiscount': True,  # Da li se primenjuje popust ili je samo reklama
            'type': 'discount',  # 'discount' or 'gift'
            'giftTiers': []  # For gift promotions
        }
        
        if promotion_doc:
            return {"promotion": promotion_doc.get("promotion", default_promotion)}
        else:
            return {"promotion": default_promotion}
    except Exception as e:
        logging.error(f"Error fetching promotion: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch promotion")

# Update Promotion (Admin Only)
@api_router.put("/admin/promotion")
async def update_promotion(
    promotion_update: dict,
    admin = Depends(verify_admin_token)
):
    try:
        promotion = promotion_update.get("promotion")
        
        if not promotion:
            raise HTTPException(status_code=400, detail="Promotion object required")
        
        # Upsert promotion document
        await db.promotions.update_one(
            {"_id": "active_promotion"},
            {"$set": {"promotion": promotion}},
            upsert=True
        )
        
        return {"success": True, "message": "Promotion updated"}
    except Exception as e:
        logging.error(f"Error updating promotion: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update promotion")

# Get Promotion (Public - for frontend)
@api_router.get("/promotion")
async def get_public_promotion():
    try:
        promotion_doc = await db.promotions.find_one({"_id": "active_promotion"})
        
        # Default promotion
        default_promotion = {
            'isActive': False,
            'format': 'all',
            'discountPercent': 10,
            'validUntil': '2025-12-31T23:59',
            'message': '10% popusta na sve porudžbine!',
            'customDisplayText': '',
            'applyDiscount': True,
            'type': 'discount',  # 'discount' or 'gift'
            'giftTiers': []  # For gift promotions
        }
        
        if promotion_doc:
            promotion = promotion_doc.get("promotion", default_promotion)
            
            # Ensure message has a value
            if not promotion.get('message'):
                promotion['message'] = '10% popusta na sve porudžbine!'
            
            # Check if promotion is still valid
            if promotion.get('isActive') and promotion.get('validUntil'):
                try:
                    # Handle both datetime string formats
                    valid_until_str = promotion['validUntil']
                    if 'T' in valid_until_str:
                        valid_until = datetime.fromisoformat(valid_until_str.replace('Z', '+00:00').replace('+00:00', ''))
                    else:
                        valid_until = datetime.fromisoformat(valid_until_str)
                    
                    # Make timezone-aware if needed
                    if valid_until.tzinfo is None:
                        valid_until = valid_until.replace(tzinfo=timezone.utc)
                    
                    if valid_until < datetime.now(timezone.utc):
                        promotion['isActive'] = False
                except Exception as e:
                    logging.error(f"Error parsing promotion date: {str(e)}")
                    
            return {"promotion": promotion}
        else:
            return {"promotion": default_promotion}
    except Exception as e:
        logging.error(f"Error fetching promotion: {str(e)}")
        return {"promotion": {'isActive': False, 'format': 'all', 'discountPercent': 10, 'validUntil': '', 'message': ''}}

# ============================================================================
# PRODUCTS MANAGEMENT
# ============================================================================

from models.product import (
    Product, ProductCreate, ProductUpdate, ProductVariant,
    ProductOrder, ProductOrderItem, ProductOrderResponse
)

# Get all products (public)
@api_router.get("/products")
async def get_products():
    """Get all available products"""
    try:
        products = await db.products.find({"available": True}, {"_id": 0}).to_list(1000)
        return {"success": True, "products": products}
    except Exception as e:
        logging.error(f"Error fetching products: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")

# Get single product by ID (public)
@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product by ID"""
    try:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"success": True, "product": product}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching product: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch product")

# Create product order (public)
@api_router.post("/product-orders/create", response_model=ProductOrderResponse)
async def create_product_order(
    photos: List[UploadFile] = File(...),
    order_details: str = Form(...)
):
    """Create a new product order"""
    order_number = None
    
    try:
        logging.info("=" * 80)
        logging.info(f"NEW PRODUCT ORDER REQUEST - Timestamp: {datetime.now(timezone.utc).isoformat()}")
        
        # Validate files
        ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'}
        ALLOWED_MIME_TYPES = {
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/bmp', 'image/webp', 'image/heic', 'image/heif'
        }
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
        
        logging.info(f"Step 1: Validating {len(photos)} photo files...")
        for photo in photos:
            file_ext = os.path.splitext(photo.filename)[1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(status_code=400, detail=f"Nedozvoljen tip fajla: {file_ext}")
            if photo.content_type not in ALLOWED_MIME_TYPES:
                raise HTTPException(status_code=400, detail=f"Nedozvoljen MIME tip: {photo.content_type}")
            
            content = await photo.read(MAX_FILE_SIZE + 1)
            if len(content) == 0:
                raise HTTPException(status_code=400, detail=f"Fajl je prazan: {photo.filename}")
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"Fajl je prevelik: {photo.filename}")
            await photo.seek(0)
        
        logging.info(f"Step 1: ✅ All {len(photos)} files validated")
        
        # Parse order details
        logging.info("Step 2: Parsing product order details...")
        order_data = json.loads(order_details)
        
        # Generate order number
        order_number = generate_order_number()
        logging.info(f"Step 3: ✅ Generated product order number: {order_number}")
        
        # Create order directory
        order_dir = ORDERS_DIR / f"product_{order_number}"
        order_dir.mkdir(exist_ok=True)
        
        # Save photos
        logging.info(f"Step 4: Saving photos to disk...")
        saved_files = []
        for photo in photos:
            file_path = order_dir / photo.filename
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            saved_files.append(photo.filename)
        logging.info(f"Step 4: ✅ Saved {len(saved_files)} photos")
        
        # Create product order object
        from models.product import ContactInfo as ProductContactInfo
        contact_info = ProductContactInfo(**order_data['contactInfo'])
        
        items = []
        for item_data in order_data['items']:
            item = ProductOrderItem(**item_data)
            items.append(item)
        
        # Create order document
        logging.info(f"Step 5: Creating database record...")
        product_order = {
            "orderNumber": order_number,
            "contactInfo": contact_info.model_dump(),
            "items": [item.model_dump() for item in items],
            "totalPrice": order_data.get('totalPrice', 0),
            "deliveryFee": order_data.get('deliveryFee', 0),
            "grandTotal": order_data.get('grandTotal', 0),
            "status": "Na Čekanju",
            "zipFilePath": "",
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        result = await db.product_orders.insert_one(product_order)
        logging.info(f"Step 5: ✅ Product order {order_number} created in database")
        
        # Create ZIP file with photos
        zip_file_name = f"product_order-{order_number}.zip"
        zip_path = ORDERS_ZIPS_DIR / zip_file_name
        
        logging.info(f"Step 6: Creating ZIP archive...")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            # Add photos
            for photo_file in saved_files:
                file_path = order_dir / photo_file
                zipf.write(file_path, photo_file)
            
            # Create order details text file
            order_details_content = f"""FOTOEXPRES - PRODUCT ORDER
Order Number: {order_number}
Datum: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}

KONTAKT INFORMACIJE:
Ime i Prezime: {contact_info.fullName}
Email: {contact_info.email}
Telefon: {contact_info.phone}
Ulica i broj: {contact_info.street}
Poštanski broj: {contact_info.postalCode}
Grad: {contact_info.city}
Napomene: {contact_info.notes or 'N/A'}

NARUČENI PROIZVODI:
"""
            for idx, item in enumerate(items, 1):
                order_details_content += f"\n{idx}. {item.productName} - {item.variantName}"
                order_details_content += f"\n   Količina: {item.quantity}"
                order_details_content += f"\n   Cena: {item.price} RSD"
                order_details_content += f"\n   Fotografije: {', '.join(item.photoFileNames)}"
                if item.customText:
                    order_details_content += f"\n   Custom tekst: {item.customText}"
                order_details_content += "\n"
            
            order_details_content += f"\n\nUKUPNO:\n"
            order_details_content += f"Proizvodi: {order_data.get('totalPrice', 0)} RSD\n"
            order_details_content += f"Dostava: {order_data.get('deliveryFee', 0)} RSD\n"
            order_details_content += f"UKUPNO ZA PLAĆANJE: {order_data.get('grandTotal', 0)} RSD\n"
            
            # Add order details to ZIP
            zipf.writestr('order_details.txt', order_details_content.encode('utf-8'))
        
        logging.info(f"Step 6: ✅ ZIP created at {zip_path}")
        
        # Update order with ZIP path
        await db.product_orders.update_one(
            {"orderNumber": order_number},
            {"$set": {"zipFilePath": str(zip_path)}}
        )
        
        logging.info("=" * 80)
        logging.info(f"PRODUCT ORDER {order_number} COMPLETED SUCCESSFULLY ✅")
        logging.info("=" * 80)
        
        return ProductOrderResponse(
            success=True,
            orderNumber=order_number,
            message="Product order created successfully",
            zipFilePath=str(zip_path)
        )
        
    except json.JSONDecodeError:
        logging.error("JSON parsing error in product order")
        raise HTTPException(status_code=400, detail="Invalid order details format")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating product order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create product order: {str(e)}")

# ============================================================================
# ADMIN: PRODUCTS MANAGEMENT
# ============================================================================

# Get all products (admin)
@api_router.get("/admin/products")
async def admin_get_products(admin = Depends(verify_admin_token)):
    """Get all products (including unavailable) for admin"""
    try:
        products = await db.products.find({}, {"_id": 0}).to_list(1000)
        return {"success": True, "products": products}
    except Exception as e:
        logging.error(f"Error fetching products for admin: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")

# Upload product image (admin only)
@api_router.post("/admin/products/upload-image")
async def upload_product_image(
    image: UploadFile = File(...),
    admin = Depends(verify_admin_token)
):
    """Upload product image and return URL"""
    try:
        # Validate file
        ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
        ALLOWED_MIME_TYPES = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp'}
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        
        file_ext = os.path.splitext(image.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Nedozvoljen tip fajla. Dozvoljeni: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        if image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Nedozvoljen MIME tip: {image.content_type}"
            )
        
        # Read and validate size
        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Fajl je prevelik. Maksimalna veličina je 10MB"
            )
        
        # Generate unique filename
        import uuid
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = PRODUCT_IMAGES_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return URL path (relative to backend)
        image_url = f"/uploads/products/{unique_filename}"
        
        logging.info(f"Product image uploaded: {unique_filename}")
        return {
            "success": True,
            "imageUrl": image_url,
            "message": "Fotografija uspešno uploadovana"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error uploading product image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

# Create product (admin only)
@api_router.post("/admin/products")
async def admin_create_product(product: ProductCreate, admin = Depends(verify_admin_token)):
    """Create a new product"""
    try:
        import uuid
        product_id = str(uuid.uuid4())
        
        product_doc = {
            "id": product_id,
            **product.model_dump(),
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        
        await db.products.insert_one(product_doc)
        logging.info(f"Product created: {product_id} - {product.name}")
        
        return {"success": True, "message": "Product created successfully", "productId": product_id}
    except Exception as e:
        logging.error(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create product")

# Update product (admin only)
@api_router.put("/admin/products/{product_id}")
async def admin_update_product(
    product_id: str,
    product: ProductUpdate,
    admin = Depends(verify_admin_token)
):
    """Update an existing product"""
    try:
        update_data = {k: v for k, v in product.model_dump().items() if v is not None}
        update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.products.update_one(
            {"id": product_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        logging.info(f"Product updated: {product_id}")
        return {"success": True, "message": "Product updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating product: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update product")

# Delete product (admin only)
@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin = Depends(verify_admin_token)):
    """Delete a product"""
    try:
        result = await db.products.delete_one({"id": product_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        logging.info(f"Product deleted: {product_id}")
        return {"success": True, "message": "Product deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting product: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete product")

# Get all product orders (admin)
@api_router.get("/admin/product-orders")
async def admin_get_product_orders(admin = Depends(verify_admin_token)):
    """Get all product orders for admin"""
    try:
        orders = await db.product_orders.find({}, {"_id": 0}).to_list(1000)
        
        # Calculate stats
        total = len(orders)
        pending = len([o for o in orders if o.get('status') == 'Na Čekanju'])
        in_progress = len([o for o in orders if o.get('status') == 'U Pripremi'])
        completed = len([o for o in orders if o.get('status') in ['Poslato', 'Završeno']])
        
        return {
            "success": True,
            "orders": orders,
            "stats": {
                "total": total,
                "pending": pending,
                "inProgress": in_progress,
                "completed": completed
            }
        }
    except Exception as e:
        logging.error(f"Error fetching product orders: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch product orders")

# Update product order status (admin)
@api_router.put("/admin/product-orders/{order_number}/status")
async def admin_update_product_order_status(
    order_number: str,
    status_data: dict,
    admin = Depends(verify_admin_token)
):
    """Update product order status"""
    try:
        new_status = status_data.get('status')
        if not new_status:
            raise HTTPException(status_code=400, detail="Status is required")
        
        result = await db.product_orders.update_one(
            {"orderNumber": order_number},
            {"$set": {
                "status": new_status,
                "updatedAt": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product order not found")
        
        logging.info(f"Product order {order_number} status updated to: {new_status}")
        return {"success": True, "message": "Status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating product order status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update status")

# Download product order ZIP (admin)
@api_router.get("/admin/product-orders/{order_number}/download")
async def admin_download_product_order(order_number: str, admin = Depends(verify_admin_token)):
    """Download product order ZIP file"""
    try:
        order = await db.product_orders.find_one({"orderNumber": order_number})
        if not order:
            raise HTTPException(status_code=404, detail="Product order not found")
        
        zip_path = order.get('zipFilePath')
        if not zip_path or not os.path.exists(zip_path):
            raise HTTPException(status_code=404, detail="ZIP file not found")
        
        return FileResponse(
            path=zip_path,
            filename=f"product_order-{order_number}.zip",
            media_type="application/zip"
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error downloading product order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download product order")

# Delete product order (admin)
@api_router.delete("/admin/product-orders/{order_number}")
async def admin_delete_product_order(order_number: str, admin = Depends(verify_admin_token)):
    """Delete a product order"""
    try:
        order = await db.product_orders.find_one({"orderNumber": order_number})
        if not order:
            raise HTTPException(status_code=404, detail="Product order not found")
        
        # Delete ZIP file
        zip_path = order.get('zipFilePath')
        if zip_path and os.path.exists(zip_path):
            os.remove(zip_path)
        
        # Delete order directory
        order_dir = ORDERS_DIR / f"product_{order_number}"
        if order_dir.exists():
            shutil.rmtree(order_dir)
        
        # Delete from database
        await db.product_orders.delete_one({"orderNumber": order_number})
        
        logging.info(f"Product order deleted: {order_number}")
        return {"success": True, "message": "Product order deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting product order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete product order")

# Include the router in the main app
app.include_router(api_router)

# Mount static files for product images
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Add CORS middleware - SECURE: Only allow your domain
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
if cors_origins == ['*']:
    # Production: restrict to your domain only
    cors_origins = [
        "https://fotoexpres.rs",
        "https://www.fotoexpres.rs",
        "http://localhost:3000"  # Development only
    ]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()