# 🚀 Vodič za Deployment na Live Sajt

## 📋 Pregled Promena

Ovaj dokument sadrži sve izmene koje treba deployovati na live sajt, kao i detaljne korake za deployment.

---

## ✨ Nove Funkcionalnosti

### 1. Reklamni Baner Sistem ⭐
**Lokacija:** Početna stranica (iznad "Izdvajamo iz ponude")

**Funkcionalnosti:**
- Admin panel za upravljanje banerom (`/logovanje/promo-banner`)
- 3 formata banera: Desktop (1920x400), Tablet (1024x350), Mobile (430x250)
- Link URL polje (opciono)
- Aktivacija/Deaktivacija prekidač
- Automatsko dodavanje `https://` protokola za linkove

**Fajlovi:**
- `/app/frontend/src/components/PromoBanner.jsx` (NOVI)
- `/app/frontend/src/components/AdminPromoBanner.jsx` (NOVI)
- `/app/frontend/src/components/HomePage.jsx` (AŽURIRAN)
- `/app/frontend/src/App.js` (AŽURIRAN)
- `/app/backend/server.py` (AŽURIRAN - novi endpointi)

**Backend Endpoints:**
- `GET /api/promo-banner` - Javni
- `GET /api/admin/promo-banner` - Admin
- `POST /api/admin/promo-banner/upload-image` - Admin
- `PUT /api/admin/promo-banner` - Admin
- `GET /api/uploads/promo_banners/{filename}` - Servovanje slika

**MongoDB Kolekcija:**
- `promo_banner` (nova)

**Dokumentacija:**
- `/app/PROMO_BANNER_FEATURE.md`
- `/app/PROMO_BANNER_LINK_FIX.md`

---

### 2. Mobilna Navigacija 📱
**Funkcionalnost:**
- Hamburger meni za mobilne uređaje
- Dropdown meni sa svim linkovima (Početna, Proizvodi, Cenovnik, FAQ)
- Automatsko zatvaranje menija pri navigaciji

**Fajlovi:**
- `/app/frontend/src/components/Navbar.jsx` (AŽURIRAN)

**Dokumentacija:**
- `/app/MOBILE_NAVIGATION_FIX.md`

---

### 3. Organizacija Proizvoda u ZIP Fajlu 📦
**Funkcionalnost:**
- Nova struktura: `[Proizvod]/[Varijanta]/[Količina]/photo.jpg`
- Primer: `Fotokalendar/A4/1/photo.jpg`

**Prednosti:**
- Jasna identifikacija proizvoda, varijante i količine
- Lakša produkcija
- Konzistentna logika kao za fotografije

**Fajlovi:**
- `/app/backend/utils/order_utils.py` (AŽURIRAN)

**Dokumentacija:**
- `/app/PRODUCT_ZIP_ORGANIZATION.md`
- `/app/PRODUCT_VARIANT_FOLDER_UPDATE.md`

---

### 4. Admin Panel - Prikaz Broja Proizvoda 📊
**Funkcionalnost:**
- Nova kolona: "Fotografije / Proizvodi"
- Prikaz broja proizvoda u narandžastoj boji
- Uslovno prikazivanje (samo ako postoje proizvodi)

**Fajlovi:**
- `/app/frontend/src/components/AdminDashboard.jsx` (AŽURIRAN)

**Dokumentacija:**
- `/app/ADMIN_PRODUCTS_COUNT_DISPLAY.md`

---

## 🐛 Bug Fix-ovi

### 1. Poručivanje Samo Proizvoda ✅
**Problem:** Korisnici nisu mogli da poruče samo proizvode bez fotografija

**Rešenje:**
- Backend: `photos` parametar opcioni
- Backend: `photoSettings` opcioni u modelima
- Backend: Validacija za prazne porudžbine
- Frontend: Uklonjen dummy `.txt` fajl

**Fajlovi:**
- `/app/backend/server.py`
- `/app/backend/models/order.py`
- `/app/backend/utils/order_utils.py`
- `/app/frontend/src/components/UploadPage.jsx`

**Dokumentacija:**
- `/app/PRODUCT_ONLY_ORDER_FIX.md`

---

### 2. Prikazivanje Slika Proizvoda 🖼️
**Problem:** Slike proizvoda nisu bile vidljive u admin panelu i na javnoj stranici

**Rešenje:**
- Dodato `/api` prefix za `/uploads/` putanje u svim `getImageUrl` funkcijama
- Dodat backend endpoint za servovanje slika proizvoda

**Fajlovi:**
- `/app/frontend/src/components/products/ProductCard.jsx`
- `/app/frontend/src/components/products/ProductImageUploader.jsx`
- `/app/frontend/src/components/ProductsPage.jsx`
- `/app/frontend/src/components/ProductSelector.jsx`
- `/app/frontend/src/components/HomePage.jsx`
- `/app/backend/server.py` (dodao endpoint)

