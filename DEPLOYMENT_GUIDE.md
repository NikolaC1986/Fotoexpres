# 🚀 Fotoexpres - Vodič za Postavljanje Sajta Online

## 📋 Pregled

Ovaj vodič vam pokazuje kako da postavite Fotoexpres sajt online korak po korak, sa detaljima o svakom servisu, cenama i procesom registracije.

---

## 1️⃣ Priprema Pre Postavljanja

### Šta vam je potrebno:
- ✅ Kod aplikacije (imate ga)
- ✅ Domen (npr. www.fotoexpres.rs)
- ✅ Email adresa za slanje notifikacija
- ✅ Hosting servis
- ✅ MongoDB baza podataka

---

## 2️⃣ Registracija Domena

### Opcija 1: RS domen (.rs, .co.rs)
**Preporučeno za srpsko tržište**

**Gde registrovati:**
- **RNIDS** (Registar nacionalnih internet domena Srbije)
  - Website: https://www.rnids.rs
  - Cena: ~1,500 RSD/godišnje za .rs
  - Cena: ~1,000 RSD/godišnje za .co.rs

**Korak po korak:**
1. Idite na RNIDS website
2. Proverite dostupnost domena (npr. fotoexpres.rs)
3. Izaberite registara (npr. HOSTNS, WebHosting)
4. Popunite podatke i izvršite uplatu
5. Čekajte 1-3 dana na odobrenje

### Opcija 2: Internacionalni domeni (.com, .net)

**Namecheap** (Preporučeno)
- Website: https://www.namecheap.com
- Cena: ~$10-15/godišnje za .com
- Uključuje besplatnu WHOIS zaštitu

**Korak po korak:**
1. Napravite nalog na Namecheap
2. Pretražite željeni domen
3. Dodajte u korpu i platite kreditnom karticom
4. Aktivacija odmah

---

## 3️⃣ Hosting za Aplikaciju

### Opcija 1: Vercel (Preporučeno za početak)
**Najbolje za React + FastAPI aplikacije**

**Cene:**
- ✅ **Hobby Plan**: $0/mesečno (Besplatno)
  - 100GB bandwidth
  - Dovoljno za 1,000-5,000 poseta mesečno
  - HTTPS automatski
  - Custom domen besplatno
- **Pro Plan**: $20/mesečno
  - 1TB bandwidth
  - Bolja podrška
  - Za ozbiljniji biznis

**Korak po korak registracija:**

1. **Kreirajte GitHub Repository**
   - Idite na https://github.com
   - Napravite besplatan nalog
   - Kliknite "New repository"
   - Ime: `fotoexpres`
   - Public ili Private (preporučeno Private)

2. **Upload koda na GitHub**
   ```bash
   # U terminalu vaše aplikacije
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VASE_IME/fotoexpres.git
   git push -u origin main
   ```

3. **Registracija na Vercel**
   - Idite na https://vercel.com
   - Kliknite "Sign Up"
   - Izaberite "Continue with GitHub"
   - Odobrite pristup Vercel-u

4. **Deploy aplikacije**
   - Kliknite "New Project"
   - Izaberite `fotoexpres` repository
   - Konfigurišite:
     - **Framework Preset**: Other
     - **Root Directory**: ./
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Output Directory**: `frontend/build`

5. **Podesi Environment Variables**
   - U Vercel dashboardu, idite na Project Settings
   - "Environment Variables"
   - Dodajte:
     ```
     MONGO_URL=mongodb+srv://...
     DB_NAME=fotoexpres
     JWT_SECRET_KEY=GENERISI_RANDOM_STRING_OVDE
     ADMIN_USERNAME=Vlasnik
     ADMIN_PASSWORD=Fotoexpres2025!
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=vas.email@gmail.com
     EMAIL_PASSWORD=aplikacijska_lozinka
     REACT_APP_BACKEND_URL=https://vasa-aplikacija.vercel.app
     ```
     
   **VAŽNO ZA SIGURNOST:**
   - Promenite `ADMIN_PASSWORD` na jaku lozinku za production!
   - Možete promeniti i `ADMIN_USERNAME` ako želite
   - Generišite random string za `JWT_SECRET_KEY` (minimum 32 karaktera)

6. **Deploy**
   - Kliknite "Deploy"
   - Čekajte 2-5 minuta
   - Dobijate URL: `https://fotoexpres.vercel.app`

