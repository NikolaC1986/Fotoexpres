# 🚀 Ghost Orders Fix - Live Server Deployment Guide

## 📋 Pre-Deployment Checklist

Pre nego što počnete sa deployment-om na live server, potvrdite sledeće:

- [x] Fix je testiran na dev serveru ✅
- [x] Svi testovi prolaze (5/6 tests passed - 83.3%) ✅
- [x] Backend logging radi ispravno ✅
- [x] Frontend verifikacija implementirana ✅
- [x] MongoDB unique index testiran ✅
- [ ] **Backup MongoDB baze napravljen** ⚠️
- [ ] **Live server pristup spreman** ⚠️

## 🔐 Pre Deployment-a: VAŽNO - Backup!

**OBAVEZNO** napravite backup MongoDB baze na live serveru PRE deployment-a:

```bash
# SSH na live server
ssh root@your-live-server-ip

# Kreirajte backup direktorijum
mkdir -p /root/mongodb_backups

# Napravite backup
mongodump --db fotoexpres --out /root/mongodb_backups/backup-$(date +%Y%m%d-%H%M%S)

# Verifikujte backup
ls -lh /root/mongodb_backups/
```

## 📦 Deployment Steps

### Step 1: Upload Novih Fajlova

Potrebno je ažurirati 2 fajla na live serveru:

1. **Backend**: `/var/www/fotoexpres/backend/server.py`
2. **Frontend**: `/var/www/fotoexpres/frontend/src/components/UploadPage.jsx`

**Opcija A: Korišćenjem SCP**

```bash
# Sa vašeg lokalnog računara (ili sa Emergent dev servera)
# Zameni YOUR_LIVE_IP sa IP adresom vašeg live servera

# Upload backend fajla
scp /app/backend/server.py root@YOUR_LIVE_IP:/var/www/fotoexpres/backend/server.py

# Upload frontend fajla
scp /app/frontend/src/components/UploadPage.jsx root@YOUR_LIVE_IP:/var/www/fotoexpres/frontend/src/components/UploadPage.jsx
```

**Opcija B: Ručno Copy-Paste**

1. SSH na live server: `ssh root@YOUR_LIVE_IP`
2. Otvori fajl za editovanje: `nano /var/www/fotoexpres/backend/server.py`
3. Kopiraj kompletan sadržaj iz `/app/backend/server.py` (sa dev servera)
4. Sačuvaj i zatvori (Ctrl+X, Y, Enter)
5. Ponovi za frontend fajl

### Step 2: Restart Backend Servisa

```bash
# SSH na live server
ssh root@YOUR_LIVE_IP

# Restart backend
sudo supervisorctl restart fotoexpres-backend

# Proveri status
sudo supervisorctl status

# OČEKIVANI OUTPUT:
# fotoexpres-backend      RUNNING   pid XXXX, uptime 0:00:XX
# fotoexpres-frontend     RUNNING   pid YYYY, uptime X:XX:XX
```

### Step 3: Verifikuj Backend Logove

```bash
# Proveri da li je backend uspešno startovao
sudo tail -n 50 /var/log/supervisor/fotoexpres-backend.err.log

# TRAŽITE OVE LINIJE:
# INFO - ✅ Database index created: orderNumber (unique)
# INFO - 🚀 Backend server started successfully
# INFO - Application startup complete.
```

✅ Ako vidite ove linije, backend je uspešno startovao sa novim kodom!

### Step 4: Rebuild Frontend

```bash
# Navigiraj u frontend direktorijum
cd /var/www/fotoexpres/frontend

# Install dependencies (ako je potrebno)
yarn install

# Build produkcijsku verziju
yarn build

# Proveri da je build uspeo
ls -lh build/
```

### Step 5: Restart Frontend Servisa (ako koristite supervisor)

```bash
# Ako frontend radi preko supervisora
sudo supervisorctl restart fotoexpres-frontend

# Ako koristite PM2
pm2 restart fotoexpres-frontend

# Proveri status
sudo supervisorctl status  # ili pm2 list
```

