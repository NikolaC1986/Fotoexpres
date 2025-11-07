# 📚 Fotoexpres - Kompletan Vodič za Funkcionalnosti

## 📋 Pregled

Ova dokumentacija sadrži kompletan spisak svih funkcionalnosti Fotoexpres aplikacije, zajedno sa objašnjenjima koda, strukturom i važnim delovima implementacije.

---

## 🎯 Glavni Cilj Aplikacije

**Fotoexpres** je web aplikacija za naručivanje štampanja fotografija koja omogućava korisnicima da:
- Upload-uju fotografije
- Biraju format i količinu
- Ostave kontakt informacije
- Automatski dobiju cenu sa popustima
- Plate dostavu ili dobiju besplatnu dostavu za veće porudžbine

Admin može da:
- Pregleda sve porudžbine
- Preuzme ZIP fajlove sa fotografijama
- Menja cene i popuste
- Podesi promocije
- Upravlja podešavanjima sajta

---

## 📁 Struktura Projekta

```
/app
├── backend/                      # FastAPI Backend
│   ├── models/                   # Pydantic modeli
│   │   ├── admin.py             # Admin autentifikacija
│   │   └── order.py             # Struktura porudžbina
│   ├── utils/                    # Helper funkcije
│   │   ├── email_utils.py       # Email notifikacije
│   │   └── order_utils.py       # ZIP generisanje
│   ├── orders/                   # Folder za fotografije
│   ├── orders_zips/             # Folder za ZIP fajlove
│   ├── uploads/                  # Folder za hero slike
│   ├── server.py                # Glavni FastAPI server
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables
├── frontend/                     # React Frontend
│   ├── public/                   # Statički fajlovi
│   ├── src/
│   │   ├── components/          # React komponente
│   │   │   ├── ui/              # Shadcn UI komponente
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminPrices.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   ├── AdminDiscounts.jsx
│   │   │   ├── AdminPromotion.jsx
│   │   │   ├── AdminPassword.jsx
│   │   │   ├── FAQPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PricesPage.jsx
│   │   │   ├── PromotionBanner.jsx
│   │   │   └── UploadPage.jsx
│   │   ├── hooks/
│   │   │   └── use-toast.js     # Toast notifikacije
│   │   ├── App.js               # Glavna React app
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── .env                     # Frontend env variables
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## 🎨 Frontend Funkcionalnosti

### 1. Početna Stranica (HomePage.jsx)

**Funkcionalnosti:**
- Hero sekcija sa dinamičkom slikom iz admin panela
- "Upload Photos" dugme
- Koraci za naručivanje (4 koraka)
- O nama sekcija
- Footer sa kontakt informacijama
- Promocijski banner (ako je aktivan)

**Značajan Kod:**

```javascript
// Učitavanje dinamičke hero slike
const [heroImage, setHeroImage] = useState(null);

useEffect(() => {
  const fetchHeroImage = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      if (response.data.heroImageUrl) {
        setHeroImage(response.data.heroImageUrl);
      }
    } catch (error) {
      console.error('Error fetching hero image:', error);
    }
  };
  
  fetchHeroImage();
}, []);

// Prikaz hero sekcije
<div 
  className="relative bg-cover bg-center" 
  style={{
    backgroundImage: heroImage 
      ? `url(${heroImage})` 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }}
>
  {/* Hero content */}
