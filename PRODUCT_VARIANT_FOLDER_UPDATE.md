# Ažuriranje: Dodavanje Varijante u ZIP Strukturu Proizvoda

## Promena
Dodat je dodatni nivo organizacije u ZIP strukturu proizvoda - **Varijanta proizvoda**.

## Pre vs. Posle

### Stara Struktura (2 nivoa)
```
Fotokalendar/
├── 1/
│   └── photo1.jpg
└── 2/
    └── photo2.jpg
```
**Problem:** Nije jasno koji je format kalendara (A4, A3, itd.)

### Nova Struktura (3 nivoa) ✅
```
Fotokalendar/
├── A4/
│   ├── 1/
│   │   └── photo1.jpg
│   └── 2/
│       └── photo2.jpg
└── A3/
    └── 1/
        └── photo3.jpg
```
**Prednost:** Jasno se vidi proizvod, varijanta i količina

## Primeri

### Primer 1: Šolje sa Različitim Varijantama
```
Šolja_sa_Štampom/
├── Magična_Šolja/
│   └── 2/
│       └── photo_magicna.jpg
├── Obična_Šolja/
│   └── 3/
│       └── photo_obicna.jpg
└── Velika_Šolja/
    └── 1/
        └── photo_velika.jpg
```

**Interpretacija:**
- Magična šolja: 2 primerka
- Obična šolja: 3 primerka
- Velika šolja: 1 primerak

### Primer 2: Kalendari Različitih Formata
```
Fotokalendar/
├── A4/
│   ├── 1/
│   │   ├── photo1.jpg
│   │   └── photo2.jpg
│   └── 5/
│       └── photo3.jpg
└── A3/
    └── 2/
        ├── photo4.jpg
        └── photo5.jpg
```

**Interpretacija:**
- A4 kalendar: 2 različita po 1 primerak + 1 kalendar u 5 primeraka
- A3 kalendar: 2 različita po 2 primerka svaki

### Primer 3: Albumi
```
Album_za_Slike/
├── Mali_Album/
│   └── 1/
│       └── photo_mali.jpg
├── Veliki_Album/
│   └── 3/
│       └── photo_veliki.jpg
└── Premium_Album/
    └── 2/
        └── photo_premium.jpg
```

## Format

### Proizvodi
**Format:** `[Proizvod]/[Varijanta]/[Količina]/photo.jpg`

### Poklon Proizvodi
**Format:** `POKLON_[Proizvod]/[Varijanta]/[Količina]/photo.jpg`

## Implementacija

### Backend - order_utils.py
```python
# Get product name, variant, and quantity
product_name = product.get('productName', 'Unknown').replace(' ', '_')
variant_name = product.get('variantName', 'Default').replace(' ', '_')
quantity = product.get('quantity', 1)

# Create folder structure: ProductName/VariantName/Quantity/photo.jpg
product_folder_name = f"{product_name}/{variant_name}/{quantity}"
```

## Prednosti

### 1. Potpuna Jasnoća
Operater odmah vidi:
- ✅ Koji proizvod (Šolja sa Štampom)
- ✅ Koja varijanta (Magična Šolja)
- ✅ Koliko primeraka (2)

### 2. Lakša Produkcija
Ne mora da otvara order_details.txt da vidi koja je varijanta - sve je u nazivu foldera!

### 3. Skalabilnost
Funkcioniše sa bilo kojim brojem:
- Proizvoda
- Varijanti
- Količina

### 4. Konzistentnost
Ista logika kao za fotografije:
```
Fotografije: Format/Papir/Količina/photo.jpg
Proizvodi:   Proizvod/Varijanta/Količina/photo.jpg
```

## Tehnički Detalji

### Sanitizacija Imena
Svi razmaci se konvertuju u donje crte:
- `Magična Šolja` → `Magična_Šolja`
- `Album za Slike` → `Album_za_Slike`
- `Veliki Album` → `Veliki_Album`

### Fallback za Varijantu
Ako varijanta nije definisana, koristi se `Default`:
```python
variant_name = product.get('variantName', 'Default').replace(' ', '_')
```

## Izmenjeni Fajlovi
- `/app/backend/utils/order_utils.py` - Dodata logika za varijantu

## Testiranje
- ✅ Backend testing subagent potvrdio strukturu
- ✅ Sanitizacija imena radi (razmaci → donje crte)
- ✅ Fallback za missing varijantu (`Default`)
- ✅ Poklon proizvodi takođe imaju varijantu

## Datum Ažuriranja
Decembar 2025
