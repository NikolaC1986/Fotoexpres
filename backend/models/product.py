from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

class ProductVariant(BaseModel):
    """Varijanta proizvoda (npr. album 50 fotografija, keramička šolja)"""
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str  # npr. "50 fotografija", "Keramička", "Okrugao"
    description: Optional[str] = ""
    price: float
    available: bool = True

class Product(BaseModel):
    """Osnovni model proizvoda"""
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str  # "Album", "Šolja", "Privezak"
    type: str  # "album", "mug", "keychain"
    description: str
    imageUrl: str  # URL slike proizvoda
    variants: List[ProductVariant]
    available: bool = True
    minPhotos: int = 1  # Minimalan broj fotografija
    maxPhotos: int = 1  # Maksimalan broj fotografija
    allowCustomText: bool = False  # Da li dozvoljava custom tekst
    requiresPhotoUpload: bool = False  # Da li proizvod zahteva upload fotografije od korisnika (za šolje, privezke, itd)
    isFeatured: bool = False  # Da li je proizvod istaknut na početnoj strani (NOVO U PONUDI)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProductOrderItem(BaseModel):
    """Stavka u product narudžbini"""
    model_config = ConfigDict(extra="ignore")
    
    productId: str
    productName: str
    productType: str
    variantId: str
    variantName: str
    quantity: int = 1
    price: float
    photoFileNames: List[str]  # Lista fajlova koje je korisnik uploadovao
    customText: Optional[str] = ""

class ContactInfo(BaseModel):
    """Kontakt informacije kupca"""
    model_config = ConfigDict(extra="ignore")
    
    fullName: str
    email: str
    phone: str
    street: str
    postalCode: str
    city: str
    notes: Optional[str] = ""

class ProductOrder(BaseModel):
    """Narudžbina proizvoda"""
    model_config = ConfigDict(extra="ignore")
    
    orderNumber: str
    contactInfo: ContactInfo
    items: List[ProductOrderItem]
    totalPrice: float
    deliveryFee: float
    grandTotal: float
    status: str = "Na Čekanju"  # "Na Čekanju", "U Pripremi", "Poslato", "Završeno"
    zipFilePath: Optional[str] = ""
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: Optional[str] = None

class ProductOrderResponse(BaseModel):
    """Response model za kreiranje product order-a"""
    success: bool
    orderNumber: str
    message: str
    zipFilePath: Optional[str] = ""

# Request models for API

class ProductCreate(BaseModel):
    """Model za kreiranje novog proizvoda"""
    name: str
    type: str
    description: str
    imageUrl: str
    variants: List[ProductVariant]
    available: bool = True
    minPhotos: int = 1
    maxPhotos: int = 1
    allowCustomText: bool = False
    requiresPhotoUpload: bool = False

class ProductUpdate(BaseModel):
    """Model za update proizvoda"""
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    variants: Optional[List[ProductVariant]] = None
    available: Optional[bool] = None
    minPhotos: Optional[int] = None
    maxPhotos: Optional[int] = None
    allowCustomText: Optional[bool] = None
    requiresPhotoUpload: Optional[bool] = None