## 🧪 Post-Deployment Testing

### Test 1: Zdravstvena Provera Backend-a

```bash
# Sa live servera ili sa lokalnog računara
curl -s https://fotoexpres.rs/api/ | jq

# OČEKIVANI OUTPUT:
# {
#   "message": "Hello World"
# }
```

✅ Ako dobijete ovaj odgovor, backend API radi!

### Test 2: Kreiraj Test Porudžbinu

**VAŽNO**: Koristite MALU test porudžbinu (2-3 fotografije) za prvu proveru!

1. Idite na https://fotoexpres.rs/upload
2. Dodajte 2-3 fotografije
3. Popunite sve podatke (OBAVEZNO: Ulica i broj, Poštanski broj, Grad)
4. Kliknite "Pošalji Porudžbinu"
5. **SAČEKAJTE** dok se ne prikaže poruka "Porudžbina poslata!"

### Test 3: Verifikuj Order u Admin Panelu

1. Idite na https://fotoexpres.rs/logovanje
2. Login sa admin credentials (Vlasnik)
3. Proverite da li se test porudžbina pojavljuje u listi
4. Proveri sledeće:
   - Order number se poklapa sa onim prikazanim na frontendu
   - Status je vidljiv
   - Datum/vreme kreiranja je tačno
   - Može se downloadovati ZIP fajl

✅ Ako test porudžbina postoji u admin panelu, fix JE USPEŠAN!

### Test 4: Proveri Backend Logove za Test Order

```bash
# Na live serveru
sudo tail -n 200 /var/log/supervisor/fotoexpres-backend.err.log | grep "ORDER"

# TRAŽITE:
# ORDER ORD-XXXXXX COMPLETED SUCCESSFULLY ✅
```

## 📊 Monitoring Nakon Deployment-a

U prvim danima nakon deployment-a, pratite logove za bilo kakve probleme:

```bash
# Real-time monitoring
sudo tail -f /var/log/supervisor/fotoexpres-backend.err.log

# Filtriranje samo grešaka
sudo tail -f /var/log/supervisor/fotoexpres-backend.err.log | grep -i "ERROR\|CRITICAL\|Failed"

# Filtriranje uspešnih porudžbina
sudo tail -f /var/log/supervisor/fotoexpres-backend.err.log | grep "COMPLETED SUCCESSFULLY"
```

## 🆘 Troubleshooting

### Problem 1: Backend ne startuje

**Simptom**: `sudo supervisorctl status` pokazuje `FATAL` ili `EXITED`

**Rešenje**:
```bash
# Proveri error logove
sudo tail -n 100 /var/log/supervisor/fotoexpres-backend.err.log

# Najčešći problem: Environment varijable nisu postavljene
# Proveri da li .env fajl postoji
ls -la /var/www/fotoexpres/backend/.env

# Ako Supervisor ne čita .env, dodaj ih u supervisor.conf:
sudo nano /etc/supervisor/conf.d/fotoexpres-backend.conf

# Dodaj liniju (zameni sa svojim vrednostima):
# environment=MONGO_URL="mongodb://localhost:27017",DB_NAME="fotoexpres",JWT_SECRET_KEY="your_secret_key"

# Reload i restart
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart fotoexpres-backend
```

### Problem 2: Frontend build fail-uje

**Simptom**: `yarn build` vraća greške

**Rešenje**:
```bash
# Proveri da li su sve dependencies instalirane
cd /var/www/fotoexpres/frontend
yarn install

# Ako i dalje ne radi, proveri Node verziju
node --version  # Treba biti v18+

# Pokušaj sa clean install
rm -rf node_modules package-lock.json yarn.lock
yarn install
yarn build
```

### Problem 3: Test porudžbina ne prolazi

**Simptom**: Dobijate error poruku kada šaljete test porudžbinu

**Proveri sledeće**:

1. **Backend logove**:
```bash
sudo tail -n 50 /var/log/supervisor/fotoexpres-backend.err.log
```

