# Ispravka: Prikazivanje Slika Proizvoda

## Problem
Fotografije proizvoda nisu se prikazivale u admin panelu niti na javnoj proizvodi stranici. Umesto slika, prikazivao se "broken link" ili prazan image placeholder.

## Uzrok
Backend je čuvao slike proizvoda sa putanjom `/uploads/products/{filename}`, ali frontend nije dodavao `/api` prefix kada je pristupao ovim slikama. 

**Primeri:**
- Backend URL: `/uploads/products/24ad2f4a-8434-4de5-9c65-c1ee8b51ab3c.jpg`
- Frontend pokušavao: `${BACKEND_URL}/uploads/products/...` ❌
- Trebalo je: `${BACKEND_URL}/api/uploads/products/...` ✅

## Rešenje

Dodato je proveru u svim `getImageUrl` funkcijama da prepoznaju `/uploads/` putanje i dodaju `/api` prefix.

### Izmenjeni Fajlovi

#### 1. `/app/frontend/src/components/products/ProductCard.jsx`
```javascript
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Add /api prefix for backend routes
  if (imageUrl.startsWith('/uploads/')) {
    return `${BACKEND_URL}/api${imageUrl}`;
  }
  return `${BACKEND_URL}${imageUrl}`;
};
```

#### 2. `/app/frontend/src/components/products/ProductImageUploader.jsx`
- Ista logika kao ProductCard.jsx

#### 3. `/app/frontend/src/components/ProductsPage.jsx`
- Ista logika za javnu proizvodi stranicu

#### 4. `/app/frontend/src/components/ProductSelector.jsx`
- Ista logika za selektor proizvoda

#### 5. `/app/frontend/src/components/HomePage.jsx`
- Ista logika za featured proizvode na početnoj strani

## Rezultat Testiranja

✅ **Admin Panel (`/logovanje/products`)**
- Sve slike proizvoda se prikazuju pravilno
- Edit modal prikazuje sliku proizvoda
- Preview pri upload-u radi

✅ **Javna Proizvodi Stranica (`/proizvodi`)**
- Sve slike proizvoda se prikazuju pravilno

✅ **Upload Stranica (Product Selector)**
- Slike proizvoda se prikazuju u selektoru

## Tehnički Detalji

### Backend API Endpoints
- `GET /api/uploads/products/{filename}` - služi slike proizvoda
- Fajlovi se čuvaju u `/app/backend/uploads/products/`

### Frontend Image URL Logic
1. Eksterni URL-ovi (`http://` ili `https://`) - direktno korištenje
2. Lokalni fajlovi (`/images/`) - direktno korištenje (public folder)
3. Backend upload-ovi (`/uploads/`) - dodavanje `/api` prefix-a
4. Ostali - standardno dodavanje backend URL-a

## Datum Ispravke
Decembar 2025
