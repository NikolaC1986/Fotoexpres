from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, Header, Request
from fastapi.responses import FileResponse
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

from models.order import Order, OrderDetails, OrderResponse
from models.admin import AdminLogin, AdminToken, ChangeCredentials, create_access_token, verify_token, verify_admin_credentials, update_env_file
from utils.order_utils import generate_order_number, create_order_zip
from utils.email_utils import send_order_notification


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
ORDERS_DIR.mkdir(exist_ok=True)
ORDERS_ZIPS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)


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
    order_details: str = Form(...)
):
    try:
        # SECURITY: Validate file uploads
        ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'}
        ALLOWED_MIME_TYPES = {
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/bmp', 'image/webp', 'image/heic', 'image/heif'
        }
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB per file
        
        for photo in photos:
            # Check file extension
            file_ext = os.path.splitext(photo.filename)[1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Nedozvoljen tip fajla: {file_ext}. Dozvoljeni: {', '.join(ALLOWED_EXTENSIONS)}"
                )
            
            # Check MIME type
            if photo.content_type not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Nedozvoljen MIME tip: {photo.content_type}"
                )
            
            # Check file size (read first chunk to verify it's not empty)
            content = await photo.read(MAX_FILE_SIZE + 1)
            if len(content) == 0:
                raise HTTPException(status_code=400, detail=f"Fajl je prazan: {photo.filename}")
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Fajl je prevelik: {photo.filename} (max 50MB)"
                )
            # Reset file pointer
            await photo.seek(0)
        
        # Parse order details
        order_data = json.loads(order_details)
        order_details_obj = OrderDetails(**order_data)
        
        # Check if this is a chunked upload
        is_chunked = 'chunkIndex' in order_data
        chunk_index = order_data.get('chunkIndex', 0)
        total_chunks = order_data.get('totalChunks', 1)
        is_last_chunk = order_data.get('isLastChunk', True)
        existing_order_number = order_data.get('orderNumber')
        
        # Generate or use existing order number
        if existing_order_number:
            order_number = existing_order_number
        else:
            order_number = generate_order_number()
        
        # Create order directory
        order_dir = ORDERS_DIR / order_number
        order_dir.mkdir(exist_ok=True)
        
        # Save photos
        saved_files = []
        for photo in photos:
            file_path = order_dir / photo.filename
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            saved_files.append(photo.filename)
        
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
        
        # Only create ZIP and save to MongoDB on last chunk (or if not chunked)
        if is_last_chunk:
            # Create ZIP file
            zip_file_name = f"order-{order_number}.zip"
            zip_path = ORDERS_ZIPS_DIR / zip_file_name
            
            create_order_zip(
                str(order_dir),
                str(zip_path),
                order_number,
                order_details_obj.contactInfo.model_dump(),
                [p.model_dump() for p in order_details_obj.photoSettings],
                total_photos,
                crop_option,
                fill_white_option,
                price_info
            )
            
            # Save to MongoDB only if not already exists
            existing_order = await db.orders.find_one({"orderNumber": order_number})
            if not existing_order:
                order = Order(
                    orderNumber=order_number,
                    contactInfo=order_details_obj.contactInfo,
                    photoSettings=order_details_obj.photoSettings,
                    zipFilePath=str(zip_path),
                    totalPhotos=total_photos
                )
                
                await db.orders.insert_one(order.model_dump())
            
            # Send email notification to admin
            try:
                send_order_notification(
                    order_number,
                    order_details_obj.contactInfo.model_dump(),
                    [p.model_dump() for p in order_details_obj.photoSettings],
                    total_photos,
                    str(zip_path)
                )
                logging.info(f"Email notification sent for order {order_number}")
            except Exception as email_error:
                logging.error(f"Failed to send email for order {order_number}: {str(email_error)}")
                # Don't fail the order creation if email fails
        else:
            logging.info(f"Received chunk {chunk_index + 1}/{total_chunks} for order {order_number}")
        
        # Return response
        if is_last_chunk:
            return OrderResponse(
                success=True,
                orderNumber=order_number,
                message="Order created successfully",
                zipFilePath=str(zip_path)
            )
        else:
            return OrderResponse(
                success=True,
                orderNumber=order_number,
                message=f"Chunk {chunk_index + 1}/{total_chunks} uploaded successfully",
                zipFilePath=""
            )
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid order details format")
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
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
async def admin_login(credentials: AdminLogin):
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
                    "updatedAt": datetime.now(timezone.utc).isoformat()
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
            'heroImageUrl': 'https://customer-assets.emergentagent.com/job_swift-image-portal/artifacts/1ogmpeji_8%20copy.jpg'
        }
        
        if settings_doc:
            return {"settings": settings_doc.get("settings", default_settings)}
        else:
            return {"settings": default_settings}
    except Exception as e:
        logging.error(f"Error fetching settings: {str(e)}")
        return {"settings": {'freeDeliveryLimit': 5000}}

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
            'message': '10% popusta na sve porudžbine!'
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
            'message': '10% popusta na sve porudžbine!'
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

# Include the router in the main app
app.include_router(api_router)

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