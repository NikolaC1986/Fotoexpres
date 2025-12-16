from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PromoCode(BaseModel):
    """Promo kod za popust"""
    code: str = Field(..., min_length=5, max_length=5, description="5-character promo code")
    discountPercent: int = Field(..., ge=1, le=100, description="Discount percentage 1-100")
    timesUsed: int = Field(default=0, description="Number of times code was used")
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    createdBy: str = Field(default="admin", description="Admin who created the code")

class PromoCodeResponse(BaseModel):
    success: bool
    message: str
    code: Optional[PromoCode] = None
    discount: Optional[int] = None
