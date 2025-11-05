from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
import shutil

from models.order import Order, OrderDetails, OrderResponse
from models.admin import AdminLogin, AdminToken, create_access_token, verify_token, verify_admin_credentials
from utils.order_utils import generate_order_number, create_order_zip
from utils.email_utils import send_order_notification


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create directories for orders
ORDERS_DIR = ROOT_DIR / "orders"
ORDERS_ZIPS_DIR = ROOT_DIR / "orders_zips"
ORDERS_DIR.mkdir(exist_ok=True)
ORDERS_ZIPS_DIR.mkdir(exist_ok=True)


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
        # Parse order details
        order_data = json.loads(order_details)
        order_details_obj = OrderDetails(**order_data)
        
        # Generate order number
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
            fill_white_option
        )
        
        # Save to MongoDB
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
        
        return OrderResponse(
            success=True,
            orderNumber=order_number,
            message="Order created successfully",
            zipFilePath=str(zip_path)
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
    if not verify_admin_credentials(credentials.username, credentials.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": credentials.username, "role": "admin"})
    
    return AdminToken(
        success=True,
        token=token,
        message="Login successful"
    )

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

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
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