**Dokumentacija:**
- `/app/PRODUCT_IMAGES_FIX.md`

---

## 🎨 UI/UX Poboljšanja

### 1. Optimizacija Proizvoda na Mobilnom 📱
**Poboljšanje:**
- Povećana visina slike sa 256px na 288px na mobilnom
- Smanjen padding sa 16px na 8px na mobilnom
- +21% više prostora za prikaz proizvoda

**Fajlovi:**
- `/app/frontend/src/components/ProductsPage.jsx`

**Dokumentacija:**
- `/app/PRODUCT_IMAGE_DIMENSIONS_GUIDE.md`

---

## 📁 Direktorijumi i Folderi

### Novi Direktorijumi na Backend-u
```bash
/app/backend/uploads/promo_banners/  # Za slike banera
```

### Novi Fajlovi
```
Frontend:
- /app/frontend/src/components/PromoBanner.jsx
- /app/frontend/src/components/AdminPromoBanner.jsx

Dokumentacija (opciono za live):
- /app/PROMO_BANNER_FEATURE.md
- /app/PROMO_BANNER_LINK_FIX.md
- /app/MOBILE_NAVIGATION_FIX.md
- /app/PRODUCT_ONLY_ORDER_FIX.md
- /app/PRODUCT_IMAGES_FIX.md
- /app/PRODUCT_ZIP_ORGANIZATION.md
- /app/PRODUCT_VARIANT_FOLDER_UPDATE.md
- /app/ADMIN_PRODUCTS_COUNT_DISPLAY.md
- /app/PRODUCT_IMAGE_DIMENSIONS_GUIDE.md
```

---

## 🔧 Koraci za Deployment

### Pre-Deployment Checklist ☑️

- [ ] **Backup baze podataka (MongoDB)**
  ```bash
  mongodump --uri="mongodb://localhost:27017/photo_print_app" --out=/backup/$(date +%Y%m%d_%H%M%S)
  ```

- [ ] **Backup trenutnog koda**
  ```bash
  # Na live serveru
  cd /app
  tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz frontend backend
  ```

- [ ] **Test na staging/preview okruženju** (✅ Već testirano)

- [ ] **Provera .env fajlova** (da nisu promenjeni nedozvoljeni ključevi)

- [ ] **Provera dependency-ja**
  ```bash
  # Frontend
  cd /app/frontend
  yarn install

  # Backend
  cd /app/backend
  pip install -r requirements.txt
  ```

---

### Deployment Koraci

#### Korak 1: Git Pull (Ako koristite Git)
```bash
cd /app
git pull origin main
```

**ILI** Ako ne koristite Git, kopirajte izmenjene fajlove ručno.

---

#### Korak 2: Frontend Deployment

```bash
cd /app/frontend

# Install dependencies (ako ima novih)
yarn install

# Build production verziju
yarn build

# Restart frontend service
sudo supervisorctl restart frontend
# ILI
pm2 restart frontend
```

---

#### Korak 3: Backend Deployment

```bash
cd /app/backend

# Install dependencies (ako ima novih)
pip install -r requirements.txt

# Kreiraj novi direktorijum za promo banere
mkdir -p uploads/promo_banners

# Restart backend service
sudo supervisorctl restart backend
# ILI
pm2 restart backend
```

---

#### Korak 4: MongoDB Setup (Ako je potrebno)

Nije potrebno kreirati kolekcije unapred. MongoDB će automatski kreirati `promo_banner` kolekciju kada se sačuva prvi baner.

---

#### Korak 5: Verifikacija

**1. Provera Servisa:**
```bash
sudo supervisorctl status
# ILI
pm2 status
```

**2. Provera Logova:**
```bash
# Backend logovi
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log

# Frontend logovi
tail -f /var/log/supervisor/frontend.err.log
tail -f /var/log/supervisor/frontend.out.log
```

**3. Provera Zdravlja API-ja:**
```bash
curl -I https://your-live-site.com/api/health
```

---

## ✅ Post-Deployment Testiranje

### Kritični Test Scenariji

#### 1. Test Poručivanja Samo Proizvoda 🛒
**Koraci:**
1. Idi na `/upload`
2. Dodaj samo proizvod (npr. Fotokalendar)
3. Popuni kontakt informacije
4. Submituj porudžbinu
5. **Očekivano:** Porudžbina uspešno kreirana ✅

---

#### 2. Test Mobilne Navigacije 📱
**Koraci:**
1. Otvori sajt na mobilnom (ili dev tools)
2. Klikni na hamburger meni (☰)
3. Klikni na "Proizvodi"
4. **Očekivano:** Navigacija radi, meni se zatvara ✅

---

