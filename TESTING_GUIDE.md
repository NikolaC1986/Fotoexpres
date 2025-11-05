# 🧪 Vodič za Testiranje - Photolia Sajt

## Pregled

Ovaj vodič vam pokazuje kako da testirate sve funkcionalnosti vašeg sajta za štampu fotografija.

---

## 1. 🏠 Testiranje Početne Stranice

### Test 1.1: Provera Učitavanja Stranice
1. Otvorite browser
2. Idite na: `http://localhost:3000` (lokalno) ili `https://vaš-domen.com` (produkcija)
3. **Očekivano:**
   - ✅ Stranica se učitava bez grešaka
   - ✅ Vidite "PHOTOLIA" logo
   - ✅ Vidite hero sekciju sa "Odštampajte Uspomene"
   - ✅ Vidite 4 kartice sa uslugama

### Test 1.2: Provera Navigacije
1. Kliknite na sve linkove u meniju:
   - Početna
   - Cenovnik
   - Galerija
   - O Nama
   - Kontakt
2. **Očekivano:**
   - ✅ Linkovi su klikabilni
   - ✅ "Cenovnik" otvara stranicu sa cenama

### Test 1.3: Testiranje Dugmeta "Počni Štampu"
1. Kliknite na plavo dugme "Počni Štampu"
2. **Očekivano:**
   - ✅ Preusmeri vas na `/upload` stranicu

---

## 2. 💰 Testiranje Stranice Cenovnik

### Test 2.1: Prikaz Cena
1. Idite na: `http://localhost:3000/prices`
2. **Očekivano:**
   - ✅ Vidite 4 formata (10x15, 13x18, 15x21, 20x30)
   - ✅ Cene su prikazane (25, 40, 60, 120 RSD)
   - ✅ Vidite "Popularno" oznake
   - ✅ Vidite informacije o dostavi
   - ✅ Vidite popuste za veće porudžbine

---

## 3. 📤 Testiranje Upload Funkcionalnosti

### Test 3.1: Osnovno Slanje Fotografija
1. Idite na: `http://localhost:3000/upload`
2. Kliknite na upload oblast ili prevucite 2-3 fotografije
3. **Očekivano:**
   - ✅ Fotografije se pojavljuju u listi
   - ✅ Prikazuje se preview svake fotografije
   - ✅ Vidite dropdowns za Format, Količinu, Završetak papira

### Test 3.2: Upravljanje Fotografijama
1. Promenite format prve fotografije na "13x18 cm"
2. Kliknite + dugme da povećate količinu na 3
3. Promenite završetak papira na "Mat"
4. Hover preko fotografije i kliknite X dugme
5. **Očekivano:**
   - ✅ Format se menja u dropdown-u
   - ✅ Količina se povećava
   - ✅ "Ukupno" brojka se ažurira
   - ✅ Fotografija se uklanja kada kliknete X

### Test 3.3: Validacija Forme
1. Ne dodajte nijednu fotografiju
2. Kliknite "Pošalji Porudžbinu"
3. **Očekivano:**
   - ✅ Vidite toast poruku "Nema fotografija"
   - ✅ Forma se ne šalje

### Test 3.4: Kompletna Porudžbina
1. Upload 2-3 fotografije
2. Podesite formate i količine
3. Popunite kontakt formu:
   - **Ime**: Petar Petrović
   - **Email**: petar@primer.rs
   - **Telefon**: 066 123 4567
   - **Adresa**: Kneza Miloša 10, Beograd, 11000
   - **Napomene**: Molim brzinu dostavu
