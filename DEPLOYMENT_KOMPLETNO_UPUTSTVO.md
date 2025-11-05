# 🚀 KOMPLETNO UPUTSTVO - Fotoexpres Sajt na Produkciji

## 📋 SADRŽAJ
1. [Šta Vam Treba](#što-vam-treba)
2. [Kupovina Servisa](#kupovina-servisa)
3. [Priprema Projekta](#priprema-projekta)
4. [Deployment na Railway (Preporučeno)](#deployment-railway)
5. [Alternativa: VPS Deployment](#alternativa-vps)
6. [Email Setup](#email-setup)
7. [Domen i SSL](#domen-ssl)
8. [Bezbednost](#bezbednost)
9. [Backup i Monitoring](#backup)
10. [Održavanje](#održavanje)

---

## 🛒 ŠTA VAM TREBA

### Obavezni Servisi:
1. **Hosting za aplikaciju** - gde će sajt da živi
2. **Domen** - fotoexpres.rs (ili .com)
3. **MongoDB Baza** - za porudžbine
4. **Email Servis** - za notifikacije
5. **SSL Sertifikat** - HTTPS (obično besplatan)

### Opciono (Ali Preporučeno):
- **Backup Servis** - automatski backup
- **CDN** - brže učitavanje slike (Cloudflare - besplatan)
- **Monitoring** - praćenje rada sajta

---

## 💰 KUPOVINA SERVISA

### Opcija 1: RAILWAY (Najlakše - Sve u Jednom) 🏆
**Preporučujem za početak!**

**Link:** https://railway.app/
**Cena:** $5-20/mesec (zavisi od posete)
**Šta uključuje:** Hosting, MongoDB, Deployment, Automatski SSL

**Prednosti:**
- ✅ Najjednostavnije - sve je automatsko
- ✅ Besplatan trial $5 kredit
- ✅ MongoDB uključen
- ✅ Automatski SSL
- ✅ Skalira se automatski

**Kako Kupiti:**
1. Idite na https://railway.app/
2. Kliknite "Start a New Project"
3. Povežite GitHub nalog (biće potrebno)
4. Dodajte platnu karticu (ne naplaćuje odmah)

---

### Opcija 2: DIGITAL OCEAN (Za Veću Kontrolu)
**Link:** https://www.digitalocean.com/
**Cena:** $12-25/mesec

**Servisi Potrebni:**
1. **App Platform** - $12/mesec
   - Link: https://www.digitalocean.com/products/app-platform
   
2. **MongoDB Database** - $15/mesec (ili MongoDB Atlas besplatan)
   - Link: https://www.digitalocean.com/products/managed-databases-mongodb

**Kako Kupiti:**
1. Idite na https://www.digitalocean.com/
2. "Sign Up" - dobijate $200 za 60 dana probe
3. Dodajte karticu
4. Kreirajte "App Platform" projekat

---

### Opcija 3: VULTR (Najjeftiniji VPS)
**Link:** https://www.vultr.com/
**Cena:** $6-12/mesec

**Šta Dobijate:**
- VPS Server (Virtual Private Server)
- Vi instalirate sve ručno
- Potrebno više tehničkog znanja

**Kako Kupiti:**
1. https://www.vultr.com/products/cloud-compute/
2. Sign Up
3. Izaberite "Regular Cloud Compute"
4. Lokacija: Frankfurt (najbliže Srbiji)
5. Plan: 2GB RAM - $12/mesec

---

## 🌐 KUPOVINA DOMENA

### Za .RS Domen (Srpski)
**Registar:** https://www.rnids.rs/

**Ovlašćeni Registri:**
1. **ELLT** - https://www.ellt.com/ (15€/god)
2. **IDSERVIS** - https://www.idservis.rs/ (1200 RSD/god)
3. **ORBIT** - https://www.orbit.rs/ (20€/god)

**Postupak:**
1. Idite na bilo koji registar
2. Pretražite "fotoexpres.rs"
3. Dodajte u korpu
4. Popunite podatke (ime, adresa, PIB ako imate firmu)
5. Platite karticom ili uplatnicom

### Za .COM Domen (Međunarodni)
**Registrar:** https://www.namecheap.com/
**Cena:** $8-13/god

**Postupak:**
1. Idite na https://www.namecheap.com/
2. Pretražite "fotoexpres.com"
3. Add to Cart
4. Checkout - platite karticom

---

## 📧 EMAIL SETUP

### Gmail (Besplatno za Male Potrebe)
**Link:** https://myaccount.google.com/apppasswords

**Postupak:**
1. Napravite Gmail nalog (npr. porudzbine@fotoexpres.rs koristite gmail)
2. Omogućite 2-Factor Authentication
3. Idite na: https://myaccount.google.com/apppasswords
4. Kreirajte "App Password" za "Mail"
5. Kopirajte lozinku od 16 karaktera
6. Koristite je u SMTP_PASSWORD

**Ograničenje:** 500 email-ova dnevno (dovoljno za početak)

---

### SendGrid (Za Više Email-ova)
**Link:** https://sendgrid.com/
**Cena:** Besplatan do 100 email-ova/dan, zatim $15/mesec za 40,000

**Postupak:**
1. https://signup.sendgrid.com/
2. Kreirajte nalog
3. Verifikujte email
4. Domain Authentication (dodajte DNS zapise)
5. Kreirajte API Key
6. Koristite API Key umesto SMTP-a

---

### Mailgun (Alternativa)
**Link:** https://www.mailgun.com/
**Cena:** Besplatan za 5,000/mesec prvog 3 meseca

---

## 🚀 DEPLOYMENT NA RAILWAY (Preporučeno)

### Korak 1: Priprema GitHub Repozitorijuma

```bash
# Na vašem lokalnom računaru
cd /app

# Inicijalizujte git
git init

# Dodajte sve fajlove
git add .

# Napravite commit
git commit -m "Initial commit - Fotoexpres sajt"

# Kreirajte GitHub repo na https://github.com/new
# Ime: fotoexpres

# Povežite sa GitHub-om
git remote add origin https://github.com/VASE_IME/fotoexpres.git
git branch -M main
git push -u origin main
```

### Korak 2: Kreiranje Railway Projekta

1. **Idite na:** https://railway.app/dashboard
2. **Kliknite:** "New Project"
3. **Izaberite:** "Deploy from GitHub repo"
4. **Izaberite:** vaš `fotoexpres` repo
5. **Railway će automatski detektovati:** Python i Node.js

### Korak 3: Konfiguracija Backend Servisa

1. Railway će kreirati 2 servisa automatski:
   - `backend` (FastAPI)
   - `frontend` (React)

2. **Kliknite na backend servis:**
   - Settings → Service Name: `fotoexpres-backend`
   - Settings → Root Directory: `/backend`

3. **Dodajte Environment Variables:**
```
DB_NAME=fotoexpres
JWT_SECRET_KEY=generisana-tajna-lozinka-123456789
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=vas-email@gmail.com
SMTP_PASSWORD=vasa-app-lozinka-16-karaktera
ADMIN_EMAIL=email-za-primanje-porudzbina@gmail.com
```

4. **Generiši Secret Key:**
```bash
# Pokrenite ovu komandu da dobijete random key:
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Korak 4: Dodavanje MongoDB

1. **U Railway Dashboard:**
   - Kliknite "New" → "Database" → "Add MongoDB"
   
2. **Kopirajte MONGO_URL:**
   - Kliknite na MongoDB servis
   - Variables tab → MONGO_URL
   - Kopirajte celu URL

3. **Dodajte u Backend Variables:**
   - Kliknite backend servis
   - Variables → Add Variable
   - Name: `MONGO_URL`
   - Value: (zalepite MongoDB URL)

### Korak 5: Konfiguracija Frontend Servisa

1. **Kliknite na frontend servis:**
   - Settings → Root Directory: `/frontend`
   - Settings → Build Command: `yarn build`
   - Settings → Start Command: `yarn start`

2. **Dodajte Environment Variable:**
```
REACT_APP_BACKEND_URL=https://fotoexpres-backend.up.railway.app
```

**VAŽNO:** Backend URL ćete dobiti nakon što se backend deploy-uje.

### Korak 6: Deploy i Generate Domain

1. **Backend:**
   - Settings → Networking → Generate Domain
   - Dobićete: `https://fotoexpres-backend.up.railway.app`
   - **Kopirajte ovaj URL!**

2. **Ažurirajte Frontend Environment:**
   - Vratite se na frontend servis
   - Variables → Edit `REACT_APP_BACKEND_URL`
   - Paste backend URL

3. **Frontend:**
   - Settings → Networking → Generate Domain
   - Dobićete: `https://fotoexpres.up.railway.app`

### Korak 7: Custom Domen (Opciono)

1. **U Frontend servisu:**
   - Settings → Networking → Custom Domain
   - Unesite: `fotoexpres.rs` ili `www.fotoexpres.rs`

2. **Railway će vam dati DNS zapise:**
```
Type: CNAME
Name: www
Value: fotoexpres.up.railway.app
```

3. **Idite na vaš Domain registar:**
   - Dodajte CNAME zapis
   - Sačekajte 5-30 minuta da se propagira

---

## 🔧 ALTERNATIVA: VPS DEPLOYMENT (Vultr/DigitalOcean)

### Korak 1: Kreiranje VPS Servera

**Vultr:**
1. https://www.vultr.com/products/cloud-compute/
2. Lokacija: Frankfurt
3. OS: Ubuntu 22.04 LTS
4. Plan: 2GB RAM ($12/mesec)
5. Kreirajte server

**Dobićete:**
- IP Adresa: `123.45.67.89`
- Root lozinka

### Korak 2: Konektovanje na Server

```bash
# Sa vašeg računara
ssh root@123.45.67.89
# Unesite lozinku
```

### Korak 3: Instalacija Softvera

```bash
# Update sistema
apt update && apt upgrade -y

# Instalacija Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalacija Python
apt install -y python3 python3-pip python3-venv

# Instalacija MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Instalacija Nginx
apt install -y nginx

# Instalacija PM2
npm install -g pm2 yarn
```

### Korak 4: Deploy Aplikacije

```bash
# Klonirajte projekat
cd /var/www
git clone https://github.com/VASE_IME/fotoexpres.git
cd fotoexpres

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Kreirajte .env
nano .env
```

**Dodajte u .env:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=fotoexpres
JWT_SECRET_KEY=vasa-tajna-lozinka
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=vas-email@gmail.com
SMTP_PASSWORD=app-password
ADMIN_EMAIL=admin@fotoexpres.rs
```

**Pokrenite backend:**
```bash
cd /var/www/fotoexpres/backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name fotoexpres-backend
```

**Frontend setup:**
```bash
cd /var/www/fotoexpres/frontend
nano .env
```

**Dodajte:**
```
REACT_APP_BACKEND_URL=https://fotoexpres.rs
```

```bash
yarn install
yarn build
pm2 start "yarn start" --name fotoexpres-frontend
pm2 startup
pm2 save
```

### Korak 5: Nginx Konfiguracija

```bash
nano /etc/nginx/sites-available/fotoexpres
```

**Dodajte:**
```nginx
server {
    listen 80;
    server_name fotoexpres.rs www.fotoexpres.rs;

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
    }
}
```

```bash
ln -s /etc/nginx/sites-available/fotoexpres /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Korak 6: SSL Sertifikat (HTTPS)

```bash
# Instalacija Certbot
apt install -y certbot python3-certbot-nginx

# Kreiranje SSL sertifikata
certbot --nginx -d fotoexpres.rs -d www.fotoexpres.rs

# Unesi email za obnavljanje
# Prihvati Terms of Service
# SSL će biti automatski podešen!
```

---

## 🔒 BEZBEDNOST

### 1. Promenite Admin Lozinku!

**U fajlu:** `/app/backend/models/admin.py`

```python
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "JAKO_JAKA_LOZINKA_123!@#"  # PROMENITE OVO!
```

### 2. Generišite Jaki JWT Secret

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Koristite output u `JWT_SECRET_KEY`

### 3. Firewall (Samo za VPS)

```bash
# Omogućite samo potrebne portove
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 4. Regular Updates

```bash
# Automatski security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 💾 BACKUP

### MongoDB Backup (Automatic)

**Za Railway:** Već uključeno!

**Za VPS:**
```bash
# Kreirajte backup script
nano /root/backup-mongo.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --db fotoexpres --out /backups/mongo-$DATE
# Zadržite samo poslednjih 7 dana
find /backups -type d -mtime +7 -exec rm -rf {} \;
```

```bash
chmod +x /root/backup-mongo.sh

# Dodajte u cron (svaki dan u 2AM)
crontab -e
```

Dodajte liniju:
```
0 2 * * * /root/backup-mongo.sh
```

### Fajl Backup (ZIP Fajlovi)

```bash
# Backup svih porudžbina
tar -czf /backups/orders-$(date +%Y%m%d).tar.gz /var/www/fotoexpres/backend/orders_zips/
```

---

## 📊 MONITORING

### UptimeRobot (Besplatan)
**Link:** https://uptimerobot.com/

1. Napravite nalog
2. Add Monitor → HTTP(s)
3. URL: `https://fotoexpres.rs`
4. Interval: 5 minuta
5. Dodajte email za alerts

**Dobićete email ako sajt padne!**

---

## 🔄 ODRŽAVANJE

### Redovne Provere

**Nedeljno:**
- ✅ Proverite da li sti`žu email notifikacije
- ✅ Test porudžbina
- ✅ Proverite disk space (ako VPS)

**Mesečno:**
- ✅ Proverite backup
- ✅ Update cena ako potrebno
- ✅ Pregledajte logove

### Kako Ažurirati Sajt

**Railway (Automatski):**
```bash
# Na lokalnom računaru
git add .
git commit -m "Promene"
git push

# Railway će automatski deploy-ovati!
```

**VPS (Ručno):**
```bash
ssh root@VAS_SERVER
cd /var/www/fotoexpres
git pull
pm2 restart all
```

---

## 💰 UKUPAN TROŠAK - PREGLED

### Minimalni Mesečni Troškovi:

**Railway Setup:**
- Railway Hosting: $10-20/mesec
- Domen (.rs): ~100 RSD/mesec (1200/god)
- Email: Besplatno (Gmail)
- SSL: Besplatno
- **UKUPNO: ~$12-22/mesec (~1,500-2,800 RSD)**

**VPS Setup:**
- VPS (Vultr): $12/mesec
- Domen (.rs): ~100 RSD/mesec
- Email: Besplatno (Gmail)
- SSL: Besplatno
- **UKUPNO: ~$14/mesec (~1,700 RSD)**

### Za Ozbiljniji Rad (Više Poseta):

- Hosting: $25/mesec
- SendGrid Email: $15/mesec
- Cloudflare Pro CDN: $20/mesec
- Backup Storage: $5/mesec
- **UKUPNO: ~$65/mesec (~8,000 RSD)**

---

## 🆘 TROUBLESHOOTING

### Problem: Sajt ne radi posle deploy-a
**Rešenje:**
```bash
# Railway: Proverite Logs
# Dashboard → Service → Deployments → View Logs

# VPS: Proverite PM2
pm2 logs
pm2 status
```

### Problem: Email se ne šalje
**Rešenje:**
1. Proverite Gmail App Password
2. Proverite SMTP credentials u .env
3. Omogućite "Less secure app access"

### Problem: MongoDB connection error
**Rešenje:**
1. Proverite MONGO_URL
2. Railway: Proverite da je MongoDB servis pokrenut
3. VPS: `systemctl status mongod`

---

## 📞 PODRŠKA

### Railway Support:
- https://help.railway.app/

### DigitalOcean Community:
- https://www.digitalocean.com/community

### MongoDB Atlas Support:
- https://www.mongodb.com/support

---

## ✅ FINALNA CHECKLISTA

Pre Puštanja u Rad:

- [ ] Sajt radi na pravom domenu
- [ ] HTTPS je omogućen (zelena katanca)
- [ ] Email notifikacije rade
- [ ] Test porudžbina uspešna
- [ ] ZIP download radi
- [ ] Admin panel dostupan
- [ ] Cene su ispravne
- [ ] Kontakt podaci tačni
- [ ] Promenjena admin lozinka
- [ ] Backup podešen
- [ ] Monitoring aktivan

---

## 🎉 GOTOVO!

Vaš Fotoexpres sajt je sada LIVE i spreman za kupce!

**Testiranje:**
1. Idite na https://fotoexpres.rs
2. Napravite test porudžbinu
3. Proverite email
4. Proverite admin panel
5. Download ZIP fajl

**Promocija:**
- Facebook stranica
- Instagram
- Google My Business
- Lokalna oglašavanja

Srećno sa Fotoexpres-om! 🚀📸
