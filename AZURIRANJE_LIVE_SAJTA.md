# 🔄 Водич за Ажурирање Live Сајта

## Брзи Преглед

Када направите измене у Emergent-у и желите да их објавите на live сајту, пратите ове кораке.

---

## КОРАК 1: Преузмите нови код из Emergent-а

### Опција А: Преко GitHub-а (препоручено)

1. У Emergent интерфејсу кликните на **"Save to GitHub"**
2. Сачекајте да се код сачува у ваш репозиторијум

### Опција Б: Директно преузимање

1. У Emergent интерфејсу пронађите опцију за преузимање кода
2. Преузмите ZIP архиву на ваш рачунар

---

## КОРАК 2: Повежите се на сервер

Отворите терминал и унесите:

```bash
ssh root@VASA_IP_ADRESA
```

---

## КОРАК 3: Ажурирајте код

### Ако користите GitHub:

```bash
cd /var/www/fotoexpres
git pull origin main
```

### Ако преносите фајлове ручно:

На вашем локалном рачунару:
```bash
scp -r /putanja/do/backend/* root@VASA_IP:/var/www/fotoexpres/backend/
scp -r /putanja/do/frontend/* root@VASA_IP:/var/www/fotoexpres/frontend/
```

---

## КОРАК 4: Ажурирајте Backend

```bash
cd /var/www/fotoexpres/backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart fotoexpres-backend
```

Проверите да ли ради:
```bash
pm2 status
pm2 logs fotoexpres-backend --lines 20
```

---

## КОРАК 5: Ажурирајте Frontend

```bash
cd /var/www/fotoexpres/frontend
yarn install
yarn build
```

**Напомена:** Ово може потрајати 2-5 минута.

---

## КОРАК 6: Проверите сајт

1. Отворите ваш сајт у браузеру
2. Притисните `Ctrl+Shift+R` за hard refresh (да очистите кеш)
3. Проверите да ли су измене видљиве

---

## ✅ Готово!

Ваш сајт је ажуриран.

---

## 🚀 Брза Команда (Све у једном)

Ако желите да ажурирате све једном командом, можете користити овај скрипт:

```bash
cd /var/www/fotoexpres && \
git pull origin main && \
cd backend && \
source venv/bin/activate && \
pip install -r requirements.txt && \
pm2 restart fotoexpres-backend && \
cd ../frontend && \
yarn install && \
yarn build && \
echo "✅ Ажурирање завршено!"
```

---

## ❓ Решавање Проблема

### Backend не ради после ажурирања

```bash
pm2 logs fotoexpres-backend --lines 50
```

Погледајте грешку и исправите. Најчешћи проблеми:
- Недостаје нови пакет: `pip install -r requirements.txt`
- Синтаксна грешка у коду

### Frontend не приказује измене

1. Очистите кеш браузера: `Ctrl+Shift+R`
2. Проверите да ли је build успео:
```bash
ls -la /var/www/fotoexpres/frontend/build/
```

### Сајт уопште не ради

```bash
# Проверите nginx
systemctl status nginx

# Рестартујте ако треба
systemctl restart nginx

# Проверите backend
pm2 status
pm2 restart fotoexpres-backend
```

---

## 📞 Помоћ

Ако наиђете на проблем:
1. Копирајте поруку грешке
2. Вратите се у Emergent и питајте за помоћ
