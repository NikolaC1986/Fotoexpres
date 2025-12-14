# Ispravka: Poručivanje Samo Proizvoda (Bez Fotografija)

## Problem
Korisnici nisu mogli da poruče samo proizvod (npr. Album za slike) bez takođe poručivanja standardnih fotografija za štampu. Sistem je izbacivao grešku: "Nedozvoljen tip fajla: .txt"

## Uzrok
Frontend je pokušavao da pošalje dummy `.txt` fajl da zadovolji backend zahtev za `photos` parametar. Backend je validirao tipove fajlova i odbacivao `.txt` fajl, što je blokiralo porudžbinu.

## Rešenje

### 1. Backend Izmene

#### `/app/backend/server.py`
- **Linija 120**: Promenjen parametar `photos` da bude opcioni sa default praznom listom
  ```python
  # Staro: photos: List[UploadFile] = File(...)
  # Novo: photos: List[UploadFile] = File(default=[])
  ```

- **Dodata validacija**: Provera da narudžbina ima ili fotografije ili proizvode
  ```python
  if len(photos) == 0 and len(products) == 0:
      raise HTTPException(
          status_code=400,
          detail="Porudžbina mora da sadrži ili fotografije ili proizvode"
      )
  ```

#### `/app/backend/models/order.py`
- **Linija 34**: `photoSettings` učinjeno opcionalnim
  ```python
  # Staro: photoSettings: List[PhotoSetting]
  # Novo: photoSettings: Optional[List[PhotoSetting]] = []
  ```

- **Linija 42**: Isto za `Order` model

#### `/app/backend/utils/order_utils.py`
- **Dodati null chekovi** za prazne `photo_settings` liste
- **Linija 62-79**: Dodato uslov `if photo_settings and len(photo_settings) > 0`
- **Linija 260-276**: Dodato provera pre iteracije kroz fotografije
- **Linija 286-295**: Dodato provera pre kreiranja ZIP strukture

### 2. Frontend Izmene

#### `/app/frontend/src/components/UploadPage.jsx`
- **Linija 527-528**: Uklonjen dummy `.txt` fajl
  ```javascript
  // Staro:
  const dummyBlob = new Blob([''], { type: 'text/plain' });
  formData.append('photos', dummyBlob, 'no_photos.txt');
  
  // Novo:
  // No photos needed - backend now accepts empty photos array
  ```

## Rezultat Testiranja

✅ **Testiranje uspešno** (Frontend Testing Agent)
- Korisnik može naručiti samo proizvode
- Greška "Morate dodati bar jednu fotografiju za štampu" se više ne pojavljuje
- Porudžbina se uspešno kreira u bazi
- ZIP fajl se kreira sa samo `order_details.txt` i proizvodima

## Testiranje Scenarija
1. Idi na `/upload` stranicu
2. Selektuj proizvod (npr. Album za slike)
3. Dodaj u korpu
4. Popuni kontakt informacije
5. **NE uploaduj fotografije**
6. Submituj porudžbinu
7. ✅ Porudžbina uspešno kreirana

## Datum Ispravke
Decembar 2025
