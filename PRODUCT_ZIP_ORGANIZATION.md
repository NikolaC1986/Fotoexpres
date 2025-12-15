# Organizacija Proizvoda u ZIP Fajlu

## Problem
Kada korisnik poruči više istih proizvoda sa različitim fotografijama (npr. 3 kalendara sa različitim slikama), bilo je teško razlikovati koji fajl pripada kom proizvodu. Proizvodi su bili organizovani kao:
```
PROIZVOD_1_Fotokalendar/
  photo1.jpg
PROIZVOD_2_Fotokalendar/
  photo2.jpg
```

## Rešenje
Proizvodi su sada organizovani po **nazivu proizvoda** i **količini**, slično kao fotografije:

### Nova Struktura ZIP Fajla

```
order_12345.zip
├── order_details.txt
├── Fotografije (ako postoje)
│   ├── 10x15/
│   │   ├── sjajni/
│   │   │   ├── 5/
│   │   │   │   └── photo1.jpg
│   │   │   └── 10/
│   │   │       └── photo2.jpg
│   │   └── mat/
│   │       └── 3/
│   │           └── photo3.jpg
├── Fotokalendar/
│   ├── 1/
│   │   └── photo_kalendar_1.jpg
│   ├── 2/
│   │   └── photo_kalendar_2.jpg
│   └── 1/
│       └── photo_kalendar_3.jpg
├── Šolja_sa_Štampom/
│   └── 3/
│       └── photo_solja.jpg
└── POKLON_Magnet/ (ako postoje poklon proizvodi)
    └── 1/
        └── photo_magnet.jpg
```

## Organizaciona Logika

### Proizvodi
**Format:** `[Naziv Proizvoda]/[Količina]/[fotografija.jpg]`

**Primeri:**
- `Fotokalendar/1/photo1.jpg` - 1 kalendar
- `Fotokalendar/2/photo2.jpg` - 2 kalendara sa istom fotografijom
- `Šolja_sa_Štampom/3/photo_solja.jpg` - 3 šolje

### Poklon Proizvodi
**Format:** `POKLON_[Naziv Proizvoda]/[Količina]/[fotografija.jpg]`

**Primeri:**
- `POKLON_Magnet/1/photo1.jpg`
- `POKLON_Privezak/2/photo2.jpg`

### Fotografije za Štampu
**Format:** `[Format]/[Papir]/[Količina]/[fotografija.jpg]`

**Primeri:**
- `10x15/sjajni/5/photo1.jpg` - 5 kopija 10x15cm na sjajnom papiru
- `13x18/mat/10/photo2.jpg` - 10 kopija 13x18cm na mat papiru

## Prednosti Nove Strukture

### 1. Jasna Identifikacija Proizvoda
- **Pre:** `PROIZVOD_1_Fotokalendar`, `PROIZVOD_2_Fotokalendar`, `PROIZVOD_3_Fotokalendar`
- **Sada:** `Fotokalendar/1`, `Fotokalendar/2`, `Fotokalendar/1`
- ✅ Odmah se vidi koliko primeraka treba odštampati

### 2. Lakša Produkcija
Operater može brzo da identifikuje:
- Koji proizvod treba napraviti
- Koliko primeraka tog proizvoda
- Koja fotografija ide na svaki primerak

### 3. Skalabilnost
Ako korisnik poruči:
- 3 kalendara sa različitim slikama (1 primerak svaki)
- 2 šolje sa istom slikom (2 primerka)
- 5 magneta sa različitim slikama (1 primerak svaki)

Struktura će biti:
```
Fotokalendar/1/photo1.jpg
Fotokalendar/1/photo2.jpg
Fotokalendar/1/photo3.jpg
Šolja_sa_Štampom/2/photo_solja.jpg
Magnet/1/photo_magnet_1.jpg
Magnet/1/photo_magnet_2.jpg
Magnet/1/photo_magnet_3.jpg
Magnet/1/photo_magnet_4.jpg
Magnet/1/photo_magnet_5.jpg
```

### 4. Konzistentna Logika
Isti princip organizacije za:
- ✅ Fotografije za štampu
- ✅ Proizvodi
- ✅ Poklon proizvodi

## Implementacija

### Backend - order_utils.py

```python
# Add product-specific photos if any
if products:
    product_photos_dir = os.path.join(order_dir, 'product_photos')
    if os.path.exists(product_photos_dir):
        for product_idx, product in enumerate(products):
            if product.get('photoFileNames'):
                # Get product name and quantity
                product_name = product.get('productName', 'Unknown').replace(' ', '_')
                quantity = product.get('quantity', 1)
                
                # Create folder structure: ProductName/Quantity/photo.jpg
                product_folder_name = f"{product_name}/{quantity}"
                
                for photo_name in product.get('photoFileNames', []):
                    product_photo_path = os.path.join(product_photos_dir, f"product_{product_idx}_{photo_name}")
                    if os.path.exists(product_photo_path):
                        archive_path = f"{product_folder_name}/{photo_name}"
                        zipf.write(product_photo_path, archive_path)
```

## Izmenjeni Fajlovi
- `/app/backend/utils/order_utils.py` - Ažurirana logika za kreiranje ZIP strukture

## Scenario Primer

### Narudžbina:
- 5x Fotokalendar (svaki sa drugom fotografijom, 1 primerak)
- 1x Šolja sa Štampom (2 primerka iste šolje)
- 10x foto 10x15cm sjajni papir (3 primerka svake)

### Rezultujuća ZIP Struktura:
```
order_00123.zip
├── order_details.txt
├── 10x15/
│   └── sjajni/
│       └── 3/
│           ├── photo1.jpg
│           ├── photo2.jpg
│           ├── photo3.jpg
│           ├── photo4.jpg
│           ├── photo5.jpg
│           ├── photo6.jpg
│           ├── photo7.jpg
│           ├── photo8.jpg
│           ├── photo9.jpg
│           └── photo10.jpg
├── Fotokalendar/
│   └── 1/
│       ├── kalendar_photo1.jpg
│       ├── kalendar_photo2.jpg
│       ├── kalendar_photo3.jpg
│       ├── kalendar_photo4.jpg
│       └── kalendar_photo5.jpg
└── Šolja_sa_Štampom/
    └── 2/
        └── solja_photo.jpg
```

**Interpretacija:**
- 10 fotografija 10x15cm → svaka u 3 primerka na sjajnom papiru
- 5 kalendara → svaki u 1 primerku
- 1 šolja → 2 primerka

## Datum Implementacije
Decembar 2025
