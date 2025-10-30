from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ContactInfo(BaseModel):
    fullName: str
    email: str
    phone: str
    address: str
    notes: Optional[str] = ""

class PhotoSetting(BaseModel):
    fileName: str
    format: str
    quantity: int
    finish: str

class OrderDetails(BaseModel):
    contactInfo: ContactInfo
    photoSettings: List[PhotoSetting]

class Order(BaseModel):
    orderNumber: str
    status: str = "pending"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    contactInfo: ContactInfo
    photoSettings: List[PhotoSetting]
    zipFilePath: str
    totalPhotos: int

class OrderResponse(BaseModel):
    success: bool
    orderNumber: str
    message: str
    zipFilePath: str