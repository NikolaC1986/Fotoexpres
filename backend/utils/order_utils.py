import os
import zipfile
from datetime import datetime
from pathlib import Path

def generate_order_number():
    """Generate unique order number"""
    import random
    return f"ORD-{random.randint(100000, 999999)}"

def create_order_details_txt(order_number, contact_info, photo_settings, total_photos, crop_option=False, fill_white_option=False, 
                            price_info=None):
    """Create formatted order details text file content with pricing details"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    content = f"""╔═══════════════════════════════════════════════════════════════════╗
║                    FOTOEXPRES - DETALJI PORUDŽBINE                ║
╚═══════════════════════════════════════════════════════════════════╝

BROJ PORUDŽBINE: {order_number}
DATUM: {now}

═══════════════════════════════════════════════════════════════════

INFORMACIJE O KLIJENTU:
─────────────────────────
Ime i prezime: {contact_info.get('fullName', '')}
Email: {contact_info.get('email', '')}
Telefon: {contact_info.get('phone', '')}
Adresa: {contact_info.get('address', '')}
Napomene: {contact_info.get('notes', 'Nema napomena')}

═══════════════════════════════════════════════════════════════════

OPCIJE OBRADE FOTOGRAFIJA:
───────────────────────────
• Kropovati fotografiju kako bi je prilagodili formatu: {"DA" if crop_option else "NE"}
• Popuniti belim: {"DA" if fill_white_option else "NE"}

═══════════════════════════════════════════════════════════════════

SPECIFIKACIJA FOTOGRAFIJA:
───────────────────────────
"""
    
    # Default price map
    price_map = {
        '9x13': 12,
        '10x15': 18,
        '13x18': 25,
        '15x21': 50,
        '20x30': 150,
        '30x45': 250
    }
    
    # Use provided prices if available
    if price_info and 'prices' in price_info:
        price_map.update(price_info['prices'])
    
    subtotal = 0
    for i, photo in enumerate(photo_settings, 1):
        photo_format = photo['format']
        quantity = photo['quantity']
        unit_price = price_map.get(photo_format, 0)
        line_total = unit_price * quantity
        subtotal += line_total
        
        content += f"""
{i}. {photo['fileName']}
   Format: {photo_format} cm
   Tip papira: {photo['finish'].capitalize()}
   Količina: {quantity} kom
   Cena po komadu: {unit_price} RSD
   Ukupno za ovu fotografiju: {line_total} RSD
   ───────────────────────────
"""
    
    content += f"""
═══════════════════════════════════════════════════════════════════

OBRAČUN CENE:
─────────────────────────
"""
    
    # Calculate pricing details
    total_base_price = subtotal
    quantity_discount_amount = 0
    promotion_discount_amount = 0
    quantity_discount_percent = 0
    promotion_discount_percent = 0
    
    if price_info:
        total_base_price = price_info.get('totalPrice', subtotal)
        quantity_discount_amount = price_info.get('quantityDiscountAmount', 0)
        promotion_discount_amount = price_info.get('promotionDiscountAmount', 0)
        quantity_discount_percent = price_info.get('quantityDiscountPercent', 0)
        promotion_discount_percent = price_info.get('promotionDiscountPercent', 0)
    
    content += f"""
Ukupan broj fotografija: {total_photos} komada
Osnovna cena fotografija: {total_base_price} RSD
"""
    
    # Add discount details if applicable
    if quantity_discount_amount > 0:
        content += f"""
POPUST NA KOLIČINU ({quantity_discount_percent}%): -{quantity_discount_amount} RSD
   • Odobren za {total_photos}+ fotografija
"""
    
    if promotion_discount_amount > 0:
        content += f"""
AKCIJSKI POPUST ({promotion_discount_percent}%): -{promotion_discount_amount} RSD
   • Specijalna akcija
"""
    
    total_discount = quantity_discount_amount + promotion_discount_amount
    if total_discount > 0:
        price_after_discount = total_base_price - total_discount
        content += f"""
──────────────────────────────
Ukupan popust: -{total_discount} RSD
Cena sa popustom: {price_after_discount} RSD
"""
    else:
        price_after_discount = total_base_price
    
    # Delivery fee
    delivery_fee = price_info.get('deliveryFee', 400) if price_info else 400
    free_delivery_limit = price_info.get('freeDeliveryLimit', 5000) if price_info else 5000
    
    if delivery_fee == 0:
        content += f"""
Dostava: BESPLATNO
   • Besplatna dostava za porudžbine preko {free_delivery_limit} RSD
"""
    else:
        content += f"""
Dostava: {delivery_fee} RSD
"""
    
    grand_total = price_after_discount + delivery_fee
    
    content += f"""
──────────────────────────────
UKUPNO ZA NAPLATU: {grand_total} RSD
"""
    
    if total_discount > 0:
        content += f"""
──────────────────────────────
✓ UŠTEDELI STE: {total_discount} RSD
"""
    
    content += f"""
═══════════════════════════════════════════════════════════════════

NAČIN PLAĆANJA: Plaćanje pouzećem (kuriru prilikom isporuke)
ROK DOSTAVE: 2-7 radnih dana

═══════════════════════════════════════════════════════════════════

Hvala vam što ste odabrali Fotoexpres!
Za sva pitanja kontaktirajte nas na: kontakt@fotoexpres.rs

═══════════════════════════════════════════════════════════════════
"""
    
    return content

def create_order_zip(order_dir, zip_path, order_number, contact_info, photo_settings, total_photos, crop_option=False, fill_white_option=False, price_info=None):
    """Create ZIP file with photos and order details"""
    # Create order_details.txt
    order_details_content = create_order_details_txt(
        order_number, contact_info, photo_settings, total_photos, crop_option, fill_white_option, price_info
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