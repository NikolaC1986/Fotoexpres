# Reklamni Baner Sistem

## Opis
Kompletan sistem za upravljanje reklamnim banerom na početnoj strani sajta. Baner se prikazuje iznad sekcije "Izdvajamo iz ponude" i podržava 3 različita formata za desktop, tablet i mobilne uređaje.

## 📐 Tačne Dimenzije Banera

### Desktop Baner
- **Dimenzije:** 1920 x 400 piksela
- **Format:** Široki banner format
- **Preporučeni tip fajla:** JPG, PNG, WebP
- **Maksimalna veličina:** 10MB

### Tablet Baner
- **Dimenzije:** 1024 x 350 piksela
- **Format:** Srednji banner format
- **Preporučeni tip fajla:** JPG, PNG, WebP
- **Maksimalna veličina:** 10MB
- **Napomena:** Opciono - ako nije postavljen, koristiće se desktop verzija

### Mobilni Baner
- **Dimenzije:** 430 x 250 piksela
- **Format:** Kompaktan banner format
- **Preporučeni tip fajla:** JPG, PNG, WebP
- **Maksimalna veličina:** 10MB
- **Napomena:** Opciono - ako nije postavljen, koristiće se tablet ili desktop verzija

## 🎯 Funkcionalnosti

### Admin Panel
- **Aktivacija/Deaktivacija:** Prekidač za brzo uključivanje/isključivanje banera
- **Upload slika:** Poseban upload za svaki format (desktop, tablet, mobilni)
- **Link URL:** Opciono polje za dodavanje URL-a (baner postaje klikabilan)
- **Preview:** Trenutni baner se prikazuje u admin panelu
- **Sačuvaj:** Sinhronizuje sve izmene sa backend-om

### Javna Stranica
- **Responsivnost:** Automatski prikazuje odgovarajući format:
  - Desktop (≥1024px): prikazuje desktop baner
  - Tablet (768px-1023px): prikazuje tablet baner (fallback na desktop)
  - Mobile (<768px): prikazuje mobilni baner (fallback na tablet/desktop)
- **Klikabilan link:** Ako je postavljen URL, baner vodi na taj link
- **Automatsko sakrivanje:** Baner se ne prikazuje ako je deaktiviran ili ako nema slika

## 📁 Struktura Fajlova

### Frontend Komponente
- `/app/frontend/src/components/PromoBanner.jsx` - Javna komponenta za prikaz banera
- `/app/frontend/src/components/AdminPromoBanner.jsx` - Admin panel za upravljanje banerom

### Backend Endpoints
- `GET /api/promo-banner` - Javni endpoint (vraća baner ako je aktivan)
- `GET /api/admin/promo-banner` - Admin endpoint (vraća trenutnu konfiguraciju)
- `POST /api/admin/promo-banner/upload-image` - Upload slike banera
- `PUT /api/admin/promo-banner` - Ažuriranje konfiguracije banera

### Direktorijumi
- `/app/backend/uploads/promo_banners/` - Folder za čuvanje slika

## 🔧 Backend Model (MongoDB)

```javascript
{
  isActive: Boolean,           // Da li je baner aktivan
  desktopImage: String,        // URL desktop slike
  tabletImage: String,         // URL tablet slike (opciono)
  mobileImage: String,         // URL mobilne slike (opciono)
  linkUrl: String,             // Link URL (opciono)
  updatedAt: String            // ISO timestamp poslednje izmene
}
```

## 🚀 Kako Koristiti

### 1. Priprema Slika
Kreirajte banere u sledećim dimenzijama:
- Desktop: 1920x400px
- Tablet: 1024x350px  
- Mobile: 430x250px

### 2. Upload u Admin Panelu
1. Idite na: `/logovanje/promo-banner`
2. Kliknite "Upload Desktop Baner" i izaberite fajl
3. (Opciono) Upload tablet i mobilnu verziju
4. (Opciono) Dodajte Link URL ako želite da baner vodi negde
5. Kliknite "Aktivan" dugme da aktivirate baner
6. Kliknite "Sačuvaj"

### 3. Verifikacija
Posetite početnu stranicu i baner bi trebalo da se prikaže iznad "Izdvajamo iz ponude" sekcije.

## 💡 Best Practices

### Dizajn
- Koristite visokokvalitetne slike
- Održavajte konzistentan branding
- Pazite na čitljivost teksta na svim uređajima
- Optimizujte slike za web (WebP format preporučen)

### Performanse
- Kompresujte slike pre upload-a
- Maksimalna veličina od 10MB je postavljena iz sigurnosnih razloga
- Koristite WebP format za najbolju kompresiju

### Link URL
- Uvek koristite potpuni URL (https://example.com)
- Testira
jte link pre aktivacije banera
- Za eksterne linkove, link se otvara u novom tab-u

## 🔐 Sigurnost
- Samo administratori mogu upravljati banerom (zahteva autentifikaciju)
- Validacija tipa fajla (samo slike: JPG, PNG, WebP, GIF)
- Validacija MIME type-a
- Ograničenje veličine fajla (10MB)
- Unique filename generisanje (sprečava prepisivanje)

## 🎨 Primer Upotrebe

### Scenario 1: Sezonska Promocija
- Desktop: 1920x400 - Veliki banner sa proizvodom i popustom
- Tablet: 1024x350 - Srednji format sa istim dizajnom
- Mobile: 430x250 - Kompaktan format, samo tekst popusta
- Link URL: https://fotoexpres.rs/upload?promo=zimska-akcija

### Scenario 2: Novi Proizvod
- Desktop: Široki banner sa slikom proizvoda i features
- Tablet: Isti dizajn, malo smanjen
- Mobile: Fokus na proizvod bez dodatnih detalja
- Link URL: https://fotoexpres.rs/proizvodi#novi-proizvod

## 📊 Responsive Breakpoints
```css
/* Mobile */
< 768px → Prikazuje mobilni baner

/* Tablet */
768px - 1023px → Prikazuje tablet baner

/* Desktop */
≥ 1024px → Prikazuje desktop baner
```

## 🐛 Troubleshooting

### Baner se ne prikazuje
- Proverite da li je aktiviran u admin panelu
- Proverite da li je uploadovan bar desktop baner
- Proverite konzolu browser-a za greške

### Slika je izobličena
- Koristite tačne dimenzije navedene gore
- Koristite `object-cover` CSS ako želite da ispunite prostor
- Trenutno koristi `object-contain` da bi očuvala aspect ratio

### Link ne radi
- Proverite da li URL počinje sa http:// ili https://
- Proverite da li je link tačan u admin panelu

## Datum Implementacije
Decembar 2025
