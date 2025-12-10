# 🚀 Deployment Guide - Decembar 2025 Update

## 📋 Pregled Izmena

Ovaj dokument sadrži sve korake za ažuriranje live Fotoexpres sajta sa najnovijim funkcionalnostima.

---

## ✨ Nove Funkcionalnosti

### 1. **Administracija Proizvoda**
- ✅ Dodavanje novih varijanti postojećim proizvodima
- ✅ Upload fotografija proizvoda (umesto samo URL-a)
- ✅ Kreiranje proizvoda sa 1+ variantom
- ✅ Checkbox za proizvode koji zahtevaju upload fotografije
- ✅ Featured proizvod na početnoj strani ("Izdvajamo iz ponude")
- ✅ Eksterni proizvodi koji vode ka drugim sajtovima

### 2. **Promocije**
- ✅ Custom tekst za promocije bez popusta (npr. "Album na poklon")
- ✅ Toggle za primenu ili ne-primenu popusta

### 3. **UX Poboljšanja**
- ✅ Cena dostave prikazana UVEK (pre forme za kontakt)
- ✅ Full-screen success modal sa brojem porudžbine
- ✅ Automatski redirect na početnu stranicu posle porudžbine

### 4. **Sigurnost**
- ✅ Input validacija i sanitizacija (email, telefon, adresa, grad, poštanski broj)
- ✅ Validacija cena
- ✅ Path traversal prevencija
- ✅ Ograničenje dužine input polja

---

## 🔧 Pre Ažuriranja - Backup

### 1. Backup Baze Podataka

```bash
# Konektuj se na live server
ssh user@your-server.com

# Napravi backup MongoDB baze
mongodump --db test_database --out /home/user/backups/mongo_backup_$(date +%Y%m%d_%H%M%S)

# Arhiviraj backup
cd /home/user/backups
tar -czf mongo_backup_$(date +%Y%m%d).tar.gz mongo_backup_*/
```

### 2. Backup Koda

```bash
# Backup trenutnog koda
cd /home/user/fotoexpres
tar -czf /home/user/backups/fotoexpres_backup_$(date +%Y%m%d).tar.gz .

# Ili koristite git
git add .
git commit -m "Backup pre deployment - $(date +%Y%m%d)"
```

### 3. Backup .env Fajlova

```bash
cp /home/user/fotoexpres/backend/.env /home/user/backups/backend_env_backup
cp /home/user/fotoexpres/frontend/.env /home/user/backups/frontend_env_backup
```

---

## 📥 Ažuriranje Koda

### Opcija A: Pull iz Git Repository (Preporučeno)

```bash
cd /home/user/fotoexpres

# Pull najnovije izmene
git pull origin main

# Ili ako ste na drugom branch-u
git checkout main
git pull
```

### Opcija B: Manualno Kopiranje Fajlova

**Novi Fajlovi:**
```bash
# 1. Kreirati novi sigurnosni utility fajl
nano /home/user/fotoexpres/backend/utils/security_utils.py
# [Kopiraj sadržaj iz /app/backend/utils/security_utils.py]
```

**Izmenjeni Fajlovi:**
```bash
# Backend
- backend/server.py (nova validacija)
- backend/models/product.py (nova polja: isFeatured, isExternalProduct, externalLink)

# Frontend
- frontend/src/components/AdminProducts.jsx (nove funkcionalnosti)
- frontend/src/components/AdminPromotion.jsx (custom promocije)
- frontend/src/components/HomePage.jsx (featured proizvod)
- frontend/src/components/ProductsPage.jsx (eksterni proizvodi)
- frontend/src/components/PromotionBanner.jsx (custom tekst)
- frontend/src/components/UploadPage.jsx (success modal, validacija)
```

**VAŽNO:** Ako kopirate ručno, **PAZITE** da ne prebrišete `.env` fajlove!

---

## 🗄️ Ažuriranje Baze Podataka

### 1. Dodaj Nova Polja Proizvodima

```bash
mongosh test_database
```

```javascript
// 1. Dodaj isFeatured i isExternalProduct polja
db.products.updateMany(
  {},
  { 
    $set: { 
      isFeatured: false,
      isExternalProduct: false,
      externalLink: '',
      requiresPhotoUpload: false
    }
  }
);

// 2. Postavi requiresPhotoUpload na true za sve proizvode osim albuma
db.products.updateMany(
  { type: { $ne: 'album' } },
  { $set: { requiresPhotoUpload: true } }
);

// 3. Proveri izmene
db.products.find({}, { name: 1, isFeatured: 1, isExternalProduct: 1, requiresPhotoUpload: 1 }).pretty();
```

