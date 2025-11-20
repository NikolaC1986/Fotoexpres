# 🚀 UPUTSTVO ZA AŽURIRANJE LIVE SAJTA - Nove Funkcionalnosti

## 📋 Pregled Novih Izmena

### **Backend:**
1. ✅ ZIP struktura po količini - `format/finish/quantity/photo.jpg`
2. ✅ Endpoint za promenu Menadžer šifre
3. ✅ Radno vreme u settings

### **Frontend:**
1. ✅ AdminPassword - Promena Menadžer šifre
2. ✅ AdminSettings - Input za radno vreme
3. ✅ UploadPage - Thumbnail fix + Back to Top dugme
4. ✅ Navbar - Prikazivanje radnog vremena
5. ✅ FAQ - Prikazivanje radnog vremena

---

## ⏱️ Procenjeno Vreme: 15-20 minuta

---

# 🔧 KORAK-PO-KORAK PROCEDURA

## 📝 PRIPREMA

### Šta vam treba:
- ✅ PuTTY ili SSH klijent
- ✅ IP adresa: `fotoexpres.rs` ili `142.93.167.89`
- ✅ Root lozinka
- ✅ 20 minuta vremena

---

## 🔌 KORAK 1: Povezivanje na Server

```bash
# Otvorite PuTTY i unesite:
Host: fotoexpres.rs (ili 142.93.167.89)
Port: 22

# Ulogujte se:
login as: root
password: [vaša-root-lozinka]
```

✅ **Potvrda:** Vidite `root@fotoexpres:~#`

---

## 💾 KORAK 2: Backup (OBAVEZNO!)

```bash
# 1. Backup MongoDB baze
mongodump --db fotoexpres --out /root/backup-features-$(date +%Y%m%d-%H%M)

# 2. Backup fotografija
cd /var/www/fotoexpres/backend
tar -czf /root/orders-backup-$(date +%Y%m%d).tar.gz orders/ orders_zips/

# 3. Backup .env
cp /var/www/fotoexpres/backend/.env /root/env-backup-$(date +%Y%m%d).txt

# 4. Provera backup-a
ls -lh /root/ | grep backup
```

✅ **Očekivani output:**
```
drwxr-xr-x  backup-features-20251118-1530
-rw-r--r--  orders-backup-20251118.tar.gz
-rw-r--r--  env-backup-20251118.txt
```

⏱️ **Trajanje:** 2-3 minuta

---

## ⬇️ KORAK 3: Git Pull

```bash
# 1. Idite u projekat folder
cd /var/www/fotoexpres

# 2. Stash lokalne izmene (ako ih ima)
git stash

# 3. Pull nove izmene
git pull origin main
```

✅ **Očekivani output:**
```
Updating abc1234..def5678
Fast-forward
 backend/utils/order_utils.py            | 15 +++++++++++---
 backend/models/admin.py                 | 5 +++++
 backend/server.py                       | 95 +++++++++++++++++++++++++
 frontend/src/components/AdminPassword   | 150 ++++++++++++++++++++++++++++++++
 frontend/src/components/AdminSettings   | 45 ++++++++---
 frontend/src/components/UploadPage.jsx  | 35 +++++++--
 frontend/src/components/Navbar.jsx      | 10 ++-
 frontend/src/components/FAQPage.jsx     | 8 +-
 8 files changed, 340 insertions(+), 23 deletions(-)
```

❌ **Ako dobijete grešku:**
```bash
git stash
git reset --hard HEAD
git pull origin main
```

⏱️ **Trajanje:** 30 sekundi

---

## 🔍 KORAK 4: Provera .env Fajla (Opcionalno)

```bash
# Proverite da li .env ima sve potrebne varijable
cat /var/www/fotoexpres/backend/.env
```

✅ **Trebalo bi da vidite:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=fotoexpres
JWT_SECRET_KEY=[neki-random-string]
ADMIN_USERNAME=Vlasnik
ADMIN_PASSWORD=Fotoimidz2025
VIEWER_USERNAME=Menadzer
VIEWER_PASSWORD=Menadzer2025!
```

**NAPOMENA:** 
- Ako već postoji JWT_SECRET_KEY - **NE MENJAJTE GA!**
- Ako nedostaje VIEWER_USERNAME i VIEWER_PASSWORD, dodajte ih:

```bash
nano /var/www/fotoexpres/backend/.env

