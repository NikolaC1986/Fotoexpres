from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import jwt
import os

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Admin credentials from environment variables
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'Vlasnik')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '$ta$Graca25')

# Viewer credentials (read-only access)
VIEWER_USERNAME = os.environ.get('VIEWER_USERNAME', 'Menadzer')
VIEWER_PASSWORD = os.environ.get('VIEWER_PASSWORD', 'Menadzer2025!')

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminToken(BaseModel):
    success: bool
    token: str
    message: str
    role: str  # "admin" or "viewer"

class ChangeCredentials(BaseModel):
    currentPassword: str
    newUsername: Optional[str] = None
    newPassword: Optional[str] = None

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
    """Verify credentials and return role"""
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return "admin"
    elif username == VIEWER_USERNAME and password == VIEWER_PASSWORD:
        return "viewer"
    return None

def update_env_file(new_username: str = None, new_password: str = None):
    """Update .env file with new credentials"""
    from pathlib import Path
    
    env_path = Path(__file__).parent.parent / '.env'
    
    if not env_path.exists():
        return False
    
    # Read current .env content
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    # Update lines
    new_lines = []
    username_found = False
    password_found = False
    
    for line in lines:
        if new_username and line.startswith('ADMIN_USERNAME='):
            new_lines.append(f'ADMIN_USERNAME="{new_username}"\n')
            username_found = True
        elif new_password and line.startswith('ADMIN_PASSWORD='):
            new_lines.append(f'ADMIN_PASSWORD="{new_password}"\n')
            password_found = True
        else:
            new_lines.append(line)
    
    # Add if not found
    if new_username and not username_found:
        new_lines.append(f'\nADMIN_USERNAME="{new_username}"\n')
    if new_password and not password_found:
        new_lines.append(f'ADMIN_PASSWORD="{new_password}"\n')
    
    # Write back
    with open(env_path, 'w') as f:
        f.writelines(new_lines)
    
    # Update global variables
    global ADMIN_USERNAME, ADMIN_PASSWORD
    if new_username:
        ADMIN_USERNAME = new_username
        os.environ['ADMIN_USERNAME'] = new_username
    if new_password:
        ADMIN_PASSWORD = new_password
        os.environ['ADMIN_PASSWORD'] = new_password
    
    return True