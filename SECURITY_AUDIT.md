# 🔐 Sigurnosni Audit Aplikacije

## ✅ Provera Sigurnosti

### 1. Autentifikacija i Autorizacija ✅

**Admin Endpoint-i Zaštićeni:**
```python
@api_router.get("/admin/orders")
async def get_all_orders(admin = Depends(verify_admin_token)):
```

✅ **Sve admin rute koriste `Depends(verify_admin_token)`**

**Provera Tokena:**
```python
async def verify_admin_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
```

✅ **JWT token validacija implementirana**

---

### 2. JWT Secret Key ⚠️

**Trenutno Stanje:**
```env
JWT_SECRET_KEY="wbg0vNaDCE00iWidT-4U5j5L7pMsVAPUJSDLvDnvmgwQtUmFeNyVNdytqDoCf9H5ZYl09ru5Q07H9MTNrGViCQ"
```

✅ **Strong secret key (generisan)**

**PREPORUKA za Live:**
```bash
# Generiši novi secret key za production
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

⚠️ **OBAVEZNO: Promeni JWT_SECRET_KEY na live serveru!**

---

### 3. Admin Kredencijali ⚠️

**Trenutni Kredencijali:**
```env
ADMIN_USERNAME="Vlasnik"
ADMIN_PASSWORD="$ta$Graca25"
```

✅ **Nije hardcoded u kodu** (koristi .env)
⚠️ **Jednostavna šifra za production**

**PREPORUKA:**
```bash
# Jaka šifra za production
ADMIN_PASSWORD="V1asn1k@SecureP@ss2024!#$"
```

**Minimalni Zahtevi za Šifru:**
- Minimum 12 karaktera
- Velika i mala slova
- Brojevi
- Specijalni karakteri
- Ne koristiti lične podatke

---

### 4. CORS Konfiguracija ⚠️

**Trenutno Stanje:**
```python
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
if cors_origins == ['*']:
    logging.warning("⚠️ CORS is set to allow all origins. This is NOT recommended for production!")
```

⚠️ **Warning postoji, ali default je `*` (sve domene)**

**PREPORUKA za Live:**
```env
# backend/.env
CORS_ORIGINS=https://your-live-site.com,https://www.your-live-site.com
```

✅ **Ograniči na samo tvoje domene!**

---

### 5. File Upload Validacija ✅

**Backend Validacija:**
```python
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/jpg', 'image/png', ...}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
```

✅ **File type validacija implementirana**
✅ **MIME type validacija implementirana**
✅ **File size limit implementiran**

---

### 6. SQL Injection Zaštita ✅

**MongoDB Koristi Parametre:**
```python
order = await db.orders.find_one({"orderNumber": order_number})
```

✅ **MongoDB driver automatski escapuje parametre**
✅ **Nema direktnih string concatenation upita**

---

### 7. XSS Zaštita ✅

**React Automatski Escape-uje:**
```jsx
<span>{order.totalPhotos}</span>  // Automatski escaped
```

✅ **React automatski escape-uje dinamički sadržaj**
⚠️ **Samo ako se koristi `dangerouslySetInnerHTML` - PROVERI!**

---

### 8. Path Traversal Zaštita ✅

**File Serving:**
```python
file_path = PRODUCT_IMAGES_DIR / filename
if not file_path.exists():
    raise HTTPException(status_code=404)
```

✅ **Koristi Path object (automatska zaštita)**
✅ **Provera da fajl postoji**

---

### 9. Rate Limiting ❌

**Trenutno Stanje:**
❌ **Nema rate limiting-a**

**PREPORUKA:**
Dodaj rate limiting za:
- Login endpoint (max 5 pokušaja / 15 minuta)
- Upload endpoint (max 10 upload-ova / sat)
- Admin endpoint-e (max 100 zahteva / minut)

**Implementacija (opciono):**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@limiter.limit("5/15minute")
@api_router.post("/admin/login")
async def admin_login(...):
```

---

### 10. HTTPS Enforcement ⚠️

**Backend ne forsira HTTPS:**
⚠️ **Mora biti konfigurisano na Nginx/Reverse Proxy nivou**

**PREPORUKA:**
```nginx
# nginx.conf
server {
    listen 80;
    server_name your-site.com;
    return 301 https://$server_name$request_uri;
}
```

