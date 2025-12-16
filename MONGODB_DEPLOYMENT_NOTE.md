# 📝 MongoDB na Live Serveru - Važna Napomena

## Trenutna Situacija

✅ **MongoDB je instaliran i radi na live serveru**  
⚠️ **Baza je prazna** (podaci prethodno downlodovani/skinuti)

---

## Opcije za Deployment

### Opcija A: Počni sa Praznom Bazom (Preporučeno za Fresh Start) 🆕

**Prednosti:**
- Nema starih test podataka
- Čiste porudžbine od nule
- Lakše praćenje novih porudžbina

**Šta će se desiti:**
- MongoDB će automatski kreirati kolekcije kada budu potrebne
- `products` kolekcija: Možda već postoji (proveri)
- `orders` kolekcija: Kreira se pri prvoj porudžbini
- `promo_banner` kolekcija: Kreira se pri prvom upload-u banera
- `promotions` kolekcija: Kreira se automatski
- `settings` kolekcija: Kreira se automatski

**Koraci:**
1. Deployment bez restore-a
2. Testiranje sa novim podacima
3. Kreni sa živim porudžbinama

✅ **Jednostavno - samo prati LIVE_DEPLOYMENT_STEPBYSTEP.md i preskoči Checkpoint 11A**

---

### Opcija B: Vrati Podatke sa Preview/Dev Okruženja 🔄

**Prednosti:**
- Možeš testirati sa stvarnim podacima iz dev-a
- Imaš test porudžbine za verifikaciju
- Proizvodi već postoje

**Mane:**
- Test podaci će biti vidljivi korisnicima (osim ako ih ne očistiš)
- Može biti konfuzno ako ima test imena/emailova

**Koraci:**
1. Napravi MongoDB backup sa preview/dev servera
2. Prenesi na live server
3. Restore podatke (Checkpoint 11A u dokumentaciji)
4. Očisti test porudžbine (opciono)

**Kako Očistiti Test Podatke:**
```bash
# Na live serveru, nakon restore-a
mongosh photo_print_app

# Obriši test porudžbine (opciono)
db.orders.deleteMany({ "contactInfo.email": { $regex: /test|demo/i } })

# Obriši promo baner ako je test
db.promo_banner.deleteMany({})

# Proveri šta ostaje
db.orders.countDocuments()
db.products.countDocuments()
```

---

## Preporuka 💡

**Za live deployment, preporučujem Opciju A (prazna baza):**
- Jednostavnije
- Nema test podataka
- Fresh start
- MongoDB automatski kreira šta treba

**Opciju B koristi samo ako:**
- Želiš da testiraš sa stvarnim podacima
- Imaš važne proizvode koji već postoje u bazi
- Razumeš rizik da test podaci mogu biti vidljivi

---

## Provera MongoDB Statusa na Live Serveru

```bash
# 1. Proveri da li MongoDB radi
sudo systemctl status mongodb
# ILI
sudo systemctl status mongod

# 2. Konektuj se na bazu
mongosh photo_print_app

# 3. Proveri postojeće kolekcije
show collections

# 4. Proveri broj dokumenata
db.products.countDocuments()
db.orders.countDocuments()

# 5. Exit
exit
```

---

## Konfiguracija MongoDB Connection-a

**Backend .env mora imati:**
```env
MONGO_URL=mongodb://localhost:27017/photo_print_app
DB_NAME=photo_print_app
```

**Provera Connection-a:**
```bash
# Після deployment-a
curl http://localhost:8001/api/health
# Trebalo bi da vidiš status: "healthy"
```

---

## Automatsko Kreiranje Kolekcija

MongoDB će automatski kreirati kolekcije pri prvoj upotrebi:

### 1. products Kolekcija
- Kreira se pri prvom dodavanju proizvoda u admin panelu
- ILI može već postojati ako je restore-ovana

### 2. orders Kolekcija
- Kreira se pri prvoj porudžbini korisnika
- Svaka porudžbina dodaje dokument

### 3. promo_banner Kolekcija
- Kreira se pri prvom upload-u banera u admin panelu
- Čuva samo jedan dokument (current banner)

### 4. promotions Kolekcija
- Kreira se automatski pri prvom učitavanju
- Čuva postavke za popuste

### 5. settings Kolekcija
- Kreira se automatski
- Čuva globalne postavke (delivery, free shipping limit, itd.)

---

## Troubleshooting

### Problem: "Connection refused" ili MongoDB ne radi

```bash
# Start MongoDB
sudo systemctl start mongodb
# ILI
sudo systemctl start mongod

# Enable da se pokreće automatski
sudo systemctl enable mongodb
```

### Problem: Nema podataka nakon deployment-a

**Ovo je normalno ako:**
- Nisi radio restore (Opcija A)
- MongoDB je prazan

**Rešenje:**
1. Kreiraj prvu porudžbinu test-om
2. Upload proizvode u admin panelu (ako ne postoje)
3. Proveri da sve radi

### Problem: "Database authentication failed"

**Rešenje:**
- Proveri da li MongoDB zahteva autentifikaciju
- Ako da, dodaj credentials u MONGO_URL:
  ```env
  MONGO_URL=mongodb://username:password@localhost:27017/photo_print_app
  ```

---

## Datum Kreiranja
Decembar 2025

## Povezani Dokumenti
- `/app/LIVE_DEPLOYMENT_STEPBYSTEP.md` - Kompletan deployment vodič
- `/app/SECURITY_AUDIT.md` - Sigurnosne provere
