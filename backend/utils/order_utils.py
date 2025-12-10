import os
import zipfile
from datetime import datetime
from pathlib import Path

def generate_order_number():
    """Generate unique order number"""
    import random
    return f"ORD-{random.randint(100000, 999999)}"

def create_order_details_txt(order_number, contact_info, photo_settings, total_photos, crop_option=False, fill_white_option=False, 
                            price_info=None, products=None):
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
Ulica i broj: {contact_info.get('street', '')}
Poštanski broj: {contact_info.get('postalCode', '')}
Grad: {contact_info.get('city', '')}
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
    
    # Add products section if any products were ordered
    if products and len(products) > 0:
        content += f"""
═══════════════════════════════════════════════════════════════════

DODATNI PROIZVODI:
───────────────────────────
"""
        products_subtotal = 0
        for i, product in enumerate(products, 1):
            product_total = product.get('price', 0) * product.get('quantity', 1)
            products_subtotal += product_total
            
            content += f"""
{i}. {product.get('productName', '')} - {product.get('variantName', '')}
   Količina: {product.get('quantity', 1)} kom
   Cena: {product.get('price', 0)} RSD
   Ukupno: {product_total} RSD"""
            
            if product.get('customText'):
                content += f"""
   Custom tekst: {product.get('customText', '')}"""
            
            if product.get('dedicatedPhotoCount', 0) > 0:
                content += f"""
   Fotografije namenjene za ovaj proizvod: {product.get('dedicatedPhotoCount', 0)} kom"""
            
            content += """
   ───────────────────────────
"""
        
        content += f"""
Ukupna cena proizvoda: {products_subtotal} RSD

"""
    else:
        products_subtotal = 0

    content += f"""
═══════════════════════════════════════════════════════════════════

OBRAČUN CENE:
─────────────────────────
"""
    
    # Calculate pricing details - use subtotal (locally calculated) as base price
    # This ensures we show the correct photo price before any discounts or delivery
    quantity_discount_amount = 0
    promotion_discount_amount = 0
    quantity_discount_percent = 0
    promotion_discount_percent = 0
    
    if price_info:
        quantity_discount_amount = price_info.get('quantityDiscountAmount', 0)
        promotion_discount_amount = price_info.get('promotionDiscountAmount', 0)
        quantity_discount_percent = price_info.get('quantityDiscountPercent', 0)
        promotion_discount_percent = price_info.get('promotionDiscountPercent', 0)
    
    content += f"""
Ukupan broj fotografija: {total_photos} komada
Osnovna cena fotografija: {subtotal} RSD"""
    
    if products_subtotal > 0:
        content += f"""
Dodatni proizvodi: {products_subtotal} RSD"""
    
    content += """
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
        price_after_discount = subtotal - total_discount
        content += f"""
──────────────────────────────
Ukupan popust: -{total_discount} RSD
Cena fotografija sa popustom: {price_after_discount} RSD
"""
    else:
        price_after_discount = subtotal
    
    # Add products to price after discount
    price_after_discount_with_products = price_after_discount + products_subtotal
    
    # Delivery fee - use from price_info or default to 400
    delivery_fee = price_info.get('deliveryFee', 400) if price_info else 400
    delivery_price = price_info.get('deliveryPrice', 400) if price_info else 400
    free_delivery_limit = price_info.get('freeDeliveryLimit', 5000) if price_info else 5000
    
    if delivery_fee == 0:
        content += f"""
Dostava: BESPLATNO
   • Besplatna dostava za porudžbine preko {free_delivery_limit} RSD
"""
    else:
        content += f"""
Dostava: {delivery_fee} RSD
   • Standardna dostava
"""
    
    grand_total = price_after_discount_with_products + delivery_fee
    
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

def create_order_zip(order_dir, zip_path, order_number, contact_info, photo_settings, total_photos, crop_option=False, fill_white_option=False, price_info=None, products=None):
    """Create ZIP file with photos organized by format and paper type"""
    
    # Create order_details.txt with summary
    order_details_content = create_order_details_txt(
        order_number, contact_info, photo_settings, total_photos, crop_option, fill_white_option, price_info, products
    )
    
    # Add photo count summary by format
    format_counts = {}
    for photo in photo_settings:
        photo_format = photo['format']
        format_counts[photo_format] = format_counts.get(photo_format, 0) + photo['quantity']
    
    summary = "\n\n═══════════════════════════════════════════════════════════════════\n\n"
    summary += "REKAPITULACIJA PO FORMATIMA:\n"
    summary += "─────────────────────────────\n"
    for fmt, count in sorted(format_counts.items()):
        summary += f"Format {fmt} cm: {count} fotografija\n"
    summary += f"\n──────────────────────────────\n"
    summary += f"UKUPNO: {total_photos} fotografija\n"
    summary += "\n═══════════════════════════════════════════════════════════════════\n"
    
    order_details_content += summary
    
    order_details_path = os.path.join(order_dir, 'order_details.txt')
    with open(order_details_path, 'w', encoding='utf-8') as f:
        f.write(order_details_content)
    
    # Create ZIP file with organized structure
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add order_details.txt to root
        zipf.write(order_details_path, 'order_details.txt')
        
        # Organize photos by format, paper type, and quantity
        for photo_setting in photo_settings:
            photo_path = os.path.join(order_dir, photo_setting['fileName'])
            if os.path.exists(photo_path):
                photo_format = photo_setting['format']
                paper_type = photo_setting['finish'].lower()  # 'sjajni' or 'mat'
                quantity = photo_setting['quantity']  # broj primeraka
                
                # Create folder structure: format/paper_type/quantity/photo.jpg
                archive_path = f"{photo_format}/{paper_type}/{quantity}/{photo_setting['fileName']}"
                zipf.write(photo_path, archive_path)
        
        # Add product-specific photos if any
        if products:
            product_photos_dir = os.path.join(order_dir, 'product_photos')
            if os.path.exists(product_photos_dir):
                for product_idx, product in enumerate(products):
                    if product.get('photoFileNames'):
                        product_folder_name = f"PROIZVOD_{product_idx + 1}_{product.get('productName', 'Unknown').replace(' ', '_')}"
                        
                        for photo_name in product.get('photoFileNames', []):
                            product_photo_path = os.path.join(product_photos_dir, f"product_{product_idx}_{photo_name}")
                            if os.path.exists(product_photo_path):
                                archive_path = f"{product_folder_name}/{photo_name}"
                                zipf.write(product_photo_path, archive_path)
    
    return zip_path