7. **Povežite Custom Domen**
   - U Vercel Settings > Domains
   - Dodajte vaš domen (npr. www.fotoexpres.rs)
   - Kopirajte DNS zapise
   - Idite na vašeg registara domena
   - Dodajte A record i CNAME record kako Vercel kaže
   - Čekajte 1-24h za DNS propagaciju

### Opcija 2: DigitalOcean (Za više kontrole)
**Najbolje ako želite potpunu kontrolu**

**Cene:**
- **Basic Droplet**: $6/mesečno
  - 1GB RAM, 1 CPU
  - 25GB SSD
  - 1TB bandwidth
- **Recommended**: $12/mesečno
  - 2GB RAM, 1 CPU
  - 50GB SSD
  - 2TB bandwidth

**Korak po korak:**
1. Napravite nalog na https://www.digitalocean.com
2. Create Droplet > Ubuntu 22.04
3. Izaberite plan ($6 ili $12)
4. Kreirajte SSH ključ
5. Deploy aplikacije sa Docker-om
6. Konfigurišite Nginx reverse proxy
7. Setup SSL sa Let's Encrypt (besplatno)

### Opcija 3: Lokalni Hosting (Srbija)

**WebHosting.rs**
- Website: https://www.webhosting.rs
- **VPS Starter**: 1,500 RSD/mesečno
  - 1GB RAM
  - 20GB SSD
  - Podrška na srpskom

**Host.rs**
- Website: https://www.host.rs
- **Cloud VPS**: 2,000 RSD/mesečno
  - 2GB RAM
  - 40GB SSD

---

## 4️⃣ MongoDB Baza Podataka

### MongoDB Atlas (Preporučeno)
**Cloud-hosted MongoDB baza**

**Cene:**
- ✅ **M0 Free Tier**: $0/mesečno
  - 512MB storage
  - Shared RAM
  - Dovoljno za 5,000-10,000 porudžbina
  - Besplatno zauvek!
- **M10 Dedicated**: $0.08/sat (~$57/mesečno)
  - 10GB storage
  - 2GB RAM
  - Za ozbiljniji biznis

**Korak po korak registracija:**

1. **Napravite nalog**
   - Idite na https://www.mongodb.com/cloud/atlas
   - Kliknite "Try Free"
   - Unesite email, lozinku, ime
   - Verifikujte email

2. **Kreirajte novi Cluster**
   - Izaberite "Shared" (besplatno)
   - Provider: **AWS**
   - Region: **Frankfurt (eu-central-1)** ili **Ireland (eu-west-1)** (Najbliže Srbiji)
   - Cluster Tier: **M0 Sandbox (FREE)**
   - Cluster Name: `fotoexpres-cluster`
   - Kliknite "Create Cluster" (čeka 3-5 minuta)

3. **Kreirajte Database User**
   - Idite na "Database Access"
   - "Add New Database User"
   - Username: `fotoexpres_admin`
   - Password: Generišite jak password (sačuvajte ga!)
   - Database User Privileges: "Atlas admin"
   - "Add User"

4. **Dozvolite pristup sa bilo koje IP adrese**
   - Idite na "Network Access"
   - "Add IP Address"
   - Kliknite "Allow Access from Anywhere"
   - IP Address: `0.0.0.0/0`
   - "Confirm"