### 2. Ažuriraj Promocije

```javascript
// Dodaj nova polja za promocije
db.promotions.updateOne(
  { _id: 'active_promotion' },
  { 
    $set: { 
      'promotion.customDisplayText': '',
      'promotion.applyDiscount': true
    }
  }
);

// Proveri
db.promotions.findOne({ _id: 'active_promotion' });
```

### 3. Provera Indeksa

```javascript
// Proveri da li postoji unique index na orderNumber
db.orders.getIndexes();

// Ako ne postoji, kreiraj ga
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
```

---

## 📦 Instalacija Zavisnosti

### Backend

```bash
cd /home/user/fotoexpres/backend

# Instaliraj nove zavisnosti (ako ih ima)
pip install -r requirements.txt

# Proveri da li su svi paketi instalirani
pip list | grep -E 'fastapi|pydantic|motor|pymongo'
```

### Frontend

```bash
cd /home/user/fotoexpres/frontend

# Instaliraj zavisnosti
yarn install

# Build produkcijski kod
yarn build
```

---

## 🔄 Restart Servisa

### Ako koristite Supervisor

```bash
# Proveri trenutni status
sudo supervisorctl status

# Restartuj backend
sudo supervisorctl restart backend

# Restartuj frontend
sudo supervisorctl restart frontend

# Proveri logove
sudo tail -f /var/log/supervisor/backend.err.log
sudo tail -f /var/log/supervisor/frontend.err.log
```

### Ako koristite PM2

```bash
# Restart backend
pm2 restart fotoexpres-backend

# Restart frontend
pm2 restart fotoexpres-frontend

# Proveri logove
pm2 logs fotoexpres-backend
pm2 logs fotoexpres-frontend
```

### Ako koristite systemd

```bash
sudo systemctl restart fotoexpres-backend
sudo systemctl restart fotoexpres-frontend

# Proveri status
sudo systemctl status fotoexpres-backend
sudo systemctl status fotoexpres-frontend
```

---

## ✅ Testiranje

### 1. Provera Osnovnih Funkcionalnosti

```bash
# Test backend health
curl https://your-domain.com/api/settings

# Test proizvoda
curl https://your-domain.com/api/products
```

### 2. Test Admin Panela

1. **Login:**
   - Idite na: `https://your-domain.com/logovanje`
   - Ulogujte se sa admin kredencijalima

2. **Test Proizvodi:**
   - Idite na tab "Proizvodi"
   - Kliknite "Izmeni" na bilo kom proizvodu
   - **Proverite** da li vidite nove checkboxe:
     - ✅ "📸 Proizvod zahteva upload fotografije"
     - ✅ "⭐ Istakni proizvod (Izdvajamo iz ponude)"
     - ✅ "🔗 Eksterni proizvod"

3. **Test Dodavanje Varijante:**
   - U edit modalu, scroll nadole do "Varijante"
   - Kliknite "+ Dodaj Novu Opciju"
   - Popunite podatke i sačuvajte

4. **Test Promocija:**
   - Idite na tab "Promocija"
   - **Proverite** da li vidite:
     - ✅ Checkbox "💰 Primeni popust na cenu"
     - ✅ Input polje za "🎨 Custom Tekst za Badge"
   - Otkačite checkbox i unesite custom tekst (npr. "Album na poklon")
   - Sačuvajte i aktivirajte promociju

### 3. Test Frontend Funkcionalnosti

1. **Početna Stranica:**
   - Idite na: `https://your-domain.com`
   - Proverite da li se prikazuje sekcija "Izdvajamo iz ponude" (ako ste postavili featured proizvod)

2. **Upload Stranica:**
   - Idite na: `https://your-domain.com/upload`
   - Dodajte nekoliko fotografija
   - **Proverite:**
     - ✅ Sekcija "Obračun Cene" prikazana IZNAD forme za dostavu
     - ✅ Cena dostave vidljiva
   - Popunite formu sa **validnim** podacima:
     ```
     Ime: Marko Marković
     Email: test@example.com
     Telefon: +381641234567
     Ulica: Kneza Miloša 15
     Poštanski Broj: 11000 (tačno 5 cifara!)
     Grad: Beograd
     ```
   - Kliknite "Naruči"
   - **Trebalo bi** da vidite full-screen success modal sa brojem porudžbine

3. **Test Promocije:**
   - Proverite da li se banner prikazuje na vrhu stranice
   - Tekst u badge-u treba da bude vaš custom tekst (npr. "Album na poklon")

---

## 🚨 Rollback Procedure (Ako Nešto Krene Po Zlu)

