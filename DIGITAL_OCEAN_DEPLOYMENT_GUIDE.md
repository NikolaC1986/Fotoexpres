# 🚀 Fotoexpres - Digital Ocean Deployment Guide
## Комплетан водич за постављање live верзије

---

## 📋 Преглед

Овај водич ће вас провести кроз све кораке потребне за постављање Fotoexpres апликације на ваш Digital Ocean droplet.

**Предуслови:**
- ✅ Digital Ocean droplet ($16/мес) - Ubuntu 22.04 или 24.04
- ✅ MongoDB Atlas налог (бесплатан tier)
- ✅ Домен (опционо, али препоручено)
- ✅ SSH приступ droplet-у

**Време потребно:** ~30-45 минута

---

## ФАЗА 1: Преузимање Кода

### Корак 1.1: Преузмите код из Emergent платформе

1. У Emergent интерфејсу, пронађите опцију **"Save to GitHub"** или **"Download Code"**
2. Ако користите GitHub:
   - Повежите ваш GitHub налог
   - Креирајте нови репозиторијум (нпр. `fotoexpres`)
   - Сачувајте код

3. Ако преузимате директно:
   - Преузмите ZIP архиву
   - Распакујте на вашем рачунару

---

## ФАЗА 2: Припрема MongoDB Atlas

### Корак 2.1: Креирајте MongoDB Atlas кластер (ако немате)

1. Идите на https://www.mongodb.com/atlas
2. Креирајте бесплатан налог или се пријавите
3. Креирајте нови кластер:
   - Изаберите **"FREE" Shared** опцију
   - Изаберите регион близу ваших корисника (Europe - Frankfurt препоручено)
   - Кликните **"Create Cluster"**

### Корак 2.2: Подесите приступ бази

1. У левом менију кликните **"Database Access"**
2. Кликните **"Add New Database User"**
3. Унесите:
   - Username: `fotoexpres_user`
   - Password: Генеришите јаку лозинку (САЧУВАЈТЕ ЈЕ!)
   - Database User Privileges: **"Read and write to any database"**
4. Кликните **"Add User"**

### Корак 2.3: Дозволите приступ са вашег сервера

1. У левом менију кликните **"Network Access"**
2. Кликните **"Add IP Address"**
3. Унесите IP адресу вашег Digital Ocean droplet-а
   - Или кликните **"Allow Access from Anywhere"** (мање сигурно али једноставније)
4. Кликните **"Confirm"**

### Корак 2.4: Добијте Connection String

1. Кликните **"Database"** у левом менију
2. Кликните **"Connect"** на вашем кластеру
3. Изаберите **"Connect your application"**
4. Копирајте connection string, изгледа овако:
```
mongodb+srv://fotoexpres_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
5. Замените `<password>` са вашом лозинком
6. **САЧУВАЈТЕ ОВАЈ STRING - ТРЕБАЋЕ ВАМ!**

---

## ФАЗА 3: Припрема Digital Ocean Droplet-а

### Корак 3.1: Повежите се на droplet

Отворите терминал на вашем рачунару и унесите:

```bash
ssh root@VASA_IP_ADRESA
```

Замените `VASA_IP_ADRESA` са IP адресом вашег droplet-а.

### Корак 3.2: Ажурирајте систем

```bash
apt update && apt upgrade -y
```

### Корак 3.3: Инсталирајте Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

Проверите инсталацију:
```bash
node --version
# Треба да покаже v18.x.x
```

### Корак 3.4: Инсталирајте Python 3.11

```bash
apt install -y python3.11 python3.11-venv python3-pip
```

Проверите инсталацију:
```bash
python3.11 --version
# Треба да покаже Python 3.11.x
```

### Корак 3.5: Инсталирајте остале алате

```bash
# Nginx веб сервер
apt install -y nginx

# Yarn пакет менаџер
npm install -g yarn

# PM2 за управљање процесима
npm install -g pm2

