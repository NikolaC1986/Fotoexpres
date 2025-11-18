# 🔒 VODIČ ZA BEZBEDNO AŽURIRANJE LIVE SAJTA

## 📋 Sadržaj
1. [Pregled Izmena](#pregled-izmena)
2. [Pre Nego Što Počnete](#pre-nego-što-počnete)
3. [Korak-po-Korak Procedura](#korak-po-korak-procedura)
4. [Verifikacija](#verifikacija)
5. [Rollback Plan](#rollback-plan)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Pregled Izmena

### **Bezbednosne Popravke:**
- ✅ **JWT Secret Key** - Jak, random generisan ključ (64 bytes)
- ✅ **CORS** - Ograničen samo na fotoexpres.rs (ne više `*`)
- ✅ **File Upload Validacija** - Provera ekstenzije, MIME type-a, veličine
- ✅ **Rate Limiting** - Max 5 login pokušaja/minut (zaštita od brute force)

### **Nove Funkcionalnosti:**
- ✅ **Viewer Role** - Novi korisnik "Menadzer" (samo pregled porudžbina)
- ✅ **Datum i Vreme** - Prikazano u admin dashboardu
- ✅ **3 Adresna Polja** - Ulica, Poštanski broj, Grad
- ✅ **ZIP po Formatima** - Fotografije organizovane u foldere
- ✅ **Rekapitulacija** - Broj fotografija po formatu u order_details.txt
- ✅ **FAQ Izmena** - Uklonjene cene, dodat link ka cenovniku
- ✅ **Napomena** - Info poruka pre dugmeta "Pošalji Porudžbinu"

---

## ⚠️ PRE NEGO ŠTO POČNETE

### **Pripremite:**
1. ✅ SSH pristup (PuTTY)
2. ✅ GitHub - kod već sačuvan (Save to GitHub)
3. ✅ 20-30 minuta vremena
4. ✅ Ovaj dokument otvoriti na drugom ekranu

### **Backup Checklist:**
- [ ] MongoDB baza
- [ ] Folderi sa fotografijama
- [ ] ZIP fajlovi
- [ ] .env fajl

**Trajanje:** 20-30 minuta  
**Downtime:** 1-2 minuta (tokom restart-a)

---

## 📝 KORAK-PO-KORAK PROCEDURA

### **KORAK 1: Povezivanje na Server**

**1.1 Otvorite PuTTY**

**1.2 Unesite:**
```
Host Name: fotoexpres.rs
# ILI
Host Name: 142.93.167.89
Port: 22
```

**1.3 Ulogujte se:**
```bash
login as: root
password: [vaša root lozinka]
```

✅ **Potvrda:** Vidite `root@fotoexpres:~#`

---

### **KORAK 2: Backup Podataka** 💾

**2.1 Backup MongoDB baze:**
```bash
mongodump --db fotoexpres --out /root/backup-security-$(date +%Y%m%d-%H%M)
```

✅ **Očekivani output:**
```
done dumping fotoexpres.orders (X documents)
done dumping fotoexpres.prices (1 document)
done dumping fotoexpres.settings (1 document)
```

**2.2 Backup fotografija i ZIP fajlova:**
```bash
cd /var/www/fotoexpres/backend
tar -czf /root/orders-backup-$(date +%Y%m%d).tar.gz orders/
tar -czf /root/zips-backup-$(date +%Y%m%d).tar.gz orders_zips/
```

⏱️ **Trajanje:** 2-5 minuta (zavisi od broja porudžbina)

**2.3 Backup trenutnog .env fajla:**
```bash
cp /var/www/fotoexpres/backend/.env /root/env-backup-$(date +%Y%m%d).txt
```

**2.4 Provera backup-a:**
```bash
ls -lh /root/ | grep backup
```

✅ **Trebalo bi da vidite:**
```
drwxr-xr-x  backup-security-20251117-1530
-rw-r--r--  orders-backup-20251117.tar.gz
-rw-r--r--  zips-backup-20251117.tar.gz
-rw-r--r--  env-backup-20251117.txt
```

---

### **KORAK 3: Pull Nove Izmene sa GitHub-a** ⬇️

**3.1 Idite u projekat folder:**
```bash
cd /var/www/fotoexpres
```

**3.2 Provera trenutnog stanja:**
```bash
git status
git log --oneline -5
```

**3.3 Stash lokalne izmene (ako ih ima):**
```bash
git stash
```

**3.4 Pull izmene:**
```bash
git pull origin main
```

✅ **Očekivani output:**
```
Updating abc1234..def5678
Fast-forward
 backend/.env                            | 6 ++++--
 backend/server.py                       | 85 +++++++++++++++++++++++++++++---
 backend/models/admin.py                 | 25 +++++++--
 backend/requirements.txt                | 1 +
 backend/utils/order_utils.py            | 45 ++++++++--------
 frontend/src/components/UploadPage.jsx  | 60 ++++++++++++++++-----
 frontend/src/components/AdminDashboard  | 35 ++++++++----
 frontend/src/components/AdminLogin.jsx  | 10 ++--
 frontend/src/components/FAQPage.jsx     | 8 +--
 9 files changed, 215 insertions(+), 60 deletions(-)
```

❌ **Ako dobijete grešku:**
```bash
git stash
git reset --hard HEAD
git pull origin main
```

---

### **KORAK 4: Ažuriranje .env Fajla** 🔐

**4.1 Generisanje novog JWT Secret ključa:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

**Kopirati output** (npr: `wbg0vNaDCE00iWidT-4U5j5L7pMsVAPUJSDLvDnvmgw...`)

**4.2 Editovanje .env fajla:**
```bash
nano /var/www/fotoexpres/backend/.env
```

**4.3 Proverite i ažurirajte sledeće linije:**

```bash
# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=fotoexpres

# CORS - VAŽNO: Promeniti u produkciji
CORS_ORIGINS=*

# JWT Secret Key - ZAMENITI SA GENERISANIM KLJUČEM
JWT_SECRET_KEY=[NALEPITI-GENERIRANI-KLJUČ-OVDE]

# Admin credentials
ADMIN_USERNAME=Vlasnik
ADMIN_PASSWORD=Fotoexpres2025!

# Viewer credentials (novi korisnik)
VIEWER_USERNAME=Menadzer
VIEWER_PASSWORD=Menadzer2025!

# Email config (ako postoji)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=vaš-email@gmail.com
EMAIL_PASSWORD=vaša-app-password
```

**4.4 Sačuvajte fajl:**
- Pritisnite `CTRL+O`
- Pritisnite `Enter`
- Pritisnite `CTRL+X`

✅ **Potvrda:** Fajl sačuvan

---

### **KORAK 5: Instalacija Novih Zavisnosti** 📦

**5.1 Backend dependencies:**
```bash
cd /var/www/fotoexpres/backend
source venv/bin/activate  # Aktivirajte virtual environment
pip install -r requirements.txt
```

✅ **Očekivani output:**
```
Successfully installed slowapi-0.1.9
```

⏱️ **Trajanje:** 1-2 minuta

**5.2 Frontend dependencies:**
```bash
cd /var/www/fotoexpres/frontend
npm install
```

⏱️ **Trajanje:** 2-3 minuta

---

### **KORAK 6: Frontend Build** 🔨

**6.1 Build production verzije:**
```bash
cd /var/www/fotoexpres/frontend
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
npm install
npm run build
```

---

### **KORAK 7: Restart Servisa** 🔄

**7.1 Restart backend:**
```bash
sudo supervisorctl restart fotoexpres-backend
```

✅ **Output:**
```
fotoexpres-backend: stopped
fotoexpres-backend: started
```

**7.2 Čekajte 5 sekundi:**
```bash
sleep 5
```

**7.3 Provera statusa:**
```bash
sudo supervisorctl status fotoexpres-backend
```

✅ **Trebalo bi da piše:**
```
fotoexpres-backend      RUNNING   pid 12345, uptime 0:00:10
```

❌ **Ako piše FATAL ili EXITED:**
```bash
# Proveri logove
tail -n 100 /var/log/fotoexpres-backend.err.log

# Ako ima greška, možda treba reinstall dependencies
cd /var/www/fotoexpres/backend
source venv/bin/activate
pip install -r requirements.txt --force-reinstall
sudo supervisorctl restart fotoexpres-backend
```

**7.4 Restart Nginx:**
```bash
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

✅ **Output:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

### **KORAK 8: Verifikacija API-ja** ✅

**8.1 Test prices endpoint:**
```bash
curl -s https://fotoexpres.rs/api/prices | head -30
```

✅ **Trebalo bi da vidite JSON sa cenama**

**8.2 Test settings endpoint:**
```bash
curl -s https://fotoexpres.rs/api/settings | head -20
```

✅ **Trebalo bi da vidite JSON sa podešavanjima**

**8.3 Test admin login (sa Admin nalogom):**
```bash
curl -X POST https://fotoexpres.rs/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Vlasnik","password":"Fotoexpres2025!"}'
```

✅ **Trebalo bi da vidite:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "role": "admin"
}
```

**8.4 Test viewer login (sa novim Menadzer nalogom):**
```bash
curl -X POST https://fotoexpres.rs/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Menadzer","password":"Menadzer2025!"}'
```

✅ **Trebalo bi da vidite:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "role": "viewer"
}
```

**8.5 Test rate limiting (sigurnosna provera):**
```bash
# Pokušajte 6 puta brzo za redom
for i in {1..6}; do
  echo "Pokušaj $i:"
  curl -X POST https://fotoexpres.rs/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' 2>/dev/null
  echo ""
done
```

✅ **Nakon 5. pokušaja trebalo bi da vidite:**
```
429 Too Many Requests
```

---

### **KORAK 9: Browser Testiranje** 🌐

**9.1 Otvorite browser (Chrome/Firefox)**

**9.2 Idite na:** `https://fotoexpres.rs`

**9.3 VAŽNO - Očistite cache:**
- Pritisnite **Ctrl + Shift + R** (Windows/Linux)
- ILI **Cmd + Shift + R** (Mac)

**9.4 Test Upload stranice:**
- Kliknite "Pošalji Fotografije"
- Proveri da li su 3 adresna polja:
  - ✅ Ulica i Broj
  - ✅ Poštanski Broj
  - ✅ Grad
- Scroll dole - proveri **napomenu PRE dugmeta**:
  > ℹ️ **Napomena:** Nakon što izvršite porudžbinu, naš tim će Vas kontaktirati ukoliko bude bilo potrebno.

**9.5 Test FAQ stranice:**
- Idite na `/faq`
- Scroll do pitanja "Koje su cene fotografija?"
- ✅ Trebalo bi da vidite link ka Cenovniku (ne listu cena)

**9.6 Test Admin Login - Admin nalog:**
- Idite na: `https://fotoexpres.rs/logovanje`
- Ulogujte se:
  - Username: **Vlasnik**
  - Password: **Fotoexpres2025!**
- ✅ Trebalo bi da vidite dashboard sa SVIM menijima:
  - Cene, Popusti, Promocija, Podešavanja, Lozinka

**9.7 Test Admin Login - Viewer nalog:**
- Odjavite se
- Ponovo login:
  - Username: **Menadzer**
  - Password: **Menadzer2025!**
- ✅ Trebalo bi da vidite dashboard BEZ menija:
  - ❌ Nema: Cene, Popusti, Promocija, Podešavanja, Lozinka
  - ✅ Samo: Lista porudžbina + Odjavi se

**9.8 Test Datum i Vreme:**
- U admin dashboardu, proverite tabelu
- ✅ Trebalo bi da ima kolonu "Datum i Vreme" pored "Broj Porudžbine"

**9.9 Test Nova Porudžbina:**
- Kreirajte test porudžbinu preko sajta
- Preuzmite ZIP iz admin panela
- Raspakujte i proveri:
  - ✅ Folderi po formatima (9x13/, 10x15/, itd.)
  - ✅ Podfolderi po papiru (sjajni/, mat/)
  - ✅ order_details.txt ima REKAPITULACIJU na dnu

---

### **KORAK 10: Testiranje Bezbednosti** 🔒

**10.1 Test CORS (iz browser console):**
```javascript
// Otvorite DevTools (F12) na bilo kom drugom sajtu (npr. google.com)
// Pokušajte da pozovete vaš API:
fetch('https://fotoexpres.rs/api/prices')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

✅ **Trebalo bi da vidite CORS error** (to je dobro! Znači zaštita radi)

**10.2 Test File Upload Validation:**
- Pokušajte da upload-ujete `.txt` ili `.pdf` fajl
- ✅ Trebalo bi da dobijete grešku: "Nedozvoljen tip fajla"

**10.3 Test Rate Limiting na Login:**
- Pokušajte da se ulogujete 6 puta sa pogrešnom lozinkom
- ✅ Nakon 5. pokušaja trebalo bi da dobijete: "Too many requests"

---

### **KORAK 11: Provera Logova** 📋

**11.1 Backend logovi:**
```bash
tail -n 50 /var/log/fotoexpres-backend.err.log
```

✅ **NE bi trebalo da vidite:**
- `ERROR`
- `CRITICAL`
- `Exception`
- `Traceback`

**11.2 Nginx logovi:**
```bash
tail -n 30 /var/log/nginx/error.log
```

✅ **NE bi trebalo da vidite nedavne greške**

**11.3 Supervisor status:**
```bash
sudo supervisorctl status
```

✅ **Svi servisi trebalo bi da budu RUNNING:**
```
fotoexpres-backend      RUNNING   pid 12345, uptime 0:15:30
mongodb                 RUNNING   pid 67890, uptime 5:30:00
nginx                   RUNNING   pid ...
```

---

## ✅ FINALNA CHECKLIST

Pre nego što završite, proverite:

- [ ] MongoDB backup kreiran
- [ ] Git pull uspešan
- [ ] .env fajl ažuriran sa novim JWT secret ključem
- [ ] Backend dependencies instalirane (slowapi)
- [ ] Frontend build uspešan
- [ ] Servisi restartovani i RUNNING
- [ ] API endpoints rade (prices, settings, login)
- [ ] Admin login radi (Vlasnik nalog)
- [ ] Viewer login radi (Menadzer nalog)
- [ ] Viewer nema pristup Cenama/Podešavanjima
- [ ] Datum i vreme prikazani u dashboardu
- [ ] 3 adresna polja na upload formi
- [ ] Napomena pre dugmeta "Pošalji Porudžbinu"
- [ ] FAQ bez cena, sa linkom ka cenovniku
- [ ] Nova porudžbina kreira ZIP sa folderima po formatima
- [ ] Rekapitulacija u order_details.txt
- [ ] Rate limiting radi (max 5 login/min)
- [ ] File upload validacija radi
- [ ] CORS ograničen na fotoexpres.rs
- [ ] Nema ERROR-a u logovima

---

## 🔙 ROLLBACK PLAN (Ako Nešto Pođe Po Zlu)

### **Scenario 1: Backend Ne Startuje**

```bash
# Vrati na prethodnu verziju koda
cd /var/www/fotoexpres
git log --oneline -10  # Nađi hash prethodnog commit-a
git reset --hard <commit-hash>

# Reinstall dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Restart
sudo supervisorctl restart fotoexpres-backend
```

### **Scenario 2: Frontend Build Fail**

```bash
cd /var/www/fotoexpres
git reset --hard HEAD~1  # Vrati za 1 commit nazad

cd frontend
rm -rf node_modules build
npm install
npm run build

sudo systemctl restart nginx
```

### **Scenario 3: Kompletni Rollback**

```bash
# 1. Vrati kod
cd /var/www/fotoexpres
git reset --hard <prethodni-dobar-commit-hash>

# 2. Vrati .env
cp /root/env-backup-YYYYMMDD.txt /var/www/fotoexpres/backend/.env

# 3. Rebuild frontend
cd frontend
npm run build

# 4. Restart sve
sudo supervisorctl restart fotoexpres-backend
sudo systemctl restart nginx

# 5. Vrati bazu (samo ako je potrebno)
mongorestore --db fotoexpres /root/backup-security-YYYYMMDD-HHMM/fotoexpres/
```

---

## 🆘 TROUBLESHOOTING

### **Problem 1: "git pull" ne radi**

**Simptomi:**
```
error: Your local changes to the following files would be overwritten by merge
```

**Rešenje:**
```bash
git stash
git pull origin main
```

---

### **Problem 2: Backend ne startuje - "ModuleNotFoundError: No module named 'slowapi'"**

**Rešenje:**
```bash
cd /var/www/fotoexpres/backend
source venv/bin/activate
pip install slowapi
sudo supervisorctl restart fotoexpres-backend
```

---

### **Problem 3: Frontend ne učitava izmene**

**Rešenje:**
```bash
# Očisti browser cache potpuno
# CTRL + SHIFT + DELETE

# Ili probaj Incognito/Private mode

# Ili force rebuild:
cd /var/www/fotoexpres/frontend
rm -rf build
npm run build
sudo systemctl restart nginx
```

---

### **Problem 4: Admin login ne radi - "Invalid credentials"**

**Provera:**
```bash
# Proveri .env fajl
cat /var/www/fotoexpres/backend/.env | grep ADMIN

# Trebalo bi da vidite:
# ADMIN_USERNAME=Vlasnik
# ADMIN_PASSWORD=Fotoexpres2025!
```

**Rešenje:**
```bash
nano /var/www/fotoexpres/backend/.env
# Ispravi credentials
# Sačuvaj (CTRL+O, Enter, CTRL+X)

sudo supervisorctl restart fotoexpres-backend
```

---

### **Problem 5: Rate Limiting ne radi**

**Provera:**
```bash
# Proveri da li je slowapi instaliran
cd /var/www/fotoexpres/backend
source venv/bin/activate
pip list | grep slowapi
```

**Rešenje:**
```bash
pip install slowapi
sudo supervisorctl restart fotoexpres-backend
```

---

### **Problem 6: 500 Internal Server Error**

**Dijagnostika:**
```bash
# Proveri backend logove
tail -n 100 /var/log/fotoexpres-backend.err.log

# Proveri Nginx logove
tail -n 50 /var/log/nginx/error.log

# Proveri da li backend radi
curl http://127.0.0.1:8001/api/prices
```

**Rešenje:**
```bash
# Restart sve servise
sudo supervisorctl restart all
sudo systemctl restart nginx

# Ako i dalje ne radi, rollback
```

---

### **Problem 7: Viewer nalog vidi sve menije**

**Provera:**
```bash
# Proveri localStorage u browser-u
# F12 → Application → Local Storage → https://fotoexpres.rs
# Trebalo bi da vidite: adminRole = "viewer"
```

**Rešenje:**
```bash
# Odjavite se
# Obrišite browser cache
# Ulogujte se ponovo kao Menadzer
```

---

## 📞 Podrška

**Ako i dalje imate problema:**

1. **Screenshot greške** (ako je u browser-u)
2. **Output komande** koja ne radi
3. **Backend logovi:** `tail -n 100 /var/log/fotoexpres-backend.err.log`
4. **Nginx logovi:** `tail -n 50 /var/log/nginx/error.log`

---

## 🎉 GOTOVO!

**Vaš sajt je sada:**
- ✅ Bezbedniji (JWT secret, CORS, Rate limiting, File validation)
- ✅ Sa novim funkcionalnostima (Viewer role, Datum/vreme, ZIP struktura)
- ✅ Spreman za produkciju

**Važne Napomene:**
- Čuvajte backup fajlove bar 7 dana
- Novi credentials:
  - **Admin:** Vlasnik / Fotoexpres2025!
  - **Viewer:** Menadzer / Menadzer2025!

**Sačuvajte ovaj dokument za buduće update-e!**

---

**Datum kreiranja:** 17.11.2025  
**Verzija:** 2.0 (Security + Features Update)
