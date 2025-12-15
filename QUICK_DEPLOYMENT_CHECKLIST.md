# ⚡ Brzi Deployment Checklist

## 🎯 Za Iskusne Developere

---

## Pre Deployment-a
```bash
# 1. Backup
mongodump --uri="mongodb://localhost:27017/photo_print_app" --out=/backup/$(date +%Y%m%d)
cd /app && tar -czf backup_$(date +%Y%m%d).tar.gz frontend backend

# 2. Pull kod
git pull origin main
```

---

## Deployment
```bash
# Frontend
cd /app/frontend
yarn install
yarn build
sudo supervisorctl restart frontend

# Backend
cd /app/backend
pip install -r requirements.txt
mkdir -p uploads/promo_banners
sudo supervisorctl restart backend
```

---

## Verifikacija
```bash
# Status servisa
sudo supervisorctl status

# Logovi
tail -50 /var/log/supervisor/backend.err.log
tail -50 /var/log/supervisor/frontend.err.log

# Test API
curl -I https://your-site.com/api/health
```

---

## Brzo Testiranje

### 1. Mobilna Navigacija
- [ ] Hamburger meni radi na mobilnom

### 2. Promo Baner
- [ ] Admin panel: `/logovanje/promo-banner`
- [ ] Upload baner, aktiviraj
- [ ] Proveri na početnoj strani

### 3. Proizvodi
- [ ] Slike proizvoda vidljive na `/proizvodi`
- [ ] Admin panel: broj proizvoda prikazan

### 4. Porudžbine
- [ ] Test: Poruči samo proizvod (bez fotografija)

---

## Rollback (Ako Nešto Pođe Po Zlu)
```bash
cd /app
tar -xzf backup_[date].tar.gz
sudo supervisorctl restart all
mongorestore --uri="mongodb://localhost:27017/photo_print_app" /backup/[date]
```

---

## Glavne Izmene

✅ **Nove Funkcionalnosti:**
- Reklamni baner sistem (3 formata)
- Mobilna navigacija (hamburger meni)
- ZIP organizacija proizvoda po varijanti
- Admin panel - prikaz broja proizvoda

✅ **Bug Fix-ovi:**
- Poručivanje samo proizvoda
- Prikazivanje slika proizvoda

✅ **UI Poboljšanja:**
- Veće slike proizvoda na mobilnom (+21%)

---

## Kritični Fajlovi

**Novi:**
- `frontend/src/components/PromoBanner.jsx`
- `frontend/src/components/AdminPromoBanner.jsx`

**Ažurirani:**
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/HomePage.jsx`
- `frontend/src/components/ProductsPage.jsx`
- `frontend/src/components/AdminDashboard.jsx`
- `frontend/src/App.js`
- `backend/server.py`
- `backend/models/order.py`
- `backend/utils/order_utils.py`

---

## Novi Backend Endpoints

- `GET /api/promo-banner`
- `GET /api/admin/promo-banner`
- `POST /api/admin/promo-banner/upload-image`
- `PUT /api/admin/promo-banner`
- `GET /api/uploads/promo_banners/{filename}`

---

## Nova MongoDB Kolekcija

- `promo_banner` (kreira se automatski)

---

## Preporučeno Vreme Deployment-a

⏰ **5-10 minuta** (sa restart-om servisa)

---

**Detaljniji vodič:** Vidi `/app/DEPLOYMENT_GUIDE.md`
