# 🚀 Korak-po-Korak Uputstvo za Live Deployment

## ⚠️ VAŽNA NAPOMENA
**MongoDB postoji na live serveru, ali baza je prazna (podaci su prethodno downlodovani/skinuti).**

Ovo uputstvo pokriva:
- Deployment nove verzije koda
- Opciono: Restore MongoDB podataka sa backup-a (ako želiš)

---

## 📋 Pre-Deployment Priprema

### 1. Backup Trenutne Verzije
```bash
# Na live serveru, kreiraj backup
cd /path/to/your/app
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz frontend backend

# Premesti backup na sigurno mesto
mv backup_*.tar.gz /backup/
```

✅ **Checkpoint 1:** Backup kreiran

---

### 2. MongoDB Backup & Restore Plan

**Imaš 2 Opcije:**

**Opcija A: Počni sa Praznom Bazom (Nova Početak)**
- MongoDB će automatski kreirati kolekcije kada budu potrebne
- Preskočiš ovaj korak
- Kreiraćeš nove porudžbine od početka

**Opcija B: Vrati Podatke sa Preview/Dev Okruženja**

```bash
# Na preview/dev serveru (gde ima podataka)
mongodump --uri="mongodb://localhost:27017/photo_print_app" \
          --out=/backup/mongodb_$(date +%Y%m%d_%H%M%S)

# Kompresuj backup
cd /backup
tar -czf mongodb_backup_$(date +%Y%m%d_%H%M%S).tar.gz mongodb_*/

# Prenesi na live server
scp mongodb_backup_*.tar.gz user@live-server:/tmp/
```

✅ **Checkpoint 2:** Odlučio šta sa bazom (prazna ili restore)

---

## 🔐 Sigurnosna Priprema

### 3. Generiši Nove Kredencijale

```bash
# Generiši novi JWT Secret
python3 -c "import secrets; print('JWT_SECRET_KEY=\"' + secrets.token_urlsafe(64) + '\"')"

# Sačuvaj output - bićeš treba kasnije
```

**Output Primer:**
```
JWT_SECRET_KEY="aB3dEf7gH9iJkLm0nOpQrStUvWxYz12345678901234567890abcdefghijklmnop"
```

✅ **Checkpoint 3:** Novi JWT secret generisan

---

### 4. Pripremi Production .env Fajlove

**Backend `.env` (Production verzija):**
```bash
# Na lokalnom računaru, kreiraj production .env
cat > /tmp/backend_production.env << 'EOF'
# Production Backend Environment

# VAŽNO: Ovo su PRODUCTION vrednosti - čuvaj sigurno!

# MongoDB (ako ikad bude potreban)
MONGO_URL=mongodb://localhost:27017/photo_print_app
DB_NAME=photo_print_app

# JWT Secret Key - PROMENI OVO!
JWT_SECRET_KEY="[TVOJ_NOVI_SECRET_IZ_KORAKA_3]"

# Admin Credentials - PROMENI OVO!
ADMIN_USERNAME="VlasnikPro"
ADMIN_PASSWORD="Str0ng@SecureP@ss2024!#$"
VIEWER_PASSWORD="ViewerSecure123!@#"

# CORS - PROMENI NA TVOJ DOMEN!
CORS_ORIGINS=https://your-live-site.com,https://www.your-live-site.com

# Environment
ENVIRONMENT=production
EOF
```

**Frontend `.env` (Production verzija):**
```bash
cat > /tmp/frontend_production.env << 'EOF'
# Production Frontend Environment

# Backend URL - PROMENI NA TVOJ LIVE BACKEND URL!
REACT_APP_BACKEND_URL=https://your-live-site.com

# Sentry (opciono za error tracking)
# REACT_APP_SENTRY_DSN=your_sentry_dsn_here

# Feature flags
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
EOF
```

⚠️ **OBAVEZNO PROMENI:**
- `JWT_SECRET_KEY` - koristi generisani iz koraka 3
- `ADMIN_USERNAME` i `ADMIN_PASSWORD` - jaki kredencijali
- `CORS_ORIGINS` - tvoj live domen
- `REACT_APP_BACKEND_URL` - tvoj live backend URL