# Git (ако није инсталиран)
apt install -y git
```

---

## ФАЗА 4: Постављање Апликације

### Корак 4.1: Креирајте директоријум за апликацију

```bash
mkdir -p /var/www/fotoexpres
cd /var/www/fotoexpres
```

### Корак 4.2: Преузмите код

**Опција А - Ако користите GitHub:**
```bash
git clone https://github.com/VASE_KORISNICKO_IME/fotoexpres.git .
```

**Опција Б - Ако преносите фајлове директно:**

На вашем локалном рачунару (НЕ на серверу):
```bash
scp -r /putanja/do/koda/* root@VASA_IP_ADRESA:/var/www/fotoexpres/
```

### Корак 4.3: Проверите структуру

```bash
ls -la /var/www/fotoexpres/
```

Требало би да видите:
```
backend/
frontend/
... остали фајлови
```

---

## ФАЗА 5: Подешавање Backend-а

### Корак 5.1: Уђите у backend директоријум

```bash
cd /var/www/fotoexpres/backend
```

### Корак 5.2: Креирајте Python виртуелно окружење

```bash
python3.11 -m venv venv
source venv/bin/activate
```

Требало би да видите `(venv)` на почетку линије.

### Корак 5.3: Инсталирајте Python зависности

```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### Корак 5.4: Креирајте .env фајл

```bash
nano .env
```

Унесите следеће (замените вредности својим):

```
MONGO_URL="mongodb+srv://fotoexpres_user:VASA_LOZINKA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
DB_NAME="fotoexpres"
JWT_SECRET="generisi-random-string-od-32-karaktera"
```

**За генерисање JWT_SECRET:**
```bash
openssl rand -hex 32
```

Сачувајте фајл: `Ctrl+X`, затим `Y`, затим `Enter`

### Корак 5.5: Креирајте потребне директоријуме

```bash
mkdir -p uploads/products
mkdir -p uploads/promo_banners
mkdir -p uploads/hero
mkdir -p orders
mkdir -p orders_zips
```

### Корак 5.6: Тестирајте backend локално

```bash
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

Ако видите "Application startup complete" - све је у реду!
Притисните `Ctrl+C` да зауставите.

### Корак 5.7: Покрените backend са PM2

```bash
pm2 start "cd /var/www/fotoexpres/backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001" --name fotoexpres-backend
```

Проверите статус:
```bash
pm2 status
```

Сачувајте PM2 конфигурацију да преживи рестарт:
```bash
pm2 save
pm2 startup
```

---

## ФАЗА 6: Подешавање Frontend-а

### Корак 6.1: Уђите у frontend директоријум

```bash
cd /var/www/fotoexpres/frontend
```

### Корак 6.2: Креирајте .env фајл

```bash
nano .env
```

Унесите (замените са вашим доменом или IP адресом):

**Ако имате домен:**
```
REACT_APP_BACKEND_URL="https://www.vasadomena.com"
```

**Ако користите само IP:**
```
REACT_APP_BACKEND_URL="http://VASA_IP_ADRESA"
```

Сачувајте: `Ctrl+X`, `Y`, `Enter`

### Корак 6.3: Инсталирајте зависности

```bash
yarn install
```

### Корак 6.4: Направите production build

```bash
yarn build
```

Ово може потрајати 2-5 минута. Када заврши, провери:
```bash
ls -la build/
```

Требало би да видите `index.html` и друге фајлове.

---

## ФАЗА 7: Подешавање Nginx-а

### Корак 7.1: Креирајте Nginx конфигурацију

```bash
nano /etc/nginx/sites-available/fotoexpres
```

**Ако имате домен, унесите:**

```nginx
server {
    listen 80;
    server_name vasadomena.com www.vasadomena.com;

    # Frontend - React build
    root /var/www/fotoexpres/frontend/build;
    index index.html;

    # Gzip компресија
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend рутирање
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # За велике фајлове (слике)
        client_max_body_size 100M;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Статички фајлови (слике производа итд.)
    location /api/uploads {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Ако користите само IP адресу:**

```nginx
server {
    listen 80;
    server_name VASA_IP_ADRESA;

    root /var/www/fotoexpres/frontend/build;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100M;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    location /api/uploads {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Сачувајте: `Ctrl+X`, `Y`, `Enter`

### Корак 7.2: Активирајте конфигурацију

```bash
# Уклоните default сајт
rm -f /etc/nginx/sites-enabled/default

# Активирајте fotoexpres
ln -s /etc/nginx/sites-available/fotoexpres /etc/nginx/sites-enabled/

# Тестирајте конфигурацију
nginx -t
```

Ако видите "syntax is ok" и "test is successful":

```bash
systemctl restart nginx
```

### Корак 7.3: Тестирајте сајт

Отворите у браузеру:
- `http://VASA_IP_ADRESA` или
- `http://vasadomena.com`

---

## ФАЗА 8: SSL Сертификат (HTTPS) - ПРЕПОРУЧЕНО

### Корак 8.1: Инсталирајте Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Корак 8.2: Добијте SSL сертификат

**Замените са вашим доменом:**

```bash
certbot --nginx -d vasadomena.com -d www.vasadomena.com
```

Пратите упутства:
1. Унесите email адресу
2. Прихватите услове (A)
3. Одаберите да ли желите да делите email (Y/N)
4. Изаберите опцију 2 за аутоматско преусмеравање HTTP → HTTPS

### Корак 8.3: Аутоматска обнова сертификата

```bash
# Тестирајте аутоматску обнову
certbot renew --dry-run
```

Certbot аутоматски подешава cron job за обнову.

---

## ФАЗА 9: Финална Провера

### Корак 9.1: Проверите да ли све ради

```bash
# Backend статус
pm2 status

# Nginx статус
systemctl status nginx

# Тестирајте API
curl http://localhost:8001/api/health
```

### Корак 9.2: Тестирајте у браузеру

1. Отворите ваш сајт
2. Тестирајте:
   - [ ] Почетна страница се учитава
   - [ ] Страница за upload ради
   - [ ] Admin login ради (`/logovanje`)
   - [ ] Производи се приказују
   - [ ] Креирање поруџбине ради

---

## 🔄 АЖУРИРАЊЕ САЈТА (Будуће Измене)

Када направите измене у Emergent-у и желите да их објавите:

### Опција А: Преко Git-а

```bash
cd /var/www/fotoexpres

# Преузмите нове измене
git pull origin main

# Ажурирајте backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart fotoexpres-backend

# Ажурирајте frontend
cd ../frontend
yarn install
yarn build

echo "✅ Ажурирање завршено!"
```

### Опција Б: Преко SCP-а

На вашем локалном рачунару:
```bash
# Копирајте backend
scp -r backend/* root@VASA_IP:/var/www/fotoexpres/backend/

# Копирајте frontend
scp -r frontend/* root@VASA_IP:/var/www/fotoexpres/frontend/
```

Затим на серверу:
```bash
# Рестартујте backend
pm2 restart fotoexpres-backend

# Rebuild frontend
cd /var/www/fotoexpres/frontend
yarn install
yarn build
```

---

## 🛠️ КОРИСНЕ КОМАНДЕ

```bash
# Провера backend логова
pm2 logs fotoexpres-backend

# Рестарт backend-а
pm2 restart fotoexpres-backend

# Провера Nginx логова
tail -f /var/log/nginx/error.log

# Рестарт Nginx-а
systemctl restart nginx

# Провера искоришћеног простора
df -h

# Провера меморије
free -m
```

---

## ❓ РЕШАВАЊЕ ПРОБЛЕМА

### Проблем: Сајт не ради

```bash
# Проверите да ли backend ради
pm2 status

# Ако не ради, погледајте логове
pm2 logs fotoexpres-backend --lines 50

# Рестартујте
pm2 restart fotoexpres-backend
```

### Проблем: API враћа грешку

```bash
# Проверите .env фајл
cat /var/www/fotoexpres/backend/.env

# Проверите MongoDB конекцију
cd /var/www/fotoexpres/backend
source venv/bin/activate
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import os; c=AsyncIOMotorClient(os.environ.get('MONGO_URL')); print('OK')"
```

### Проблем: Слике се не приказују

```bash
# Проверите дозволе
chown -R www-data:www-data /var/www/fotoexpres/backend/uploads
chmod -R 755 /var/www/fotoexpres/backend/uploads
```

### Проблем: SSL не ради

```bash
# Проверите сертификат
certbot certificates

# Обновите мануелно
certbot renew --force-renewal
systemctl restart nginx
```

---

## 📞 КОНТАКТ ЗА ПОМОЋ

Ако наиђете на проблеме које не можете решити:
1. Копирајте поруку грешке
2. Вратите се у Emergent и питајте за помоћ
3. Дајте информације о кораку где сте запели

---

**Срећно са deployment-ом! 🎉**
