from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ContactInfo(BaseModel):
    fullName: str
    email: str
    phone: str
    street: str
    postalCode: str
    city: str
    notes: Optional[str] = ""

class PhotoSetting(BaseModel):
    fileName: str
    format: str
    quantity: int
    finish: str

class ProductItem(BaseModel):
    """Proizvod dodat u porudžbinu fotografija"""
    productId: str
    productName: str
    productType: str
    variantId: str
    variantName: str
    quantity: int = 1
    price: float
    customText: Optional[str] = ""
    dedicatedPhotoCount: Optional[int] = 0  # Broj fotografija namenjenih za ovaj proizvod

class OrderDetails(BaseModel):
    contactInfo: ContactInfo
    photoSettings: Optional[List[PhotoSetting]] = []
    products: Optional[List[ProductItem]] = []  # Dodati proizvodi

class Order(BaseModel):
    orderNumber: str
    status: str = "pending"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    contactInfo: ContactInfo
    photoSettings: Optional[List[PhotoSetting]] = []
    products: Optional[List[ProductItem]] = []  # Dodati proizvodi
    zipFilePath: str
    totalPhotos: int

class OrderResponse(BaseModel):
    success: bool
    orderNumber: str
    message: str
    zipFilePath: str