# Dodajte na kraj:
VIEWER_USERNAME=Menadzer
VIEWER_PASSWORD=Menadzer2025!

# Sačuvaj: CTRL+O → Enter → CTRL+X
```

⏱️ **Trajanje:** 1 minut

---

## 📦 KORAK 5: Backend Dependencies (Provera)

```bash
cd /var/www/fotoexpres/backend
source venv/bin/activate

# Provera da li je slowapi instaliran (iz prethodnog update-a)
pip list | grep slowapi

# Ako NIJE instaliran:
pip install slowapi

# Ako JE instaliran, skip ovaj korak
```

✅ **Očekivani output:**
```
slowapi    0.1.9
```

⏱️ **Trajanje:** 30 sekundi (ako je već instaliran)

---

## 🔨 KORAK 6: Frontend Build

```bash
cd /var/www/fotoexpres/frontend

# 1. Install dependencies (ako ima novih)
npm install --legacy-peer-deps

# 2. Build production verzije
npm run build
```

✅ **Očekivani output:**
```
Creating an optimized production build...
Compiled successfully!

File sizes after gzip:
  XX.XX kB  build/static/js/main.abc123.js
  XX.XX kB  build/static/css/main.def456.css

The build folder is ready to be deployed.
```

⏱️ **Trajanje:** 3-5 minuta

❌ **Ako build fail-uje:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

---

## 🔄 KORAK 7: Restart Servisa

```bash
# 1. Restart backend
sudo supervisorctl restart fotoexpres-backend

# 2. Čekaj 5 sekundi
sleep 5

# 3. Proveri status
sudo supervisorctl status fotoexpres-backend
```

✅ **Trebalo bi da piše:**
```
fotoexpres-backend      RUNNING   pid 12345, uptime 0:00:10
```

❌ **Ako piše FATAL ili EXITED:**
```bash
# Proveri logove
tail -n 50 /var/log/fotoexpres-backend.err.log

# Možda treba reinstall dependencies
cd /var/www/fotoexpres/backend
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart fotoexpres-backend
```

```bash
# 4. Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

✅ **Output:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

⏱️ **Trajanje:** 1 minut

---

## ✅ KORAK 8: Testiranje Backend API

### **Test 1: Settings sa Radnim Vremenom**
```bash
curl -s https://fotoexpres.rs/api/settings | grep workingHours
```

✅ **Očekivani output:**
```json
"workingHours":"Pon-Pet: 08:00-17:00, Sub: 09:00-14:00"
```

### **Test 2: Admin Login**
```bash
curl -X POST https://fotoexpres.rs/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Vlasnik","password":"Fotoimidz2025"}'
```

✅ **Očekivani output:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "message": "Login successful",
  "role": "admin"
}
```

### **Test 3: Viewer Login**
```bash
curl -X POST https://fotoexpres.rs/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Menadzer","password":"Menadzer2025!"}'
```

✅ **Očekivani output:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "message": "Login successful",
  "role": "viewer"
}
```

⏱️ **Trajanje:** 2 minuta

---

## 🌐 KORAK 9: Browser Testiranje

### **1. Očistite Browser Cache**
```
CTRL + SHIFT + R (Windows/Linux)
CMD + SHIFT + R (Mac)
```

### **2. Test Upload Stranice (Thumbnail + Back to Top)**

**Idite na:** `https://fotoexpres.rs/upload`

**Provera 1: Thumbnail Prikaz**
- Upload-ujte fotografiju
- ✅ Thumbnail prikazuje **CELU** fotografiju (ne seče se)
- ✅ Sivi background oko fotografije

**Provera 2: Back to Top Dugme**
- Scroll dole na stranicu
- ✅ Narandžasto dugme se pojavljuje u donjem desnom uglu
- Kliknite dugme
- ✅ Smooth scroll do vrha