✅ **Checkpoint 4:** Production .env fajlovi pripremljeni

---

## 📦 Deployment Proces

### 5. Upload Koda na Live Server

**Opcija A: Git (Preporučeno)**
```bash
# Na live serveru
cd /path/to/your/app
git pull origin main

# ILI ako imaš separate production branch
git pull origin production
```

**Opcija B: SCP/SFTP**
```bash
# Sa lokalnog računara
# Prvo kompresuj kod
cd /app
tar -czf app_update.tar.gz frontend backend

# Upload na server
scp app_update.tar.gz user@your-server:/tmp/

# Na serveru
cd /path/to/your/app
tar -xzf /tmp/app_update.tar.gz
```

**Opcija C: Ručni Upload (FTP/Panel)**
- Upload sve fajlove iz `/app/frontend/` → live server frontend folder
- Upload sve fajlove iz `/app/backend/` → live server backend folder

✅ **Checkpoint 5:** Kod uploadovan

---

### 6. Update .env Fajlova

```bash
# Na live serveru

# Backend .env
cd /path/to/your/app/backend
nano .env

# Zameni sa sadržajem iz /tmp/backend_production.env
# Sačuvaj (Ctrl+O, Enter, Ctrl+X)

# Frontend .env
cd /path/to/your/app/frontend
nano .env

# Zameni sa sadržajem iz /tmp/frontend_production.env
# Sačuvaj (Ctrl+O, Enter, Ctrl+X)
```

⚠️ **PROVERI:**
- `REACT_APP_BACKEND_URL` tačan
- `CORS_ORIGINS` tačan
- `JWT_SECRET_KEY` novi secret
- `ADMIN_PASSWORD` jaka šifra

✅ **Checkpoint 6:** .env fajlovi ažurirani

---

### 7. Kreiraj Novi Direktorijum za Promo Banere

```bash
# Na live serveru
cd /path/to/your/app/backend
mkdir -p uploads/promo_banners

# Dodaj permissions (ako je potrebno)
chmod 755 uploads/promo_banners
```

✅ **Checkpoint 7:** Direktorijum kreiran

---

### 8. Install Dependencies

**Frontend:**
```bash
cd /path/to/your/app/frontend
yarn install

# Ako yarn nije instaliran
npm install -g yarn
yarn install
```

**Backend:**
```bash
cd /path/to/your/app/backend
pip install -r requirements.txt

# Ako ima problema sa permissions
pip install --user -r requirements.txt
```

✅ **Checkpoint 8:** Dependencies instalirani

---

### 9. Build Frontend (Production)

```bash
cd /path/to/your/app/frontend

# Build za production
yarn build

# Build će kreirati /frontend/build folder
ls -la build/
```

✅ **Checkpoint 9:** Frontend build završen

---

### 10. Konfiguriši Web Server

**Ako koristiš Nginx:**
```nginx
# /etc/nginx/sites-available/your-site.conf

# HTTP redirect na HTTPS
server {
    listen 80;
    server_name your-site.com www.your-site.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-site.com www.your-site.com;

    # SSL certificates
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Frontend (React build)
    location / {
        root /path/to/your/app/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (uploads)
    location /uploads {
        alias /path/to/your/app/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Test nginx config
sudo nginx -t

# Ako je OK, restart nginx
sudo systemctl restart nginx
```

**Ako koristiš Apache:**
```apache
# /etc/apache2/sites-available/your-site.conf

<VirtualHost *:80>
    ServerName your-site.com
    Redirect permanent / https://your-site.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-site.com
    
    SSLEngine on
    SSLCertificateFile /path/to/ssl/cert.pem
    SSLCertificateKeyFile /path/to/ssl/key.pem
    
    DocumentRoot /path/to/your/app/frontend/build
    
    ProxyPreserveHost On
    ProxyPass /api http://localhost:8001/api
    ProxyPassReverse /api http://localhost:8001/api
    
    <Directory /path/to/your/app/frontend/build>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>
</VirtualHost>
```

```bash
# Enable site and restart Apache
sudo a2ensite your-site.conf
sudo systemctl restart apache2
```

✅ **Checkpoint 10:** Web server konfigurisan

---

### 11. [OPCIONO] Restore MongoDB Podataka

**⚠️ Samo ako si izabrao Opciju B u Checkpoint-u 2 (restore podataka)**

```bash
# Na live serveru

# 1. Proveri da li MongoDB radi
sudo systemctl status mongodb
# ILI
sudo systemctl status mongod

# 2. Dekompresuj backup
cd /tmp
tar -xzf mongodb_backup_*.tar.gz

# 3. Restore bazu
mongorestore --uri="mongodb://localhost:27017" \
             --db=photo_print_app \
             mongodb_*/photo_print_app/

# 4. Proveri da li su podaci tu
mongosh photo_print_app --eval "db.orders.countDocuments()"
# Trebalo bi da vidiš broj porudžbina

# 5. Cleanup
rm -rf /tmp/mongodb_* /tmp/mongodb_backup_*.tar.gz
```

✅ **Checkpoint 11A:** MongoDB restore završen (ako si radio)

**Ako poručiš sa praznom bazom:**
- Aplikacija će automatski kreirati kolekcije kad budu potrebne
- `promo_banner` kolekcija: kreira se pri prvom upload-u banera
- `orders` kolekcija: kreira se pri prvoj porudžbini
- `products` kolekcija: već postoji sa proizvodima

---

### 12. Restart Backend Service

**Ako koristiš Supervisor:**
```bash
sudo supervisorctl restart backend

# Proveri status
sudo supervisorctl status backend
```

**Ako koristiš PM2:**
```bash
pm2 restart backend

# Proveri status
pm2 status
```

**Ako koristiš systemd:**
```bash
sudo systemctl restart your-backend-service

# Proveri status
sudo systemctl status your-backend-service
```

**Ako nema service manager-a (ručno):**
```bash
# Zaustavi trenutni proces
pkill -f "uvicorn"

# Pokreni novi (u background)
cd /path/to/your/app/backend
nohup python -m uvicorn server:app --host 0.0.0.0 --port 8001 &

# Proveri da li radi
curl http://localhost:8001/api/health
```

✅ **Checkpoint 12:** Backend restartovan

---

## ✅ Verifikacija

### 12. Provera Logova

```bash
# Backend logovi (zavisi od setup-a)
tail -50 /var/log/supervisor/backend.err.log
tail -50 /var/log/your-backend.log

# Nginx logovi
tail -50 /var/log/nginx/error.log
tail -50 /var/log/nginx/access.log

# Traži ERROR ili CRITICAL poruke
grep -i "error\|critical" /var/log/supervisor/backend.err.log
```

✅ **Checkpoint 12:** Nema kritičnih grešaka u logovima

---

### 13. Test API Endpoint-a

```bash
# Test health endpoint
curl -I https://your-live-site.com/api/health

# Očekivano: 200 OK

# Test promo banner endpoint (javni)
curl -I https://your-live-site.com/api/promo-banner

# Očekivano: 200 OK

# Test admin endpoint BEZ tokena (treba da vrati 401)
curl -I https://your-live-site.com/api/admin/orders

# Očekivano: 401 Unauthorized ✅
```

✅ **Checkpoint 13:** API radi pravilno

---

### 14. Test Frontend-a

**Browser Testovi:**
1. Otvori `https://your-live-site.com`
2. Proveri da se stranica učitava
3. Proveri konzolu (F12) - nema grešaka
4. Test navigacije:
   - Početna ✅
   - Proizvodi ✅
   - Cenovnik ✅
   - FAQ ✅
   - Upload ✅

**Mobilni Test:**
1. Otvori na mobilnom (ili Chrome DevTools)
2. Test hamburger meni
3. Proveri prikaz proizvoda (veće slike)

✅ **Checkpoint 14:** Frontend radi

---

### 15. Test Kritičnih Funkcionalnosti

**Test 1: Poručivanje Samo Proizvoda**
1. Idi na `/upload`
2. Dodaj proizvod
3. Popuni kontakt info
4. Submituj
5. ✅ Porudžbina uspešno kreirana

**Test 2: Admin Login**
1. Idi na `/logovanje`
2. Login sa novim kredencijalima
3. ✅ Uspešan login

**Test 3: Promo Baner**
1. Admin → Reklamni Baner
2. Upload sliku
3. Aktiviraj
4. Proveri na početnoj
5. ✅ Baner se prikazuje

**Test 4: Mobilna Navigacija**
1. Mobilni prikaz
2. Hamburger meni
3. ✅ Navigacija radi

✅ **Checkpoint 15:** Sve funkcionalnosti rade

---

## 🔐 Post-Deployment Sigurnost

### 16. Sigurnosni Testovi

```bash
# Test 1: Admin ruta bez tokena
curl -I https://your-live-site.com/api/admin/orders
# Očekivano: 401 Unauthorized ✅

# Test 2: HTTPS redirect
curl -I http://your-live-site.com
# Očekivano: 301 Moved Permanently (https redirect) ✅

# Test 3: File upload validacija
# Pokušaj upload nevaljanog fajla
curl -F "image=@test.txt" https://your-live-site.com/api/admin/promo-banner/upload-image \
     -H "Authorization: Bearer fake_token"
# Očekivano: 400 ili 401 ✅
```

✅ **Checkpoint 16:** Sigurnosni testovi prošli

---

### 17. Sačuvaj Kredencijale na Sigurno Mesto

```bash
# Kreiraj fajl sa kredencijalima
cat > /secure/location/production_credentials.txt << EOF
=================================
PRODUCTION CREDENTIALS - ČUVAJ SIGURNO!
=================================

Live Site: https://your-live-site.com

Admin Login:
- Username: VlasnikPro
- Password: Str0ng@SecureP@ss2024!#$

JWT Secret: [tvoj_secret_key]

Backup Location: /backup/

Date: $(date)
=================================
EOF

# Enkriptuj fajl (opciono)
gpg -c /secure/location/production_credentials.txt

# ILI koristi password manager (1Password, LastPass, itd.)
```

✅ **Checkpoint 17:** Kredencijali sačuvani sigurno

---

## 📊 Final Checklist

- [ ] Backup trenutne verzije kreiran
- [ ] MongoDB backup sačuvan (preview/dev)
- [ ] Novi JWT secret generisan
- [ ] Production .env fajlovi kreirani
- [ ] Kod uploadovan na live server
- [ ] .env fajlovi ažurirani na live-u
- [ ] `uploads/promo_banners` direktorijum kreiran
- [ ] Dependencies instalirani
- [ ] Frontend build završen
- [ ] Web server (Nginx/Apache) konfigurisan
- [ ] HTTPS konfigurisano
- [ ] Backend service restartovan
- [ ] Logovi proveren - nema grešaka
- [ ] API testiran - radi
- [ ] Frontend testiran - radi
- [ ] Kritične funkcionalnosti testirane
- [ ] Sigurnosni testovi prošli
- [ ] Kredencijali sačuvani sigurno
- [ ] Tim obavešten o deployment-u

---

## 🚨 Ako Nešto Pođe Po Zlu

### Quick Rollback

```bash
# 1. Restore backup
cd /path/to/your/app
tar -xzf /backup/backup_[timestamp].tar.gz

# 2. Restart servisi
sudo systemctl restart nginx
sudo supervisorctl restart backend
# ILI
pm2 restart backend

# 3. Clear cache (ako je potrebno)
# Browser cache
# CDN cache (ako koristiš)
```

---

## 📞 Support Kontakti

**Server Provider:** [info]
**Domain Provider:** [info]
**SSL Provider:** [info]

---

## 📅 Deployment Info

**Datum:** [Popuni nakon deployment-a]
**Vreme:** [Popuni]
**Ko je deployovao:** [Ime]
**Downtime:** [Ako je bilo]
**Problemi:** [Ako ih je bilo]

---

## 🎉 Čestitamo!

Ako si stigao dovde i svi checkpointi su ✅, **tvoj sajt je uspešno deployovan na live!**

**Sledeći Koraci:**
1. Monitoruj logove prvih 24h
2. Proveri analytics/metrics
3. Backup automatizuj (weekly/monthly)
4. Redovno ažuriraj dependencies
5. Sigurnosni audit svakih 3-6 meseci

---

**Srećan Live Deployment! 🚀**