</div>
```

**Gde promeniti:**
- **Tekst**: Linija 150-200 (Hero tekst, About tekst)
- **Stilizacija**: Tailwind klase
- **Koraci**: Linija 250-320 (4 koraka)

---

### 2. Upload Stranica (UploadPage.jsx)

**Funkcionalnosti:**
- Drag & drop ili klik za upload fotografija
- Pregled thumbnails-a sa opcijama za svaku sliku:
  - Format (9x13, 10x15, 13x18, 15x21, 20x30, 30x45)
  - Količina (1-100+)
  - Tip papira (Glossy / Matte)
- Bulk selekcija formata i papira
- Opcije obrade: Crop ili Fill with white
- Dinamički prikaz cena
- Automatski popusti:
  - Količinski popust (50+, 100+, 200+ slika)
  - Promocijski popust (ako je aktivan)
- Progress bar za upload
- Kontakt forma
- Auto-reset posle uspešne porudžbine

**Značajan Kod - Dinamička Kalkulacija Cene:**

```javascript
const calculateTotalPrice = () => {
  // Osnovna cena
  let total = 0;
  photos.forEach(photo => {
    const formatPrice = prices[photo.format] || 0;
    total += formatPrice * photo.quantity;
  });

  // Količinski popust
  let quantityDiscount = 0;
  let quantityDiscountPercent = 0;
  const totalQuantity = photos.reduce((sum, p) => sum + p.quantity, 0);
  
  const applicableDiscount = discountTiers
    .filter(tier => totalQuantity >= tier.quantity)
    .sort((a, b) => b.quantity - a.quantity)[0];
  
  if (applicableDiscount) {
    quantityDiscountPercent = applicableDiscount.discountPercent;
    quantityDiscount = (total * quantityDiscountPercent) / 100;
  }

  // Promocijski popust
  let promotionDiscount = 0;
  let promotionDiscountPercent = 0;
  
  if (promotion && promotion.isActive) {
    const now = new Date();
    const endDate = new Date(promotion.endDate);
    
    if (now <= endDate) {
      if (promotion.applicableFormats === 'all') {
        promotionDiscountPercent = promotion.discountPercent;
        promotionDiscount = (total * promotionDiscountPercent) / 100;
      } else if (promotion.applicableFormats) {
        const formats = promotion.applicableFormats.split(',').map(f => f.trim());
        const eligibleTotal = photos
          .filter(p => formats.includes(p.format))
          .reduce((sum, p) => (prices[p.format] || 0) * p.quantity, 0);
        
        promotionDiscountPercent = promotion.discountPercent;
        promotionDiscount = (eligibleTotal * promotionDiscountPercent) / 100;
      }
    }
  }

  // Finalna cena
  const subtotal = total - quantityDiscount - promotionDiscount;
  
  // Dostava
  const deliveryFee = subtotal >= freeDeliveryLimit ? 0 : deliveryPrice;
  const finalTotal = subtotal + deliveryFee;

  return {
    subtotal: total,
    quantityDiscount,
    quantityDiscountPercent,
    promotionDiscount,
    promotionDiscountPercent,
    deliveryFee,
    total: finalTotal
  };
};
```

**Značajan Kod - Upload sa Progress Bar:**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsUploading(true);
  setUploadProgress(0);

  const formData = new FormData();
  
  // Dodavanje fotografija
  photos.forEach(photo => {
    formData.append('photos', photo.file);
  });

  // Detalji porudžbine
  const orderDetails = {
    contactInfo,
    photoSettings: photos.map(p => ({
      fileName: p.file.name,
      format: p.format,
      quantity: p.quantity,
      finish: p.finish
    })),
    cropOption,
    fillWhiteOption,
    totalPrice: priceBreakdown.total,
    // ... ostalo
  };

  formData.append('order_details', JSON.stringify(orderDetails));

  try {
    const response = await axios.post(
      `${API}/orders/create`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minuta
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      }
    );

    if (response.data.success) {
      toast({
        title: "Uspešno!",
        description: `Porudžbina ${response.data.orderNumber} je kreirana.`,
      });
      resetForm();
      navigate('/');
    }
  } catch (error) {
    toast({
      title: "Greška",
      description: "Došlo je do greške pri kreiranju porudžbine.",
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};
```

**Gde promeniti:**
- **Formate**: Linija 400-450 (opcije u dropdown-u)
- **Validaciju**: Linija 500-550 (forma validacija)
- **Stilizaciju**: Tailwind klase

---

### 3. Cenovnik (PricesPage.jsx)

**Funkcionalnosti:**
- Prikaz svih formata i cena
- Dinamičko učitavanje cena iz baze
- Informacija o besplatnoj dostavi
- Responsive tabela

**Značajan Kod:**

