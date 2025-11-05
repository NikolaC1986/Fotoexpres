from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import jwt
import os

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Default admin credentials (change these in production!)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminToken(BaseModel):
    success: bool
    token: str
    message: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def verify_admin_credentials(username: str, password: str):
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD