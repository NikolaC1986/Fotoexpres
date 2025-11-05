# 🚀 Deployment Vodič za Photolia - Sajt za Štampu Fotografija

## Pregled

Ovaj vodič objašnjava kako da deployujete vašu aplikaciju za štampu fotografija na različitim hosting platformama.

## 📋 Tehnologije

Aplikacija koristi:
- **Frontend**: React.js (port 3000)
- **Backend**: FastAPI Python (port 8001)
- **Baza podataka**: MongoDB
- **Fajl storage**: ZIP fajlovi sa fotografijama

---

## Opcija 1: Railway (Preporučeno - Najlakše)

### Zašto Railway?
- ✅ Besplatan starter plan
- ✅ Automatski deployment iz GitHub-a
- ✅ Uključena MongoDB
- ✅ Jednostavno podešavanje

### Koraci:

#### 1. Napravite GitHub Repozitorijum
```bash
cd /app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VAŠE_KORISNIČKO_IME/photolia.git
git push -u origin main
```

#### 2. Registrujte se na Railway
1. Idite na https://railway.app/
2. Prijavite se sa GitHub nalogom
3. Kliknite "New Project"

#### 3. Deployment Backend-a
1. Izaberite "Deploy from GitHub repo"
2. Izaberite vaš `photolia` repozitorijum
3. Railway će automatski detektovati Python
4. Postavite **Root Directory** na `backend`
5. Dodajte environment variables:

```
DB_NAME=photolia
JWT_SECRET_KEY=change-this-to-random-secret-key-123456
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=vaš_email@gmail.com
SMTP_PASSWORD=vaša_app_lozinka
ADMIN_EMAIL=vaš_admin_email@gmail.com
```

#### 4. Dodajte MongoDB
1. U Railway dashboardu, kliknite "New"
2. Izaberite "Database" -> "MongoDB"
3. Kopirajte `MONGO_URL` connection string
4. Dodajte ga u backend environment variables

#### 5. Deployment Frontend-a
1. U Railway dashboardu, kliknite "New" -> "GitHub Repo"
2. Izaberite isti repozitorijum
3. Postavite **Root Directory** na `frontend`
4. Dodajte environment variable:

```
REACT_APP_BACKEND_URL=https://vaš-backend-url.railway.app
```

(Kopirajte URL iz backend servisa)

#### 6. Omogućite Javni Pristup
1. U frontend servisu, idite na "Settings"
2. "Networking" -> "Generate Domain"
3. Vaš sajt će biti dostupan na: `https://vaš-sajt.up.railway.app`

---

## Opcija 2: DigitalOcean App Platform

### Cijena: ~$12-25/mesec

### Koraci:

#### 1. Napravite GitHub Repo (kao gore)

#### 2. Kreirajte DigitalOcean App
1. Idite na https://www.digitalocean.com/
2. Kliknite "Apps" -> "Create App"
3. Povežite GitHub repozitorijum

#### 3. Konfigurišite Backend
```yaml
Name: photolia-backend
Source: /backend
Run Command: uvicorn server:app --host 0.0.0.0 --port 8001
HTTP Port: 8001
```

**Environment Variables:**
```
MONGO_URL=mongodb://...
DB_NAME=photolia
JWT_SECRET_KEY=random-secret-key
SMTP_USERNAME=email@gmail.com
SMTP_PASSWORD=app-password
ADMIN_EMAIL=admin@photolia.rs
```

#### 4. Konfigurišite Frontend
```yaml
Name: photolia-frontend
Source: /frontend
Build Command: yarn build
Run Command: yarn start
HTTP Port: 3000
```

**Environment Variables:**
```
REACT_APP_BACKEND_URL=${photolia-backend.PUBLIC_URL}
```

#### 5. Dodajte MongoDB
1. U DigitalOcean, idite na "Databases"
2. Kreirajte MongoDB Cluster
3. Kopirajte connection string
4. Dodajte u backend env variables

---

## Opcija 3: VPS (DigitalOcean Droplet, Linode, Vultr)

### Cijena: $6-12/mesec
### Zahteva tehničko znanje

### Koraci:

#### 1. Kreirajte VPS Server
1. Izaberite Ubuntu 22.04 LTS
2. Najmanje 2GB RAM
3. 50GB disk prostor

#### 2. Konektujte se na Server
```bash
ssh root@VAŠ_IP_ADRESA
```

#### 3. Instalirajte Potrebne Pakete
```bash
# Update sistem
apt update && apt upgrade -y

# Instalirajte Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalirajte Python
apt install -y python3 python3-pip python3-venv

# Instalirajte MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Instalirajte Nginx
apt install -y nginx

# Instalirajte PM2 (za pokretanje aplikacija)
npm install -g pm2 yarn
```

#### 4. Klonirajte i Konfigurišite Projekat
```bash
cd /var/www
git clone https://github.com/VAŠE_IME/photolia.git
cd photolia

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Kreirajte .env fajl
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=photolia
JWT_SECRET_KEY=change-this-secret-key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=email@gmail.com
SMTP_PASSWORD=app-password
ADMIN_EMAIL=admin@photolia.rs
EOF

# Frontend setup
cd ../frontend
yarn install

# Kreirajte .env fajl
cat > .env << EOF
REACT_APP_BACKEND_URL=https://vaš_domen.com
EOF

yarn build
```

#### 5. Pokrenite Aplikacije sa PM2
```bash
# Backend
cd /var/www/photolia/backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name photolia-backend

# Frontend
cd /var/www/photolia/frontend
pm2 start "yarn start" --name photolia-frontend
pm2 startup
pm2 save
```

#### 6. Konfigurišite Nginx
```bash
nano /etc/nginx/sites-available/photolia
```

Dodajte:
```nginx
server {
    listen 80;
    server_name vaš_domen.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enablujte sajt:
```bash
ln -s /etc/nginx/sites-available/photolia /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 7. PodešavanjeSL-a (HTTPS)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d vaš_domen.com
```

---

## 📧 Podešavanje Email-a (Gmail)

### 1. Omogućite 2-Factor Authentication
1. Idite na https://myaccount.google.com/security
2. Omogućite "2-Step Verification"

### 2. Kreirajte App Password
1. Idite na https://myaccount.google.com/apppasswords
2. Izaberite "Mail" i "Other (Custom name)"
3. Nazovite "Photolia"
4. Kopirajte generisanu lozinku (16 karaktera)
5. Koristite ovu lozinku kao `SMTP_PASSWORD`

### 3. Testiranje Email-a
Email notifikacija će biti poslata automatski kada neko podnese novu porudžbinu.

---

## 🔐 Sigurnost

### BITNO - Promenite Default Kredencijale!

**Admin Login:**
- Default username: `admin`
- Default password: `admin123`

**Promena lozinke:**
Otvorite `/app/backend/models/admin.py` i promenite:
```python
ADMIN_USERNAME = "vaše_korisničko_ime"
ADMIN_PASSWORD = "vaša_jaka_lozinka"
```

**Generisanje JWT Secret Key:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🎯 Post-Deployment Checklist

- [ ] Sajt se učitava ispravno
- [ ] Upload fotografija radi
- [ ] Porudžbine se čuvaju u bazi
- [ ] ZIP fajlovi se kreiraju
- [ ] Email notifikacije stižu
- [ ] Admin panel pristup radi
- [ ] Preuzimanje ZIP-ova iz admin panela radi
- [ ] HTTPS je omogućen
- [ ] Admin lozinka je promenjena

---

## 🆘 Troubleshooting

### Problem: Email se ne šalje
**Rešenje:**
- Proverite Gmail App Password
- Proverite SMTP credentials u .env
- Omogućite "Less secure app access" (ako koristite stari Gmail)

### Problem: Frontend ne može da pristupi Backend-u
**Rešenje:**
- Proverite `REACT_APP_BACKEND_URL` u frontend .env
- Proverite da backend API radi: `curl https://vaš-backend/api/`

### Problem: ZIP fajlovi nisu dostupni
**Rešenje:**
- Proverite da `/app/backend/orders_zips/` direktorijum postoji
- Proverite permisije: `chmod 755 /app/backend/orders_zips/`

### Problem: MongoDB connection error
**Rešenje:**
- Proverite `MONGO_URL` u .env
- Testrajte konekciju: `mongosh "vaš_mongo_url"`

---

## 📞 Potrebna Pomoć?

Ako imate problema, proverite:
1. Backend logove: `tail -f /var/log/supervisor/backend.err.log`
2. Frontend logove: `tail -f /var/log/supervisor/frontend.err.log`
3. MongoDB logove: `tail -f /var/log/mongodb/mongod.log`

---

## 🎉 Gotovo!

Vaš sajt za štampu fotografija je sada online i spreman za korišćenje!