5. **Dobijte Connection String**
   - Idite nazad na "Database"
   - Kliknite "Connect" na vašem clusteru
   - "Connect your application"
   - Driver: Python 3.12 or later
   - Kopirajte connection string:
     ```
     mongodb+srv://fotoexpres_admin:<password>@fotoexpres-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Zamenite `<password>` sa pravom lozinkom

6. **Kreirajte Bazu**
   - Kliknite "Browse Collections"
   - "Add My Own Data"
   - Database name: `fotoexpres`
   - Collection name: `orders`
   - "Create"

7. **Dodajte još kolekcije:**
   - `prices`
   - `settings`
   - `discounts`
   - `promotions`

---

## 5️⃣ Email Servis (Za Notifikacije Porudžbina)

### Opcija 1: Gmail SMTP (Najlakše za početak)
**Besplatno do 500 emailova dnevno**

**Cena:** $0 (Besplatno)

**Korak po korak:**

1. **Enable 2-Step Verification**
   - Idite na https://myaccount.google.com/security
   - "2-Step Verification" > Uključite

2. **Kreirajte App Password**
   - Na istoj stranici, scroll do "App passwords"
   - Izaberite "Mail" i "Other (Custom name)"
   - Ime: `Fotoexpres`
   - Kliknite "Generate"
   - **SAČUVAJTE 16-slovni kod** (npr. `abcd efgh ijkl mnop`)

3. **Konfigurišite u aplikaciji**
   - U backend `.env` fajlu:
     ```
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=vas.email@gmail.com
     EMAIL_PASSWORD=abcd efgh ijkl mnop
     ```

**Ograničenja:**
- 500 emailova/dan
- Ne preporučuje se za veliki biznis

### Opcija 2: SendGrid (Profesionalno)
**Najbolje za veći obim emailova**

**Cene:**
- ✅ **Free Plan**: $0/mesečno
  - 100 emailova/dan (3,000/mesečno)
  - Dovoljan za početak
- **Essentials**: $19.95/mesečno
  - 50,000 emailova/mesečno
  - Email validacija

**Korak po korak:**
1. Napravite nalog na https://sendgrid.com
2. Verifikujte email
3. Settings > API Keys > Create API Key
4. Kopirajte ključ i dodajte u `.env`:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

### Opcija 3: Mailgun
**Dobar alternativa SendGrid-u**

**Cene:**
- **Free Trial**: $0
  - 5,000 emailova prvog meseca
- **Foundation**: $35/mesečno
  - 50,000 emailova

---

## 6️⃣ File Storage (Za Fotografije i ZIP Fajlove)

### Opcija 1: Lokalni Storage (Trenutno)
**Već implementirano - fajlovi se čuvaju na serveru**

**Prednosti:**
- Besplatno
- Brzo
- Jednostavno

**Nedostaci:**
- Ograničeno prostorom na serveru
- Gubite fajlove ako se server restartuje (Vercel)

### Opcija 2: AWS S3 (Preporučeno za production)
**Najbolje za čuvanje slika i ZIP-ova**

**Cene:**
- **S3 Storage**: $0.023/GB/mesečno
  - Primer: 100GB = $2.30/mesečno
- **S3 Transfer**: $0.09/GB
  - Primer: 100GB download = $9/mesečno
- **Ukupno za ~1,000 porudžbina mesečno**: $5-10/mesečno

**Korak po korak:**
1. Napravite AWS nalog na https://aws.amazon.com
2. Idite na S3 Console
3. "Create bucket"
4. Ime: `fotoexpres-storage`
5. Region: `eu-central-1` (Frankfurt)
6. Block all public access: OFF (da bi korisnici mogli da preuzmu ZIP)
7. Kreirajte IAM User sa S3 pristupom
8. Dobijte Access Key ID i Secret Access Key
9. Integrirajte u backend kod

### Opcija 3: Cloudinary (Lakše za slike)
**Specijalizovano za slike**

**Cene:**
- **Free Plan**: $0/mesečno
  - 25GB storage
  - 25GB bandwidth
  - Dovoljno za početak

---

## 7️⃣ SSL Sertifikat (HTTPS)

### Automatski na Vercel
✅ Vercel automatski daje besplatan SSL sertifikat (Let's Encrypt)
- Ništa ne trebate da radite
- Automatski renewal

### Za DigitalOcean/VPS
**Let's Encrypt (Besplatno)**

```bash
# Instalacija Certbot
sudo apt install certbot python3-certbot-nginx

# Dobijanje sertifikata
sudo certbot --nginx -d fotoexpres.rs -d www.fotoexpres.rs