**Provera 3: Delete Dugme**
- Hover preko fotografije
- ✅ Crveno X dugme se pojavljuje
- Kliknite X
- ✅ Fotografija se odmah briše

### **3. Test Navbar (Radno Vreme)**

**Idite na:** `https://fotoexpres.rs`

**Provera:**
- Pogledajte vrh stranice (header)
- ✅ Trebalo bi da vidite: "Telefon | **Radno vreme** | Besplatna dostava"

### **4. Test FAQ (Radno Vreme)**

**Idite na:** `https://fotoexpres.rs/faq`

**Provera:**
- Scroll do kraja stranice (kontakt informacije)
- ✅ Trebalo bi da vidite:
  ```
  Telefon: +381 XX XXX XXXX
  Radno vreme: [Vaše radno vreme]
  Email: kontakt@fotoexpres.rs
  ```

### **5. Test Admin Panel - Vlasnik**

**Idite na:** `https://fotoexpres.rs/logovanje`

**Login:**
- Username: **Vlasnik**
- Password: **Fotoimidz2025**

**Provera 1: Dashboard**
- ✅ Vidite sve menije: Cene, Popusti, Promocija, Podešavanja, Lozinka
- ✅ Tabela ima kolonu "Datum i Vreme"

**Provera 2: Podešavanja**
- Kliknite "Podešavanja"
- ✅ Vidite novo polje: "Radno vreme"
- Upišite novo radno vreme (npr. "Pon-Ned: 00:00-24:00")
- Kliknite "Sačuvaj Podešavanja"
- ✅ Trebalo bi: "Podešavanja su uspešno sačuvana"

**Provera 3: Lozinka (Nova funkcija!)**
- Kliknite "Lozinka"
- Scroll dole
- ✅ Vidite ZELENI card: "Promena lozinke - Menadžer nalog"
- ✅ Polje za unos nove lozinke za Menadžer
- (Možete promeniti Menadžer šifru ako želite)

### **6. Test Admin Panel - Menadžer**

**Odjavite se i ponovo login:**
- Username: **Menadzer**
- Password: **Menadzer2025!**

**Provera:**
- ✅ Dashboard NEMA menije (Cene, Popusti, itd.)
- ✅ Samo vidite: Lista porudžbina + Odjavi se
- ✅ Možete preuzeti ZIP fajlove

### **7. Test Nova Porudžbina (ZIP po Količini)**

**Kreirajte test porudžbinu:**
- Idite na `/upload`
- Upload-ujte nekoliko fotografija
- Postavite različite količine (npr. 5, 10, 1)
- Pošaljite porudžbinu

**U admin panelu:**
- Preuzmite ZIP fajl nove porudžbine
- Raspakujte ga

**Provera ZIP strukture:**
```
ORD-123456.zip
├── order_details.txt
├── 9x13/
│   ├── sjajni/
│   │   ├── 5/          ← FOLDER PO KOLIČINI!
│   │   │   └── foto1.jpg
│   │   └── 10/         ← FOLDER PO KOLIČINI!
│   │       └── foto2.jpg
│   └── mat/
│       └── 1/          ← FOLDER PO KOLIČINI!
│           └── foto3.jpg
└── 10x15/
    └── sjajni/
        └── 5/
            └── foto4.jpg
```

✅ **Trebalo bi da vidite foldere po količini!**

⏱️ **Trajanje:** 10 minuta

---

## ✅ FINALNA CHECKLIST

Pre nego što završite, proverite:

- [ ] MongoDB backup kreiran
- [ ] Git pull uspešan
- [ ] Frontend build uspešan
- [ ] Backend RUNNING
- [ ] Nginx restartovan
- [ ] API endpoints rade (settings, login)
- [ ] Admin login radi (Vlasnik)
- [ ] Viewer login radi (Menadžer)
- [ ] Viewer nema pristup menijima
- [ ] Thumbnail prikazuje celu fotografiju (ne seče)
- [ ] Back to Top dugme radi
- [ ] Delete fotografiju dugme radi
- [ ] Radno vreme prikazano u Navbar-u
- [ ] Radno vreme prikazano u FAQ
- [ ] Admin može promeniti Menadžer šifru
- [ ] Admin može ažurirati radno vreme u Podešavanjima
- [ ] Nova porudžbina kreira ZIP sa folderima po količini
- [ ] Nema ERROR-a u logovima