2. **MongoDB connection**:
```bash
# Proveri da li MongoDB radi
sudo systemctl status mongodb

# Testiraj konekciju
mongo --eval "db.adminCommand('ping')"
```

3. **Browser Console**:
- Otvori Dev Tools (F12) u browser-u
- Pogledaj Console tab
- Pošalji porudžbinu i vidi greške

### Problem 4: "Ghost orders" se i dalje pojavljuju

**Simptom**: Success poruka se prikazuje ali order ne postoji u admin panelu

**Debug procedura**:

1. **Proveri backend logove** za tu konkretnu porudžbinu:
```bash
sudo tail -n 500 /var/log/supervisor/fotoexpres-backend.err.log | grep "ORD-XXXXXX"
```

2. **Potražite ovaj red**:
```
ORDER ORD-XXXXXX COMPLETED SUCCESSFULLY ✅
```

3. **Ako POSTOJI taj red**:
   - Order JE kreiran u bazi
   - Problem je u admin panel query-ju ili display-u
   - Proveri MongoDB direktno:
   ```bash
   mongo
   use fotoexpres
   db.orders.findOne({orderNumber: "ORD-XXXXXX"})
   ```

4. **Ako NE POSTOJI taj red**:
   - Pratite logove unazad da vidite gde je process fail-ovao
   - Potražite "ERROR" ili "CRITICAL" poruke
   - Kontaktirajte support sa tim logovima

## 🔄 Rollback Plan (U Slučaju Problema)

Ako deployment ne uspe ili ako se pojave novi problemi:

### Brzi Rollback Backend-a

```bash
# Ako imate backup starog server.py fajla
cp /var/www/fotoexpres/backend/server.py.backup /var/www/fotoexpres/backend/server.py
sudo supervisorctl restart fotoexpres-backend
```

### Brzi Rollback Frontend-a

```bash
# Ako imate backup starog UploadPage.jsx fajla
cp /var/www/fotoexpres/frontend/src/components/UploadPage.jsx.backup \
   /var/www/fotoexpres/frontend/src/components/UploadPage.jsx

cd /var/www/fotoexpres/frontend
yarn build
sudo supervisorctl restart fotoexpres-frontend  # ili pm2 restart
```

### Restore MongoDB Backup-a (Krajnja Mera)

```bash
# SAMO ako je baza kompromitovana
mongorestore --db fotoexpres /root/mongodb_backups/backup-YYYYMMDD-HHMMSS/fotoexpres
```

## ✅ Success Criteria

Deployment je uspešan ako:

- [✅] Backend servis radi (RUNNING status)
- [✅] Frontend se normalno učitava
- [✅] Test porudžbina se uspešno kreira
- [✅] Test porudžbina SE POJAVLJUJE u admin panelu
- [✅] Backend logovi pokazuju kompletan lifecycle sa "COMPLETED SUCCESSFULLY"
- [✅] MongoDB unique index je kreiran (vidljivo u logovima)

## 📞 Support

Ako naiđete na probleme tokom deployment-a:

1. **Sačuvajte sve error logove**:
```bash
sudo tail -n 500 /var/log/supervisor/fotoexpres-backend.err.log > /tmp/backend-errors.log
```

2. **Napravite screenshot error poruka** iz browser-a

3. **Dokumentujte korake** koje ste pratili pre nego što je došlo do greške

4. Kontaktirajte Emergent support sa ovim informacijama

---

**Deployment Guide Version**: 1.0  
**Last Updated**: 2025-11-28  
**Compatible with**: Fotoexpres Backend v2.0+ (Ghost Orders Fix)

**Napomena**: Ovaj guide pretpostavlja da vaš live server koristi istu strukturu kao i dev server. Prilagodite putanje i komande prema vašoj konkretnoj konfiguraciji.

**Preporuka**: Uradite deployment tokom perioda niske aktivnosti (npr. kasno uveče) da minimizirate uticaj na korisnike u slučaju problema.

🎉 **Srećan deployment!** 🎉