```javascript
const [prices, setPrices] = useState({});
const [freeDeliveryLimit, setFreeDeliveryLimit] = useState(5000);

useEffect(() => {
  const fetchPrices = async () => {
    try {
      const pricesRes = await axios.get(`${API}/prices`);
      setPrices(pricesRes.data.prices);
      
      const settingsRes = await axios.get(`${API}/settings`);
      setFreeDeliveryLimit(settingsRes.data.freeDeliveryLimit);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };
  
  fetchPrices();
}, []);
```

---

### 4. FAQ Stranica (FAQPage.jsx)

**Funkcionalnosti:**
- Najčešća pitanja i odgovori
- Dinamičke kontakt informacije
- "Pozovite nas" dugme sa dinamičkim brojem telefona

**Gde promeniti:**
- **Pitanja i odgovori**: Linija 50-200
- **Dodati nova pitanja**: Kopirajte strukturu postojećih

---

### 5. Promocijski Banner (PromotionBanner.jsx)

**Funkcionalnosti:**
- Prikazuje se na vrhu sajta iznad navigation bara
- Dinamička poruka iz admin panela
- "X" dugme za zatvaranje
- Automatski se sakriva ako nije aktivan

**Značajan Kod:**

```javascript
const [promotion, setPromotion] = useState(null);
const [isVisible, setIsVisible] = useState(true);

useEffect(() => {
  const fetchPromotion = async () => {
    try {
      const response = await axios.get(`${API}/promotion`);
      const promo = response.data;
      
      if (promo && promo.isActive) {
        const now = new Date();
        const endDate = new Date(promo.endDate);
        
        if (now <= endDate) {
          setPromotion(promo);
        }
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
    }
  };
  
  fetchPromotion();
}, []);

if (!promotion || !isVisible) return null;

return (
  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3">
    <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
      <p className="text-center flex-1">
        {promotion.message}
      </p>
      <button onClick={() => setIsVisible(false)}>×</button>
    </div>
  </div>
);
```

---

## 🔐 Admin Panel Funkcionalnosti

### 1. Admin Login (AdminLogin.jsx)

**Funkcionalnosti:**
- JWT autentifikacija preko backend-a
- Lokalno čuvanje tokena
- Automatska provera autentifikacije

**Default Kredencijali:**
```
Username: Vlasnik
Password: Fotoexpres2025!
```

**Ruta:** `/logovanje`

