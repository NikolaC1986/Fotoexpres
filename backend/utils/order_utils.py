import os
import zipfile
from datetime import datetime
from pathlib import Path

def generate_order_number():
    """Generate unique order number"""
    import random
    return f"ORD-{random.randint(100000, 999999)}"

def create_order_details_txt(order_number, contact_info, photo_settings, total_photos, crop_option=False, fill_white_option=False):
    """Create formatted order details text file content"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    content = f"""ORDER NUMBER: {order_number}
DATE: {now}

CUSTOMER INFORMATION:
Name: {contact_info.get('fullName', '')}
Email: {contact_info.get('email', '')}
Phone: {contact_info.get('phone', '')}
Address: {contact_info.get('address', '')}
Notes: {contact_info.get('notes', 'N/A')}

PHOTO PROCESSING OPTIONS:
Kropovati fotografiju kako bi je prilagodili formatu: {"DA" if crop_option else "NE"}
Popunite belim: {"DA" if fill_white_option else "NE"}

PHOTO DETAILS:
"""
    
    for i, photo in enumerate(photo_settings, 1):
        content += f"""---
Photo {i}: {photo['fileName']}
Format: {photo['format']} cm
Quantity: {photo['quantity']}
Finish: {photo['finish'].capitalize()}
"""
    
    content += f"\nTOTAL PHOTOS: {total_photos} prints\n"
    return content

def create_order_zip(order_dir, zip_path, order_number, contact_info, photo_settings, total_photos):
    """Create ZIP file with photos and order details"""
    # Create order_details.txt
    order_details_content = create_order_details_txt(
        order_number, contact_info, photo_settings, total_photos
    )
    
    order_details_path = os.path.join(order_dir, 'order_details.txt')
    with open(order_details_path, 'w', encoding='utf-8') as f:
        f.write(order_details_content)
    
    # Create ZIP file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add order_details.txt
        zipf.write(order_details_path, 'order_details.txt')
        
        # Add all photos
        for photo_setting in photo_settings:
            photo_path = os.path.join(order_dir, photo_setting['fileName'])
            if os.path.exists(photo_path):
                zipf.write(photo_path, photo_setting['fileName'])
    
    return zip_path