---

## 🔙 ROLLBACK (Ako Nešto Pođe Po Zlu)

### **Scenario 1: Backend Ne Radi**

```bash
cd /var/www/fotoexpres
git log --oneline -5
git reset --hard <prethodni-commit-hash>

# Reinstall dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Restart
sudo supervisorctl restart fotoexpres-backend
```

### **Scenario 2: Frontend Ne Učitava Izmene**

```bash
cd /var/www/fotoexpres/frontend
rm -rf build
npm run build
sudo systemctl restart nginx
```

### **Scenario 3: Kompletni Rollback**

```bash
# 1. Vrati kod
cd /var/www/fotoexpres
git reset --hard <prethodni-commit-hash>

# 2. Rebuild frontend
cd frontend
npm run build

# 3. Restart sve
sudo supervisorctl restart fotoexpres-backend
sudo systemctl restart nginx
```

---

## 🆘 TROUBLESHOOTING

### **Problem 1: "Frontend build fails"**

**Rešenje:**
```bash
cd /var/www/fotoexpres/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### **Problem 2: "Backend ne startuje"**

**Dijagnostika:**
```bash
tail -n 100 /var/log/fotoexpres-backend.err.log
```

**Rešenje:**
```bash
cd /var/www/fotoexpres/backend
source venv/bin/activate
pip install -r requirements.txt --force-reinstall
sudo supervisorctl restart fotoexpres-backend
```

### **Problem 3: "Radno vreme ne prikazuje se"**

**Rešenje:**
1. Proveri da li backend vraća workingHours:
   ```bash
   curl -s https://fotoexpres.rs/api/settings | grep workingHours
   ```
2. Ako NE vraća, ažuriraj u admin panelu:
   - Login kao Vlasnik
   - Podešavanja → Radno vreme
   - Unesi i sačuvaj

3. Očisti browser cache i refresh (CTRL+SHIFT+R)

### **Problem 4: "Thumbnail se i dalje seče"**

**Rešenje:**
```bash
# Proveri da li je build bio uspešan
ls -lt /var/www/fotoexpres/frontend/build/static/css/ | head -5

# Ako je prazan ili stari timestamp:
cd /var/www/fotoexpres/frontend
rm -rf build
npm run build
sudo systemctl restart nginx

# Očisti browser cache (CTRL+SHIFT+DELETE)
```

### **Problem 5: "Ne mogu da promenim Menadžer šifru"**

**Provera:**
1. Da li ste ulogovani kao **Vlasnik** (ne Menadžer)?
2. Proveri backend log:
   ```bash
   tail -n 50 /var/log/fotoexpres-backend.err.log
   ```

**Rešenje:**
- Samo Vlasnik može promeniti Menadžer šifru
- Ako ste Vlasnik i ne radi, restart backend-a

---

## 📞 Pomoć

**Ako i dalje imate problema:**

1. **Backend logovi:**
   ```bash
   tail -n 100 /var/log/fotoexpres-backend.err.log
   ```

2. **Nginx logovi:**
   ```bash
   tail -n 50 /var/log/nginx/error.log
   ```

3. **Frontend provera:**
   ```bash
   ls -la /var/www/fotoexpres/frontend/build/
   ```

---

## 🎉 GOTOVO!

**Vaš sajt je sada ažuriran sa svim novim funkcionalnostima:**
- ✅ ZIP po količini
- ✅ Promena Menadžer šifre
- ✅ Radno vreme svuda
- ✅ Thumbnail fix
- ✅ Back to Top dugme
- ✅ Sve radi savršeno!

**Čuvajte backup fajlove bar 7 dana!**

---

**Datum:** 18.11.2025  
**Verzija:** 3.0 (Features Update)