# Automatski renewal
sudo certbot renew --dry-run
```

---

## 8️⃣ Ukupna Cena - Mesečni Pregled

### Scenario 1: Minimum (Za početak)
| Servis | Cena |
|--------|------|
| Domen (.rs) | ~125 RSD/mesečno (1,500/god) |
| Hosting (Vercel Free) | 0 RSD |
| MongoDB (Atlas Free) | 0 RSD |
| Email (Gmail) | 0 RSD |
| SSL | 0 RSD (Automatski) |
| **UKUPNO** | **~125 RSD/mesečno** |

### Scenario 2: Optimalno (Za ozbiljan biznis)
| Servis | Cena |
|--------|------|
| Domen (.rs) | ~125 RSD/mesečno |
| Hosting (Vercel Pro) | ~2,400 RSD/mesečno ($20) |
| MongoDB (M10) | ~6,900 RSD/mesečno ($57) |
| Email (SendGrid) | ~2,400 RSD/mesečno ($19.95) |
| AWS S3 Storage | ~600 RSD/mesečno ($5) |
| SSL | 0 RSD (Automatski) |
| **UKUPNO** | **~12,425 RSD/mesečno** |

### Scenario 3: Budget-Friendly (Lokalno)
| Servis | Cena |
|--------|------|
| Domen (.rs) | 125 RSD/mesečno |
| VPS (WebHosting.rs) | 1,500 RSD/mesečno |
| MongoDB (Atlas Free) | 0 RSD |
| Email (Gmail) | 0 RSD |
| SSL | 0 RSD (Let's Encrypt) |
| **UKUPNO** | **~1,625 RSD/mesečno** |

---

## 9️⃣ Deployment Checklist

### Pre Postavljanja Online
- [ ] Testirajte sve funkcionalnosti lokalno
- [ ] Proverite da sve stranice rade
- [ ] Testirajte upload fotografija
- [ ] Testirajte admin panel
- [ ] Proverite email notifikacije
- [ ] Uverite se da su cene tačne

### Tokom Postavljanja
- [ ] Registrujte domen
- [ ] Napravite MongoDB Atlas nalog i cluster
- [ ] Kreirajte bazu i kolekcije
- [ ] Setup email (Gmail App Password ili SendGrid)
- [ ] Deploy na Vercel ili VPS
- [ ] Konfigurišite environment variables
- [ ] Povežite custom domen
- [ ] Testirajte deployment

### Posle Postavljanja
- [ ] Testirajte ceo flow porudžbine
- [ ] Proverite admin login
- [ ] Testirajte email notifikacije
- [ ] Proverite mobilnu verziju
- [ ] Setup Google Analytics (opciono)
- [ ] Setup Google Search Console za SEO
- [ ] Napravite backup baze (export)

---

## 🔟 Održavanje i Monitoring

### Daily Tasks (Dnevno)
- Proverite nove porudžbine u admin panelu
- Preuzmite ZIP fajlove porudžbina
- Odgovorite na klijente

### Weekly Tasks (Nedeljno)
- Backup MongoDB baze
- Proverite da email notifikacije rade
- Proverite disk space (za ZIP fajlove)

### Monthly Tasks (Mesečno)
- Proverite statistiku porudžbina
- Ažurirajte cene ako je potrebno
- Pregledajte troškove hosting-a

---

## 🆘 Troubleshooting

### Problem: Sajt ne radi posle deploya
**Rešenje:**
1. Proverite Vercel logs (Dashboard > Project > Logs)
2. Uverite se da su svi environment variables postavljeni
3. Proverite da MongoDB connection string radi

### Problem: Email notifikacije ne stižu
**Rešenje:**
1. Proverite Gmail App Password
2. Proverite SPAM folder
3. Testirajte sa drugim email provajderom

### Problem: Fotografije ne uploaduju
**Rešenje:**
1. Proverite file size limit na serveru
2. Uverite se da ima dovoljno disk space
3. Proverite backend logs za greške

### Problem: Admin panel ne radi
**Rešenje:**
1. Očistite browser cache
2. Proverite kredencijale (Vlasnik / Fotoexpres2025!)
3. Proverite backend connection

---

## 📞 Podrška

Ako imate problema sa postavljanjem sajta, možete:

1. **Dokumentacija:** Pročitajte `FUNKCIONALNOSTI_DOKUMENTACIJA.md`
2. **Kod:** Pregledajte značajne delove koda
3. **Zajednica:** Potražite pomoć na Stack Overflow
4. **Servisi:** Kontaktirajte podršku hosting provajdera

---

## ✅ Sledeći Koraci

1. Izaberite hosting opciju (preporučujem Vercel za početak)
2. Registrujte domen
3. Setup MongoDB Atlas (besplatno)
4. Pratite korak po korak uputstva
5. Testirajte sve pre puštanja u production
6. Promovisanje sajta (marketing, social media)

**Srećno sa Fotoexpres sajtom! 🚀📸**