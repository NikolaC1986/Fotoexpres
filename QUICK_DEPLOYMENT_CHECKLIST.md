# ⚡ Quick Deployment Checklist - December 2025

## 📋 Pre-Deployment (5 min)

```bash
# 1. Backup MongoDB
mongodump --db test_database --out ~/backups/mongo_$(date +%Y%m%d)

# 2. Backup Code
cd /home/user/fotoexpres
tar -czf ~/backups/code_$(date +%Y%m%d).tar.gz .

# 3. Backup .env fajlovi
cp backend/.env ~/backups/backend_env
cp frontend/.env ~/backups/frontend_env
```

---

## 🔄 Deployment (15 min)

### 1. Pull Kod
```bash
cd /home/user/fotoexpres
git pull origin main
```

### 2. Update Database
```bash
mongosh test_database << 'EOF'
// Dodaj nova polja
db.products.updateMany({}, { 
  $set: { 
    isFeatured: false, 
    isExternalProduct: false, 
    externalLink: '', 
    requiresPhotoUpload: false 
  } 
});

// Postavi requiresPhotoUpload za non-album proizvode
db.products.updateMany(
  { type: { $ne: 'album' } },
  { $set: { requiresPhotoUpload: true } }
);

// Update promocije
db.promotions.updateOne(
  { _id: 'active_promotion' },
  { $set: { 'promotion.customDisplayText': '', 'promotion.applyDiscount': true } }
);

exit
EOF
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 4. Frontend Build
```bash
cd frontend
yarn install
yarn build
```

### 5. Restart Services
```bash
sudo supervisorctl restart backend frontend
```

---

## ✅ Verifikacija (5 min)

### Quick Tests
```bash
# 1. API Health
curl https://your-domain.com/api/settings | jq

# 2. Products endpoint
curl https://your-domain.com/api/products | jq

# 3. Check logs
sudo tail -n 50 /var/log/supervisor/backend.err.log
sudo tail -n 50 /var/log/supervisor/frontend.err.log
```

### Manual Tests
- [ ] Login u admin panel
- [ ] Otvori proizvod edit modal (proveri nove checkboxe)
- [ ] Dodaj novu varijantu proizvodu
- [ ] Test upload stranicu (dodaj fotografije)
- [ ] Kreiraj test porudžbinu (proveri success modal)
- [ ] Proveri da li se promocija prikazuje

---

## 🚨 Rollback (2 min)

Ako nešto ne radi:

```bash
# 1. Vrati kod
cd /home/user/fotoexpres
git reset --hard HEAD~1

# 2. Restore database
mongorestore --db test_database --drop ~/backups/mongo_YYYYMMDD/test_database

# 3. Restart
sudo supervisorctl restart backend frontend
```

---

## 📊 Post-Deployment

```bash
# Monitor logs (15 min)
sudo tail -f /var/log/supervisor/backend.err.log

# Check sistem resources
free -h
df -h
```

---

## ✅ Success Criteria

- [ ] Backend running (no errors in logs)
- [ ] Frontend accessible
- [ ] Admin panel functional
- [ ] Test order successful
- [ ] Success modal appears
- [ ] No critical errors in logs

---

**Total Time:** ~25 minuta  
**Best Time:** Subota 08:00-10:00 ili Nedelja  
**Avoid:** Radni dani 12-14h i 18-20h

---

## 🆘 Emergency Contacts

**Greška?**
1. Check logs: `/var/log/supervisor/`
2. Rollback if critical
3. Contact support with:
   - Error message
   - Log excerpt
   - Steps taken

**Deployment Ready!** 🚀