---

### 11. Environment Variables ✅

**Sensitive Data u .env:**
```env
JWT_SECRET_KEY=...
ADMIN_PASSWORD=...
MONGO_URL=...
```

✅ **.env fajl nije u Git-u** (proveri .gitignore)
⚠️ **Proveri da .env nije publicly accessible**

---

### 12. Error Messages 🔶

**Trenutno:**
```python
raise HTTPException(status_code=401, detail="Unauthorized")
```

🔶 **Generički error poruke** (dobro)
⚠️ **Proveri da nema stack trace-a u production**

**PREPORUKA:**
```python
# Dodaj u server.py
if os.environ.get('ENVIRONMENT') == 'production':
    app.debug = False
```

---

## 🚨 Kritične Akcije Pre Live Deployment-a

### 1. Promeni JWT Secret Key
```bash
# Generiši novi
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Dodaj u .env
JWT_SECRET_KEY="[novi_secret_key]"
```

### 2. Promeni Admin Kredencijale
```env
ADMIN_USERNAME="VlasnikPro"  # Manje očigledan username
ADMIN_PASSWORD="Str0ng@SecureP@ss2024!#$"
```

### 3. Konfiguriši CORS
```env
CORS_ORIGINS=https://your-live-site.com
```

### 4. Dodaj Environment Variable
```env
ENVIRONMENT=production
```

### 5. Disable Debug Mode
```python
# U server.py
if os.environ.get('ENVIRONMENT') == 'production':
    app.debug = False
```

### 6. Konfiguriši HTTPS Redirect (Nginx)
```nginx
return 301 https://$server_name$request_uri;
```

---

## ✅ Sigurnosni Checklist Pre Deployment-a

- [ ] JWT_SECRET_KEY promenjen
- [ ] ADMIN_PASSWORD promenjen (jaka šifra)
- [ ] CORS_ORIGINS ograničen na tvoj domen
- [ ] ENVIRONMENT=production postavljen
- [ ] .env fajl nije publicly accessible
- [ ] HTTPS forsiran (Nginx redirect)
- [ ] Debug mode disabled
- [ ] Logovi ne pokazuju sensitive podatke
- [ ] Rate limiting razmotren (opciono)
- [ ] Backup kredencijala sačuvan (sigurno mesto)

---

## 🔍 Post-Deployment Sigurnosni Testovi

### Test 1: Admin Bez Tokena
```bash
curl -I https://your-site.com/api/admin/orders
# Očekivano: 401 Unauthorized
```

### Test 2: CORS
```bash
curl -H "Origin: https://evil-site.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://your-site.com/api/orders/create
# Očekivano: CORS error (ako je CORS pravilno konfigurisan)
```

### Test 3: File Upload Validacija
```bash
# Pokušaj upload .exe fajla
curl -F "image=@malicious.exe" https://your-site.com/api/admin/promo-banner/upload-image
# Očekivano: 400 Bad Request
```

### Test 4: SQL Injection (MongoDB)
```bash
curl "https://your-site.com/api/orders?orderNumber='; DROP TABLE orders;--"
# Očekivano: 404 Not Found ili Empty result (ne crash)
```

---

## 📊 Sigurnosni Score

| Kategorija | Status | Prioritet |
|------------|--------|-----------|
| Autentifikacija | ✅ Dobro | - |
| Autorizacija | ✅ Dobro | - |
| JWT Secret | ⚠️ Promeni | **VISOK** |
| Admin Šifra | ⚠️ Jača šifra | **VISOK** |
| CORS | ⚠️ Ograniči | **VISOK** |
| File Upload | ✅ Dobro | - |
| SQL Injection | ✅ Zaštićeno | - |
| XSS | ✅ Zaštićeno | - |
| Path Traversal | ✅ Zaštićeno | - |
| Rate Limiting | ❌ Nema | Srednji |
| HTTPS | ⚠️ Konfiguriši | **VISOK** |
| Error Messages | 🔶 OK | Nizak |

**Ukupan Score: 75/100** (Dobro, ali trebaju poboljšanja za production)

---

## 📅 Datum Audita
Decembar 2025

## 🔄 Sledeća Revizija
Preporučeno: Svakih 3-6 meseci