### Brzi Rollback - Vraćanje Koda

```bash
cd /home/user/fotoexpres

# Vrati na prethodni git commit
git log --oneline  # Pronađi hash prethodnog commit-a
git reset --hard <commit-hash>

# Ili vrati iz backup-a
cd /home/user
rm -rf fotoexpres
tar -xzf backups/fotoexpres_backup_YYYYMMDD.tar.gz
mv fotoexpres /home/user/fotoexpres

# Restart servisa
sudo supervisorctl restart backend frontend
```

### Rollback Baze Podataka

```bash
# Vrati MongoDB iz backup-a
mongorestore --db test_database --drop /home/user/backups/mongo_backup_YYYYMMDD/test_database
```

---

## 🐛 Troubleshooting

### Problem: Backend ne startuje

**Simptomi:**
- Server error 502/503
- Backend log pokazuje greške

**Rešenje:**
```bash
# Proveri logove
sudo tail -n 100 /var/log/supervisor/backend.err.log

# Najčešći uzroci:
# 1. Nedostaje dependency
pip install -r requirements.txt

# 2. Greška u security_utils.py
# Proveri da li fajl postoji i ima ispravan sadržaj
ls -la backend/utils/security_utils.py

# 3. Port zauzet
lsof -i :8001
```

### Problem: Frontend ne učitava

**Simptomi:**
- Blank screen
- Console errors

**Rešenje:**
```bash
# Rebuild frontend
cd frontend
yarn install
yarn build

# Restart
sudo supervisorctl restart frontend
```

### Problem: Validacija ne radi

**Simptomi:**
- "Adresa ne može biti prazna" greška

**Rešenje:**
```bash
# Proveri da li security_utils.py postoji
cat backend/utils/security_utils.py | head -10

# Proveri da li je importovan u server.py
grep "security_utils" backend/server.py
```

### Problem: Success modal se ne prikazuje

**Simptomi:**
- Stari toast notifikacija umesto modal-a

**Rešenje:**
```bash
# Rebuild frontend
cd frontend
rm -rf node_modules/.cache
yarn build
sudo supervisorctl restart frontend

# Hard refresh u browseru: Ctrl+Shift+R
```

---

## 📊 Monitoring Posle Deployment-a

### 1. Prati Logove (prvih 30 minuta)

```bash
# Backend
sudo tail -f /var/log/supervisor/backend.err.log

# Frontend
sudo tail -f /var/log/supervisor/frontend.err.log
```

### 2. Proveri Metric-e

```bash
# Proveri memoriju
free -h

# Proveri CPU
top

# Proveri disk space
df -h
```

### 3. MongoDB Performance

```bash
mongosh test_database

# Proveri broj porudžbina
db.orders.countDocuments()

# Proveri poslednje porudžbine
db.orders.find().sort({createdAt: -1}).limit(5).pretty()
```

---

## 📝 Post-Deployment Checklist

- [ ] Backup kreiran pre deployment-a
- [ ] Kod ažuriran (git pull ili manualno)
- [ ] Nova polja dodata u MongoDB
- [ ] Backend dependencies instalirane
- [ ] Frontend rebuild urađen
- [ ] Servisi restartovani
- [ ] Admin panel testiran
- [ ] Upload flow testiran
- [ ] Success modal radi
- [ ] Promocija prikazuje custom tekst
- [ ] Featured proizvod prikazan na početnoj
- [ ] Logovi provereni (bez error-a)
- [ ] Korisnici mogu da kreiraju porudžbine

---

## 📞 Podrška

Ako imate problema tokom deployment-a:

1. **Proveri logove** prvo (backend i frontend)
2. **Rollback** na prethodni kod ako je kritično
3. **Kontaktiraj tim** sa:
   - Screenshot error-a
   - Sadržaj log fajla
   - Korake koje si prešao

---

## 🎉 Završne Napomene

**Preporučeno Vreme za Deployment:**
- Najbolje van poslovnih sati (npr. subota ujutru ili kasno uveče)
- Izbegavaj deployment tokom peak sati (12-14h, 18-20h)

**Trajanje Deployment-a:**
- Sa backup-om: ~30-45 minuta
- Bez backup-a (rizično!): ~15-20 minuta

**Što Korisnici Vide Tokom Deployment-a:**
- Kratko vreme nedostupnosti (1-2 minuta tokom restart-a)
- Preporuči da postaviš "Maintenance Mode" banner

---

**Verzija:** December 2025 Update  
**Datum Kreiranja:** 10. Decembar 2025  
**Status:** Production Ready ✅