4. Kliknite "Pošalji Porudžbinu"
5. **Očekivano:**
   - ✅ Vidite "Slanje porudžbine..." poruku
   - ✅ Zatim "Porudžbina poslata!" sa brojem (npr. #ORD-123456)
   - ✅ Preusmeri vas na početnu stranicu nakon 2 sekunde

---

## 4. 🔐 Testiranje Admin Panela

### Test 4.1: Prijava u Admin Panel
1. Idite na: `http://localhost:3000/admin`
2. Unesite kredencijale:
   - **Korisničko ime**: `admin`
   - **Lozinka**: `admin123`
3. Kliknite "Prijavi Se"
4. **Očekivano:**
   - ✅ Vidite toast "Prijava uspešna"
   - ✅ Preusmeri vas na `/admin/dashboard`

### Test 4.2: Pregled Porudžbina
1. Nakon prijave, vidite Admin Dashboard
2. **Očekivano:**
   - ✅ Vidite statistiku (Ukupno, Na Čekanju, Završeno)
   - ✅ Vidite tabelu sa porudžbinama
   - ✅ Svaka porudžbina prikazuje:
     - Broj porudžbine (ORD-XXXXXX)
     - Ime kupca
     - Kontakt informacije
     - Broj fotografija
     - Status
     - Akcije (Preuzmi, Završi)

### Test 4.3: Preuzimanje ZIP Fajla
1. U tabeli porudžbina, kliknite "Preuzmi" dugme
2. **Očekivano:**
   - ✅ ZIP fajl se automatski preuzima
   - ✅ Naziv fajla: `order-ORD-XXXXXX.zip`
   - ✅ Otvori ZIP:
     - Sadrži sve poslate fotografije
     - Sadrži `order_details.txt` fajl
   - ✅ `order_details.txt` sadrži:
     - Broj porudžbine
     - Datum i vreme
     - Informacije o kupcu
     - Detalje svake fotografije
     - Ukupan broj fotografija

### Test 4.4: Promena Statusa
1. Za porudžbinu sa statusom "Na Čekanju"
2. Kliknite "Završi" dugme
3. **Očekivano:**
   - ✅ Status se menja na "Završeno" (zelena oznaka)
   - ✅ Dugme "Završi" nestaje
   - ✅ Statistika se ažurira

### Test 4.5: Odjava
1. Kliknite "Odjavi Se" dugme
2. **Očekivano:**
   - ✅ Preusmeri vas na login stranicu
   - ✅ Ne možete pristupiti dashboard-u bez ponovne prijave

---

## 5. 📧 Testiranje Email Notifikacija

### Preduslov: Podešavanje Email-a
1. Otvorite `/app/backend/.env`
2. Dodajte:
```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=vaš_email@gmail.com
SMTP_PASSWORD=vaša_app_lozinka
ADMIN_EMAIL=email_gde_želite_da_primate@gmail.com
```
3. Restartujte backend:
```bash
sudo supervisorctl restart backend
```

### Test 5.1: Prijem Email Notifikacije
1. Napravite novu porudžbinu kroz `/upload` stranicu
2. Proverite vaš admin email inbox
3. **Očekivano:**
   - ✅ Primili ste email sa naslovom "Nova Porudžbina - ORD-XXXXXX"
   - ✅ Email sadrži:
     - Broj porudžbine
     - Informacije o kupcu
     - Tabelu sa detaljima fotografija
     - ZIP fajl kao attachment

---

## 6. 🔧 Backend API Testiranje (Curl)

### Test 6.1: Health Check
```bash
curl http://localhost:8001/api/
```
**Očekivano:**
```json
{"message":"Hello World"}
```

### Test 6.2: Kreiranje Porudžbine
```bash
curl -X POST http://localhost:8001/api/orders/create \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg" \
  -F 'order_details={"contactInfo":{"fullName":"Test User","email":"test@test.com","phone":"066123456","address":"Test Street","notes":""},"photoSettings":[{"fileName":"photo1.jpg","format":"10x15","quantity":2,"finish":"glossy"}]}'
```
**Očekivano:**
```json
{
  "success": true,
  "orderNumber": "ORD-123456",
  "message": "Order created successfully",
  "zipFilePath": "/app/backend/orders_zips/order-ORD-123456.zip"
}
```

### Test 6.3: Admin Login
```bash
curl -X POST http://localhost:8001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
**Očekivano:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "message": "Login successful"
}
```

### Test 6.4: Pregled Porudžbina (Admin)
```bash
curl http://localhost:8001/api/admin/orders \
  -H "Authorization: Bearer VAŠ_TOKEN"
```
**Očekivano:**
```json
{
  "orders": [...],
  "stats": {
    "total": 5,
    "pending": 3,
    "completed": 2
  }
}
```

---

## 7. 🗄️ MongoDB Provera

### Test 7.1: Provera Porudžbina u Bazi
```bash
mongosh
use photolia
db.orders.find().pretty()
```

**Očekivano:**
- ✅ Vidite sve porudžbine
- ✅ Svaka porudžbina ima:
  - `orderNumber`
  - `contactInfo`
  - `photoSettings`
  - `status`
  - `createdAt`
  - `totalPhotos`
  - `zipFilePath`

---

## 8. 📁 Fajl Sistem Provera

### Test 8.1: Provera Kreiranih ZIP Fajlova
```bash
ls -lh /app/backend/orders_zips/
```
**Očekivano:**
```
order-ORD-123456.zip
order-ORD-789012.zip
...
```

### Test 8.2: Provera Order Direktorijuma
```bash
ls -R /app/backend/orders/
```
**Očekivano:**
```
/app/backend/orders/ORD-123456:
photo1.jpg  photo2.jpg  order_details.txt
```

---

## 9. 🔥 Testiranje Grešaka

### Test 9.1: Upload Bez Fotografija
1. Idite na `/upload`
2. Samo popunite kontakt formu
3. Kliknite "Pošalji"
4. **Očekivano:**
   - ✅ Toast greška "Nema fotografija"

### Test 9.2: Nepotpune Kontakt Informacije
1. Upload fotografije
2. Popunite samo Ime
3. Kliknite "Pošalji"
4. **Očekivano:**
   - ✅ Toast greška "Nedostaju informacije"

### Test 9.3: Pogrešna Admin Lozinka
1. Idite na `/admin`
2. Unesite: admin / wrong_password
3. **Očekivano:**
   - ✅ Toast greška "Pogrešno korisničko ime ili lozinka"

### Test 9.4: Pristup Admin Panela Bez Prijave
1. Otvorite novi incognito tab
2. Idite direktno na: `/admin/dashboard`
3. **Očekivano:**
   - ✅ Automatski preusmeren na `/admin` login stranicu

---

## 10. 📱 Testiranje na Mobilnom

### Test 10.1: Responsive Design
1. Otvorite sajt na mobilnom uređaju ili koristite Chrome DevTools
2. Testirajte sve stranice:
   - Početna
   - Cenovnik
   - Upload
   - Admin
3. **Očekivano:**
   - ✅ Sve stranice su responsive
   - ✅ Menu se prilagođava
   - ✅ Fotografije se prikazuju ispravno
   - ✅ Forme su upotrebljive

---

## ✅ Finalna Checklista

- [ ] Početna stranica se učitava ispravno
- [ ] Cenovnik prikazuje sve formate i cene
- [ ] Upload fotografija radi
- [ ] Mogu promeniti format/količinu/završetak
- [ ] Mogu ukloniti fotografije
- [ ] Forma validacija radi
- [ ] Porudžbina se uspešno šalje
- [ ] Admin login radi
- [ ] Admin dashboard prikazuje porudžbine
- [ ] Mogu preuzeti ZIP fajlove
- [ ] Mogu promeniti status porudžbina
- [ ] Email notifikacije stižu
- [ ] ZIP fajl sadrži sve fotografije
- [ ] order_details.txt je ispravan
- [ ] MongoDB čuva porudžbine
- [ ] Sajt je responsive na mobilnom

---

## 🆘 Ako Nešto Ne Radi

### 1. Provera Logova

**Backend:**
```bash
tail -f /var/log/supervisor/backend.err.log
```

**Frontend:**
```bash
tail -f /var/log/supervisor/frontend.err.log
```

**Browser Console:**
- Otvorite Developer Tools (F12)
- Idite na "Console" tab
- Tražite crvene greške

### 2. Provera Servisa
```bash
sudo supervisorctl status
```

**Očekivano:**
```
backend    RUNNING
frontend   RUNNING
```

### 3. Restart Servisa
```bash
sudo supervisorctl restart all
```

---

## 🎉 Uspešno!

Ako su svi testovi prošli, vaš sajt je potpuno funkcionalan i spreman za korišćenje!