**Značajan Kod:**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await axios.post(`${API}/admin/login`, {
      username: credentials.username,
      password: credentials.password
    });
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
      
      toast({
        title: "Uspešno prijavljivanje",
        description: "Dobrodošli u admin panel"
      });
      
      navigate('/logovanje/dashboard');
    }
  } catch (error) {
    toast({
      title: "Greška pri prijavi",
      description: error.response?.data?.detail || "Pogrešno korisničko ime ili lozinka",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};
```

**Gde promeniti kredencijale:**
- Backend: `/app/backend/models/admin.py` (linija 12-13)
- Frontend: Placeholder u `/app/frontend/src/components/AdminLogin.jsx`

---

### 2. Admin Dashboard (AdminDashboard.jsx)

**Funkcionalnosti:**
- Pregled svih porudžbina
- Statistike (Ukupno, Na Čekanju, Završeno)
- Akcije:
  - Preuzimanje ZIP fajla
  - Ažuriranje statusa
  - Brisanje porudžbine
- Linkovi na ostale admin stranice

**Značajan Kod - Preuzimanje ZIP Fajla:**

```javascript
const handleDownload = async (orderNumber, zipFilePath) => {
  try {
    const token = localStorage.getItem('adminToken');
    const downloadUrl = `${API}/admin/orders/${orderNumber}/download`;
    
    const response = await axios.get(downloadUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-${orderNumber}.zip`;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      link.remove();
    }, 100);
    
    toast({
      title: "Preuzimanje započeto",
      description: `Porudžbina ${orderNumber} se preuzima`
    });
  } catch (error) {
    toast({
      title: "Greška",
      description: "Nije moguće preuzeti ZIP fajl.",
      variant: "destructive"
    });
  }
};
```

**Značajan Kod - Brisanje Porudžbine:**

```javascript
const handleDelete = async (orderNumber) => {
  if (!window.confirm(`Da li ste sigurni da želite da obrišete porudžbinu ${orderNumber}?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken');
    await axios.delete(`${API}/admin/orders/${orderNumber}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    toast({
      title: "Porudžbina obrisana",
      description: `Porudžbina ${orderNumber} je uspešno obrisana`
    });
    
    fetchOrders(); // Refresh liste
  } catch (error) {
    toast({
      title: "Greška",
      description: "Nije moguće obrisati porudžbinu",
      variant: "destructive"
    });
  }
};
```

---

### 3. Admin Cene (AdminPrices.jsx)

**Funkcionalnosti:**
- Prikaz trenutnih cena za sve formate
- Izmena cena pojedinačno
- Čuvanje izmena u MongoDB

**Značajan Kod:**

```javascript
const handleSave = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    await axios.put(
      `${API}/admin/prices`,
      { prices: editedPrices },
      { headers: { 'Authorization': `Bearer ${token}` }}
    );
    
    toast({
      title: "Uspešno",
      description: "Cene su uspešno ažurirane"
    });
  } catch (error) {
    toast({
      title: "Greška",
      description: "Nije moguće ažurirati cene",
      variant: "destructive"
    });
  }
};
```

---

### 4. Admin Popusti (AdminDiscounts.jsx)

**Funkcionalnosti:**
- Prikaz količinskih popusta (3 nivoa)
- Izmena:
  - Minimalne količine za svaki nivo
  - Procenat popusta za svaki nivo
- Automatski se primenjuju na UploadPage

**Default Popusti:**
```javascript
[
  { quantity: 50, discountPercent: 5 },   // 5% za 50+ slika
  { quantity: 100, discountPercent: 10 }, // 10% za 100+ slika
  { quantity: 200, discountPercent: 15 }  // 15% za 200+ slika
]
```

---

### 5. Admin Promocija (AdminPromotion.jsx)

**Funkcionalnosti:**
- Kreiranje promocijske poruke
- Izbor formata na koje se odnosi:
  - Svi formati
  - Specifični formati (multi-select)
- Procenat popusta (1-100%)
- Trajanje promocije (datum kraja)
- Aktivacija/deaktivacija
- Preview poruke

**Značajan Kod:**

```javascript
const handleSave = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    
    const promotionData = {
      message: promotion.message,
      applicableFormats: selectedFormats.length === formats.length 
        ? 'all' 
        : selectedFormats.join(','),
      discountPercent: parseInt(promotion.discountPercent),
      endDate: promotion.endDate,
      isActive: promotion.isActive
    };
    
    await axios.put(
      `${API}/admin/promotion`,
      promotionData,
      { headers: { 'Authorization': `Bearer ${token}` }}
    );
    
    toast({
      title: "Uspešno",
      description: "Promocija je ažurirana"
    });
  } catch (error) {
    toast({
      title: "Greška",
      description: "Nije moguće ažurirati promociju",
      variant: "destructive"
    });
  }
};
```

---

### 6. Admin Podešavanja (AdminSettings.jsx)

**Funkcionalnosti:**
- Izmena kontakt informacija:
  - Email
  - Telefon
- Limit za besplatnu dostavu
- Cena dostave
- Upload hero slike za početnu stranicu

**Značajan Kod - Upload Hero Slike:**

```javascript
const handleHeroImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validacija
  if (file.size > 5 * 1024 * 1024) {
    toast({
      title: "Greška",
      description: "Slika mora biti manja od 5MB",
      variant: "destructive"
    });
    return;
  }

  const formData = new FormData();
  formData.append('hero_image', file);

  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.post(
      `${API}/admin/upload-hero-image`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.success) {
      setSettings(prev => ({
        ...prev,
        heroImageUrl: response.data.imageUrl
      }));
      
      toast({
        title: "Uspešno",
        description: "Hero slika je uspešno postavljena"
      });
    }
  } catch (error) {
    toast({
      title: "Greška",
      description: "Nije moguće postaviti sliku",
      variant: "destructive"
    });
  }
};
```

---

### 7. Admin Lozinka (AdminPassword.jsx)

**Funkcionalnosti:**
- Promena admin lozinke
- Validacija trenutne lozinke
- Potvrda nove lozinke

**Napomena:** Backend endpoint za promenu lozinke može se implementirati u budućnosti.

---

## ⚙️ Backend Funkcionalnosti

### 1. Autentifikacija (models/admin.py)

**Funkcionalnosti:**
- JWT token generisanje
- Token verifikacija
- Provera admin kredencijala

**Značajan Kod:**

```python
import jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Default admin kredencijali
ADMIN_USERNAME = "Vlasnik"
ADMIN_PASSWORD = "Fotoexpres2025!"

def create_access_token(data: dict):
    """Kreira JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verifikuje JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def verify_admin_credentials(username: str, password: str):
    """Proverava admin kredencijale"""
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD
```

**Gde promeniti kredencijale:**
- Linija 12: `ADMIN_USERNAME = "NovoIme"`
- Linija 13: `ADMIN_PASSWORD = "NovaSifra123!"`

---

### 2. Struktura Porudžbine (models/order.py)

**Značajan Kod:**

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ContactInfo(BaseModel):
    fullName: str
    email: str
    phone: str
    address: str
    notes: Optional[str] = ""

class PhotoSetting(BaseModel):
    fileName: str
    format: str  # 9x13, 10x15, itd.
    quantity: int
    finish: str  # glossy ili matte

class OrderDetails(BaseModel):
    contactInfo: ContactInfo
    photoSettings: List[PhotoSetting]

class Order(BaseModel):
    orderNumber: str
    status: str = "pending"  # pending, processing, completed
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    contactInfo: ContactInfo
    photoSettings: List[PhotoSetting]
    zipFilePath: str
    totalPhotos: int

class OrderResponse(BaseModel):
    success: bool
    orderNumber: str
    message: str
    zipFilePath: str
```

---

### 3. Kreiranje Porudžbine (server.py)

**Endpoint:** `POST /api/orders/create`

**Šta radi:**
1. Prima fotografije i detalje porudžbine
2. Generiše jedinstveni broj porudžbine (ORD-XXXXXX)
3. Čuva fotografije u `/backend/orders/{order_number}/`
4. Kreira ZIP fajl sa fotografijama i order_details.txt
5. Čuva porudžbinu u MongoDB
6. Šalje email notifikaciju (opciono)
7. Vraća broj porudžbine korisniku

**Značajan Kod:**

```python
@api_router.post("/orders/create", response_model=OrderResponse)
async def create_order(
    photos: List[UploadFile] = File(...),
    order_details: str = Form(...)
):
    try:
        # 1. Parse order details
        order_data = json.loads(order_details)
        order_details_obj = OrderDetails(**order_data)
        
        # 2. Generiši broj porudžbine
        order_number = generate_order_number()  # Format: ORD-123456
        
        # 3. Kreiraj folder za porudžbinu
        order_dir = ORDERS_DIR / order_number
        order_dir.mkdir(exist_ok=True)
        
        # 4. Čuvaj fotografije
        saved_files = []
        for photo in photos:
            file_path = order_dir / photo.filename
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            saved_files.append(photo.filename)
        
        # 5. Kalkuliši ukupan broj fotografija
        total_photos = sum(p.quantity for p in order_details_obj.photoSettings)
        
        # 6. Dobavi opcije obrade
        crop_option = order_data.get('cropOption', False)
        fill_white_option = order_data.get('fillWhiteOption', False)
        
        # 7. Dobavi info o cenama
        price_info = {
            'totalPrice': order_data.get('totalPrice', 0),
            'quantityDiscountAmount': order_data.get('quantityDiscountAmount', 0),
            'promotionDiscountAmount': order_data.get('promotionDiscountAmount', 0),
            'deliveryFee': order_data.get('deliveryFee', 400),
            'prices': order_data.get('prices', {})
        }
        
        # 8. Kreiraj ZIP fajl
        zip_file_name = f"order-{order_number}.zip"
        zip_path = ORDERS_ZIPS_DIR / zip_file_name
        
        create_order_zip(
            str(order_dir),
            str(zip_path),
            order_number,
            order_details_obj.contactInfo.model_dump(),
            [p.model_dump() for p in order_details_obj.photoSettings],
            total_photos,
            crop_option,
            fill_white_option,
            price_info
        )
        
        # 9. Sačuvaj u MongoDB
        order = Order(
            orderNumber=order_number,
            contactInfo=order_details_obj.contactInfo,
            photoSettings=order_details_obj.photoSettings,
            zipFilePath=str(zip_path),
            totalPhotos=total_photos,
            status="pending"
        )
        
        order_dict = order.model_dump()
        order_dict['createdAt'] = order_dict['createdAt'].isoformat()
        await db.orders.insert_one(order_dict)
        
        # 10. Pošalji email (opciono)
        # send_order_notification(order_details_obj.contactInfo.email, order_number)
        
        return OrderResponse(
            success=True,
            orderNumber=order_number,
            message="Porudžbina je uspešno kreirana",
            zipFilePath=str(zip_path)
        )
        
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 4. ZIP Generisanje (utils/order_utils.py)

**Funkcionalnosti:**
- Kreira ZIP sa svim fotografijama
- Generiše `order_details.txt` sa:
  - Brojem porudžbine
  - Kontakt informacijama
  - Detaljima za svaku fotografiju
  - Ukupnim brojem slika
  - Cenom i popustima
  - Opcijama obrade

**Značajan Kod:**

```python
import zipfile
import os
import random

def generate_order_number():
    """Generiše jedinstveni broj porudžbine"""
    return f"ORD-{random.randint(100000, 999999)}"

def create_order_zip(
    order_dir,
    zip_path,
    order_number,
    contact_info,
    photo_settings,
    total_photos,
    crop_option,
    fill_white_option,
    price_info
):
    """Kreira ZIP fajl sa fotografijama i order_details.txt"""
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 1. Dodaj sve fotografije
        for file in os.listdir(order_dir):
            file_path = os.path.join(order_dir, file)
            if os.path.isfile(file_path):
                zipf.write(file_path, arcname=file)
        
        # 2. Kreiraj order_details.txt
        details_content = f"""FOTOEXPRES - Detalji Porudžbine
{'='*60}

Broj Porudžbine: {order_number}

{'='*60}
KONTAKT INFORMACIJE
{'='*60}

Ime i Prezime: {contact_info['fullName']}
Email: {contact_info['email']}
Telefon: {contact_info['phone']}
Adresa: {contact_info['address']}
"""
        
        if contact_info.get('notes'):
            details_content += f"\nNapomene: {contact_info['notes']}\n"
        
        details_content += f"\n{'='*60}\nDETALJI FOTOGRAFIJA\n{'='*60}\n\n"
        
        # 3. Dodaj detalje za svaku fotografiju
        for i, photo in enumerate(photo_settings, 1):
            details_content += f"""{i}. {photo['fileName']}
   Format: {photo['format']} cm
   Količina: {photo['quantity']}
   Papir: {photo['finish'].capitalize()}
\n"""
        
        # 4. Opcije obrade
        details_content += f"\n{'='*60}\nOPCIJE OBRADE\n{'='*60}\n\n"
        details_content += f"Crop na fit: {'Da' if crop_option else 'Ne'}\n"
        details_content += f"Fill sa belom bojom: {'Da' if fill_white_option else 'Ne'}\n"
        
        # 5. Cene i popusti
        details_content += f"\n{'='*60}\nCENA I POPUSTI\n{'='*60}\n\n"
        details_content += f"Osnovna cena: {price_info.get('totalPrice', 0):.2f} RSD\n"
        
        if price_info.get('quantityDiscountAmount', 0) > 0:
            details_content += f"Količinski popust ({price_info.get('quantityDiscountPercent', 0)}%): -{price_info.get('quantityDiscountAmount', 0):.2f} RSD\n"
        
        if price_info.get('promotionDiscountAmount', 0) > 0:
            details_content += f"Promocijski popust ({price_info.get('promotionDiscountPercent', 0)}%): -{price_info.get('promotionDiscountAmount', 0):.2f} RSD\n"
        
        delivery_fee = price_info.get('deliveryFee', 0)
        if delivery_fee > 0:
            details_content += f"Dostava: {delivery_fee:.2f} RSD\n"
        else:
            details_content += f"Dostava: BESPLATNA\n"
        
        details_content += f"\nUKUPNO: {price_info.get('totalPrice', 0):.2f} RSD\n"
        
        # 6. Ukupan broj
        details_content += f"\n{'='*60}\n"
        details_content += f"Ukupan broj fotografija za štampu: {total_photos}\n"
        details_content += f"{'='*60}\n"
        
        # 7. Dodaj order_details.txt u ZIP
        zipf.writestr('order_details.txt', details_content)
```

---

### 5. Email Notifikacije (utils/email_utils.py)

**Funkcionalnosti:**
- Šalje email korisniku posle kreiranja porudžbine
- Koristi Gmail SMTP ili SendGrid

**Značajan Kod:**

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USER = os.environ.get('EMAIL_USER', '')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')

def send_order_notification(customer_email, order_number):
    """Šalje email notifikaciju korisniku"""
    
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("Email credentials not configured")
        return False
    
    try:
        # 1. Kreiraj email poruku
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Fotoexpres - Porudžbina {order_number}'
        msg['From'] = EMAIL_USER
        msg['To'] = customer_email
        
        # 2. HTML sadržaj
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #ea580c;">Hvala na porudžbini!</h2>
            <p>Vaša porudžbina je uspešno primljena.</p>
            <p><strong>Broj porudžbine:</strong> {order_number}</p>
            <p>Bićete obavešteni kada vaše fotografije budu spremne.</p>
            <br>
            <p>Ukoliko imate pitanja, kontaktirajte nas na:</p>
            <p>Email: info@fotoexpres.rs</p>
            <p>Telefon: +381 XX XXX XXXX</p>
            <br>
            <p style="color: #666;">Fotoexpres Tim</p>
          </body>
        </html>
        """
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # 3. Pošalji email
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
        
        print(f"Email sent to {customer_email}")
        return True
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False
```

**Gde konfigurišu:**
- `.env` fajl u backend folderu:
  ```
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=vas.email@gmail.com
  EMAIL_PASSWORD=app_password_ovde
  ```

---

## 📊 MongoDB Struktura

### Kolekcije

#### 1. `orders` - Porudžbine
```json
{
  "_id": "mongo_object_id",
  "orderNumber": "ORD-123456",
  "status": "pending",
  "createdAt": "2025-01-01T12:00:00",
  "contactInfo": {
    "fullName": "Marko Petrović",
    "email": "marko@example.com",
    "phone": "+381641234567",
    "address": "Kneza Miloša 15, Beograd",
    "notes": "Molim vas da slike budu sjajne"
  },
  "photoSettings": [
    {
      "fileName": "slika1.jpg",
      "format": "10x15",
      "quantity": 2,
      "finish": "glossy"
    },
    {
      "fileName": "slika2.jpg",
      "format": "13x18",
      "quantity": 1,
      "finish": "matte"
    }
  ],
  "zipFilePath": "/app/backend/orders_zips/order-ORD-123456.zip",
  "totalPhotos": 3
}
```

#### 2. `prices` - Cene Formata
```json
{
  "_id": "default_prices",
  "prices": {
    "9x13": 12,
    "10x15": 18,
    "13x18": 25,
    "15x21": 50,
    "20x30": 150,
    "30x45": 250
  }
}
```

#### 3. `settings` - Opšta Podešavanja
```json
{
  "_id": "default_settings",
  "freeDeliveryLimit": 5000,
  "deliveryPrice": 400,
  "contactEmail": "info@fotoexpres.rs",
  "contactPhone": "+381 XX XXX XXXX",
  "heroImageUrl": "https://your-cdn.com/hero-image.jpg"
}
```

#### 4. `discounts` - Količinski Popusti
```json
{
  "_id": "default_discounts",
  "tiers": [
    { "quantity": 50, "discountPercent": 5 },
    { "quantity": 100, "discountPercent": 10 },
    { "quantity": 200, "discountPercent": 15 }
  ]
}
```

#### 5. `promotions` - Promocije
```json
{
  "_id": "default_promotion",
  "message": "🎉 Popust 20% na sve formate do kraja meseca!",
  "applicableFormats": "all",
  "discountPercent": 20,
  "endDate": "2025-01-31T23:59:59",
  "isActive": true
}
```

---

## 🔒 Environment Variables

### Backend (.env)
```bash
# MongoDB
MONGO_URL=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=fotoexpres

# JWT
JWT_SECRET_KEY=generisi-random-string-ovde-minimum-32-karaktera

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=vas.email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop

# Ili Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx
```

### Frontend (.env)
```bash
REACT_APP_BACKEND_URL=https://your-app.vercel.app
```

---

## 🎨 Stilizacija

### Tailwind Config (tailwind.config.js)

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Glavna boja - Narandžasta
        primary: {
          DEFAULT: '#ea580c',
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#ea580c',
          600: '#c2410c',
          700: '#9a3412',
        },
      },
    },
  },
  plugins: [],
}
```

**Gde promeniti boje:**
- Glavna narandžasta: `#ea580c`
- Zamenite sve instance u tailwind.config.js
- Ili zamenite `orange-600` sa drugom bojom u komponentama

---

## 🔐 Bezbednost

### 1. JWT Token
- Token se čuva u localStorage
- Expire nakon 24h
- Backend verifikuje svaki request

### 2. Admin Rute
- Sve admin rute su zaštićene JWT autentifikacijom
- Automatski redirect na login ako nema tokena

### 3. File Uploads
- Validacija file tipova (samo slike)
- Ograničenje veličine fajla
- Sanitizacija naziva fajlova

### 4. Environment Variables
- Svi sensitivi podaci u .env fajlovima
- .env fajlovi nisu u git repository-ju (.gitignore)

---

## 📱 Responsive Dizajn

### Breakpoints (Tailwind)
- **sm**: 640px (mobilni)
- **md**: 768px (tableti)
- **lg**: 1024px (desktop)
- **xl**: 1280px (veliki desktop)

### Primeri
```jsx
// Mobilni: vertikalni stack, Desktop: horizontalni
<div className="flex flex-col md:flex-row">

// Mobilni: puna širina, Desktop: 50%
<div className="w-full md:w-1/2">

// Mobilni: padding 4, Desktop: padding 8
<div className="p-4 md:p-8">
```

---

## 🚀 Performance Optimizacije

### 1. Image Optimization
- Kompresija slika pre upload-a (opciono)
- Lazy loading za thumbnails
- WebP format (opciono)

### 2. Code Splitting
- React.lazy() za admin komponente
- Route-based splitting

### 3. Caching
- Browser cache za statičke fajlove
- MongoDB indexes za brže queries

---

## 📚 Dodatne Napomene

### Testiranje Lokalno

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Frontend
cd frontend
yarn install
yarn start
```

### Production Build

```bash
# Frontend
cd frontend
yarn build

# Rezultat u frontend/build/ folder
```

### Backup Baze

```bash
# MongoDB Atlas automatski pravi backups
# Ili manual export:
mongodump --uri="mongodb+srv://..." --out=backup/
```

---

## 📞 Kontakt i Podrška

Ako imate pitanja o kodu ili funkcionalnostima:

1. Pregledajte ovu dokumentaciju
2. Pogledajte komentare u kodu
3. Koristite test_result.md za testing info
4. Proverite BUDUCI_RAZVOJ.md za mogućnosti proširenja

---

**Kraj dokumentacije - Srećno sa projektom! 🚀📸**