#### 3. Test Reklamnog Banera 🎨
**Koraci:**
1. Login u admin panel (`/logovanje`)
2. Idi na "Reklamni Baner"
3. Upload desktop baner (1920x400px)
4. Dodaj link URL (npr. `www.google.com`)
5. Aktiviraj baner
6. Sačuvaj
7. Idi na početnu stranicu
8. **Očekivano:** Baner se prikazuje, link radi ✅

---

#### 4. Test Admin Panela - Proizvodi 📊
**Koraci:**
1. Login u admin panel
2. Scroll do liste porudžbina
3. Pronađi porudžbinu sa proizvodima
4. **Očekivano:** Prikazuje se broj proizvoda u narandžastoj boji ✅

---

#### 5. Test Slika Proizvoda 🖼️
**Koraci:**
1. Idi na `/proizvodi`
2. **Očekivano:** Sve slike proizvoda se prikazuju ✅
3. Idi na admin panel → Proizvodi
4. Klikni "Izmeni" na proizvodu
5. **Očekivano:** Slika proizvoda se prikazuje u edit modal-u ✅

---

### Dodatni Testovi (Opciono)

- [ ] Test kreiranja porudžbine sa fotografijama
- [ ] Test kreiranja porudžbine sa fotografijama + proizvodi
- [ ] Test download-a ZIP fajla (provera nove strukture foldera)
- [ ] Test responsivnosti na različitim uređajima

---

## 🚨 Rollback Plan

Ako nešto pođe po zlu tokom deployment-a:

### Brzi Rollback (Frontend)
```bash
cd /app/frontend
git reset --hard HEAD~1  # Vrati na prethodnu verziju
yarn install
yarn build
sudo supervisorctl restart frontend
```

### Brzi Rollback (Backend)
```bash
cd /app/backend
git reset --hard HEAD~1  # Vrati na prethodnu verziju
pip install -r requirements.txt
sudo supervisorctl restart backend
```

### Restore Backup-a
```bash
# Restore baze
mongorestore --uri="mongodb://localhost:27017/photo_print_app" /backup/[timestamp]/photo_print_app

# Restore koda
cd /app
tar -xzf backup_[timestamp].tar.gz
sudo supervisorctl restart all
```

---

## 📊 Monitoring Post-Deployment

### Stvari za Praćenje Prvih 24h

1. **Error Rate:**
   - Proveri logove za greške
   - Prati Sentry/error tracking (ako postoji)

2. **Performance:**
   - Page load time
   - API response time
   - MongoDB query performance

3. **User Behavior:**
   - Conversion rate (porudžbine)
   - Bounce rate
   - Mobile vs Desktop traffic

4. **Specifični Metrici:**
   - Broj porudžbina samo proizvoda
   - Broj klikova na promo baner
   - Mobile navigation usage

---

## 🔐 Sigurnosne Provere

- [ ] **Proveri da Admin rute zahtevaju autentifikaciju**
  ```bash
  curl -I https://your-site.com/api/admin/promo-banner
  # Očekivano: 401 Unauthorized (bez tokena)
  ```

- [ ] **Proveri upload validaciju**
  - Pokušaj upload nepodržanih formata
  - Pokušaj upload prevelikih fajlova

- [ ] **Proveri CORS postavke**
  - Frontend može pristupiti backend API-ju
  - Nema otvorenih CORS za nepotrebne domene

---

## 📝 Poznati Problemi i Ograničenja

### 1. Promo Baner
- **Ograničenje:** Maksimalno 10MB po slici
- **Napomena:** WebP format nije obavezan, ali preporučen

### 2. ZIP Struktura
- **Napomena:** Stare porudžbine imaju staru strukturu
- **Nove porudžbine** će imati novu strukturu automatski

### 3. MongoDB
- **Napomena:** `promo_banner` kolekcija će biti kreirana automatski
- Nema potrebe za manuelnim setup-om

---

## 📞 Kontakt za Podršku

Ako naiđete na probleme tokom deployment-a:

1. **Proveri logove prvo** (`/var/log/supervisor/`)
2. **Proveri MongoDB status** (`sudo systemctl status mongodb`)
3. **Proveri disk prostor** (`df -h`)
4. **Restart servisa** (`sudo supervisorctl restart all`)

---

## 📅 Deployment Informacije

**Pripremio:** AI Agent (E1)  
**Datum:** Decembar 2025  
**Verzija:** 1.0  
**Environment:** Production  
**Estimated Downtime:** 5-10 minuta (ako se radi restart servisa)

---

## ✅ Finalni Checklist

- [ ] Backup kreiran
- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] Servisi restartovani
- [ ] Post-deployment testovi prošli
- [ ] Nema grešaka u logovima
- [ ] Live sajt funkcionalan
- [ ] Dokumentacija arhivirana

---

**Srećan Deployment! 🚀**
