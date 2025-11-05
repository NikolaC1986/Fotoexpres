import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import logging

logger = logging.getLogger(__name__)

# Email configuration from environment variables
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@photolia.rs')

def send_order_notification(order_number, contact_info, photo_settings, total_photos, zip_file_path):
    """
    Send email notification to admin when new order is received
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning("Email credentials not configured. Skipping email notification.")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = f'Nova Porudžbina - {order_number}'
        
        # Email body in Serbian
        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563EB;">Nova Porudžbina Primljena!</h2>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Broj Porudžbine: {order_number}</h3>
            </div>
            
            <h3>Informacije o Kupcu:</h3>
            <ul>
              <li><strong>Ime i Prezime:</strong> {contact_info['fullName']}</li>
              <li><strong>Email:</strong> {contact_info['email']}</li>
              <li><strong>Telefon:</strong> {contact_info['phone']}</li>
              <li><strong>Adresa:</strong> {contact_info['address']}</li>
              {f"<li><strong>Napomene:</strong> {contact_info['notes']}</li>" if contact_info.get('notes') else ''}
            </ul>
            
            <h3>Detalji Porudžbine:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #2563EB; color: white;">
                <th style="padding: 10px; text-align: left;">Fotografija</th>
                <th style="padding: 10px; text-align: left;">Format</th>
                <th style="padding: 10px; text-align: left;">Količina</th>
                <th style="padding: 10px; text-align: left;">Završetak</th>
              </tr>
        """
        
        for idx, photo in enumerate(photo_settings, 1):
            bg_color = '#f9fafb' if idx % 2 == 0 else 'white'
            body += f"""
              <tr style="background: {bg_color};">
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{photo['fileName']}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{photo['format']} cm</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{photo['quantity']}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{photo['finish'].capitalize()}</td>
              </tr>
            """
        
        body += f"""
            </table>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563EB;">
              <p style="margin: 0; font-size: 18px;"><strong>Ukupno fotografija: {total_photos} komada</strong></p>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280;">ZIP fajl sa fotografijama i detaljima porudžbine je priložen uz ovaj email.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;"/>
            <p style="color: #9ca3af; font-size: 12px;">Ovo je automatska poruka iz sistema Photolia.</p>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Attach ZIP file if it exists
        if os.path.exists(zip_file_path):
            with open(zip_file_path, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= order-{order_number}.zip',
                )
                msg.attach(part)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Order notification email sent successfully for {order_number}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}")
        return False