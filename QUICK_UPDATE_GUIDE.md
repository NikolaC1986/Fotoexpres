# ⚡ BRZО UPUTSTVO - Update Live Sajta

## 🚀 KOMANDE U NIZU (Copy-Paste)

### 1️⃣ **BACKUP (Izvršiti Prvo!)**
```bash
# Backup MongoDB
mongodump --db fotoexpres --out /root/backup-security-$(date +%Y%m%d-%H%M)

# Backup fajlova
cd /var/www/fotoexpres/backend
tar -czf /root/orders-backup-$(date +%Y%m%d).tar.gz orders/
tar -czf /root/zips-backup-$(date +%Y%m%d).tar.gz orders_zips/
cp /var/www/fotoexpres/backend/.env /root/env-backup-$(date +%Y%m%d).txt

# Provera
ls -lh /root/ | grep backup
```

---

### 2️⃣ **GIT PULL**
```bash
cd /var/www/fotoexpres
git stash
git pull origin main
```

---

### 3️⃣ **AŽURIRANJE .ENV FAJLA**

**Generiši novi JWT secret:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

**Edituj .env:**
```bash
nano /var/www/fotoexpres/backend/.env
```

**Zameni liniju:**
```
JWT_SECRET_KEY=[NALEPITI-NOVI-GENERISANI-KLJUČ]
```

**Dodaj ako nema:**
```
VIEWER_USERNAME=Menadzer
VIEWER_PASSWORD=Menadzer2025!
```

**Sačuvaj:** `CTRL+O` → `Enter` → `CTRL+X`

---

### 4️⃣ **INSTALACIJA DEPENDENCIES**

**Backend:**
```bash
cd /var/www/fotoexpres/backend
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd /var/www/fotoexpres/frontend
npm install
```

---

### 5️⃣ **FRONTEND BUILD**
```bash
cd /var/www/fotoexpres/frontend
npm run build
```

⏱️ **Trajanje:** 3-5 minuta

---

### 6️⃣ **RESTART SERVISA**
```bash
sudo supervisorctl restart fotoexpres-backend
sleep 5
sudo supervisorctl status fotoexpres-backend
sudo nginx -t
sudo systemctl restart nginx
```

---

### 7️⃣ **BRZA VERIFIKACIJA**

**API Test:**
```bash
curl -s https://fotoexpres.rs/api/prices | head -20
```

**Admin Login Test:**
```bash
curl -X POST https://fotoexpres.rs/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Vlasnik","password":"Fotoexpres2025!"}'
```

**Viewer Login Test:**
```bash
curl -X POST https://fotoexpres.rs/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Menadzer","password":"Menadzer2025!"}'
```

**Rate Limit Test:**
```bash
for i in {1..6}; do curl -X POST https://fotoexpres.rs/api/admin/login -H "Content-Type: application/json" -d '{"username":"t","password":"t"}' 2>/dev/null; done
```

---

## ✅ BROWSER CHECKLIST

1. **Očisti cache:** `CTRL + SHIFT + R`
2. **Upload forma:** 3 adresna polja (Ulica, Poštanski broj, Grad)
3. **Napomena:** Pre dugmeta "Pošalji Porudžbinu"
4. **FAQ:** Cene zamenjene linkom
5. **Admin login:** Vlasnik / Fotoexpres2025! (SVA prava)
6. **Viewer login:** Menadzer / Menadzer2025! (samo porudžbine)
7. **Dashboard:** Datum i vreme u tabeli
8. **Nova porudžbina:** ZIP sa folderima po formatima

---

## 🔙 ROLLBACK (Hitno!)

```bash
cd /var/www/fotoexpres
git log --oneline -5
git reset --hard <prethodni-commit-hash>
cd frontend && npm run build
sudo supervisorctl restart fotoexpres-backend
sudo systemctl restart nginx
```

---

## 🆘 HITNI PROBLEMI

**Backend ne startuje:**
```bash
tail -n 50 /var/log/fotoexpres-backend.err.log
```

**ModuleNotFoundError: slowapi:**
```bash
cd /var/www/fotoexpres/backend
source venv/bin/activate
pip install slowapi
sudo supervisorctl restart fotoexpres-backend
```

**Frontend ne učitava izmene:**
```bash
cd /var/www/fotoexpres/frontend
rm -rf build
npm run build
sudo systemctl restart nginx
```

---

## 📋 NOVI CREDENTIALS

**Admin (puna prava):**
- Username: `Vlasnik`
- Password: `Fotoexpres2025!`

**Viewer (samo porudžbine):**
- Username: `Menadzer`
- Password: `Menadzer2025!`

---

## 🔒 BEZBEDNOSNE IZMENE

✅ JWT Secret - Jak random ključ  
✅ CORS - Samo fotoexpres.rs  
✅ File Upload - Validacija ekstenzije/MIME  
✅ Rate Limiting - Max 5 login/min  

---

**Za detaljna uputstva, vidi:** `SECURITY_UPDATE_DEPLOYMENT_GUIDE.md`
