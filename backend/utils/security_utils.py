"""
Security utility functions for input validation and sanitization
"""
import re
from typing import Optional
from fastapi import HTTPException

def sanitize_string(text: str, max_length: int = 500) -> str:
    """
    Sanitize string input by removing potentially harmful characters
    """
    if not text:
        return ""
    
    # Remove any null bytes
    text = text.replace('\x00', '')
    
    # Strip whitespace
    text = text.strip()
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]
    
    return text

def validate_email(email: str) -> str:
    """
    Validate email format
    """
    email = sanitize_string(email, 254)  # Max email length per RFC
    
    # Basic email regex
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_regex, email):
        raise HTTPException(status_code=400, detail="Neispravna email adresa")
    
    return email.lower()

def validate_phone(phone: str) -> str:
    """
    Validate and sanitize phone number (Serbian format)
    """
    phone = sanitize_string(phone, 20)
    
    # Remove common formatting characters
    phone = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Check if it contains only digits and optional + at start
    if not re.match(r'^\+?[0-9]{8,15}$', phone):
        raise HTTPException(status_code=400, detail="Neispravian broj telefona")
    
    return phone

def validate_name(name: str) -> str:
    """
    Validate name (only letters, spaces, and common Serbian characters)
    """
    name = sanitize_string(name, 100)
    
    if not name:
        raise HTTPException(status_code=400, detail="Ime ne može biti prazno")
    
    # Allow letters (including Serbian), spaces, hyphens, apostrophes
    if not re.match(r"^[a-zA-ZčćšđžČĆŠĐŽ\s\-']+$", name):
        raise HTTPException(status_code=400, detail="Ime sadrži nedozvoljene karaktere")
    
    return name

def validate_address(address: str) -> str:
    """
    Validate address
    """
    address = sanitize_string(address, 200)
    
    if not address:
        raise HTTPException(status_code=400, detail="Adresa ne može biti prazna")
    
    # Allow alphanumeric, Serbian characters, spaces, commas, periods, hyphens
    if not re.match(r"^[a-zA-Z0-9čćšđžČĆŠĐŽ\s,.\-/]+$", address):
        raise HTTPException(status_code=400, detail="Adresa sadrži nedozvoljene karaktere")
    
    return address

def validate_city(city: str) -> str:
    """
    Validate city name
    """
    city = sanitize_string(city, 100)
    
    if not city:
        raise HTTPException(status_code=400, detail="Grad ne može biti prazan")
    
    # Allow letters and spaces
    if not re.match(r"^[a-zA-ZčćšđžČĆŠĐŽ\s\-]+$", city):
        raise HTTPException(status_code=400, detail="Naziv grada sadrži nedozvoljene karaktere")
    
    return city

def validate_zip_code(zip_code: str) -> str:
    """
    Validate Serbian postal code (5 digits)
    """
    zip_code = sanitize_string(zip_code, 10)
    
    # Remove spaces
    zip_code = zip_code.replace(' ', '')
    
    if not re.match(r'^\d{5}$', zip_code):
        raise HTTPException(status_code=400, detail="Neispravian poštanski broj (očekuje se 5 cifara)")
    
    return zip_code

def validate_positive_number(value: int, field_name: str = "Vrednost") -> int:
    """
    Validate that number is positive
    """
    if value < 0:
        raise HTTPException(status_code=400, detail=f"{field_name} ne može biti negativan")
    
    return value

def validate_price(price: float, field_name: str = "Cena") -> float:
    """
    Validate price is positive and reasonable
    """
    if price < 0:
        raise HTTPException(status_code=400, detail=f"{field_name} ne može biti negativna")
    
    if price > 1000000:  # 1 million RSD limit
        raise HTTPException(status_code=400, detail=f"{field_name} je prevelika")
    
    return price

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks
    """
    # Remove path components
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Keep only alphanumeric, dots, hyphens, underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    return filename
