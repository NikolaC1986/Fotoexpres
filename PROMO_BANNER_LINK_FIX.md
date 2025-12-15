# Ispravka: Reklamni Baner Link - Automatsko Dodavanje Protokola

## Problem
Kada korisnik unese URL bez protokola (npr. `www.google.com`), klik na baner ne vodi na eksterni sajt. Umesto toga, browser tretira URL kao relativan i kreira loš link strukture:
```
https://snapprint-9.preview.emergentagent.com/www.google.com
```

## Uzrok
Anchor tag (`<a>`) u HTML-u zahteva potpun URL sa protokolom (`http://` ili `https://`). Ako protokol nedostaje, browser tretira href kao relativan put u odnosu na trenutnu stranicu.

**Primer problema:**
- Korisnik unese: `www.google.com`
- Browser kreira: `https://preview-site.com/www.google.com` ❌
- Umesto: `https://www.google.com` ✅

## Rešenje

### Frontend - PromoBanner.jsx
Dodao sam logiku koja automatski dodaje `https://` protokol ako URL ne počinje sa `http://` ili `https://`:

```javascript
// If has link, wrap in anchor tag
if (banner.linkUrl) {
  // Ensure URL has protocol (add https:// if missing)
  let fullUrl = banner.linkUrl;
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    fullUrl = `https://${fullUrl}`;
  }
  
  return (
    <section className="py-6 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-90 transition-opacity cursor-pointer"
        >
          <BannerContent />
        </a>
      </div>
    </section>
  );
}
```

### Admin Panel - AdminPromoBanner.jsx
Ažurirao sam pomoćni tekst da objasni korisnicima da mogu uneti URL sa ili bez protokola:

```jsx
<p className="text-sm text-gray-500 mt-2">
  💡 <strong>Savet:</strong> Možete uneti URL sa ili bez protokola. Primeri:
</p>
<ul className="text-sm text-gray-500 mt-1 ml-4 list-disc">
  <li>https://www.example.com/promocija</li>
  <li>www.example.com (automatski će biti dodato https://)</li>
</ul>
```

## Testiranje

### Test 1: URL bez protokola
**Unos:** `www.google.com`
**Rezultat:** Link postaje `https://www.google.com` ✅

### Test 2: URL sa protokolom
**Unos:** `https://www.facebook.com`
**Rezultat:** Link ostaje `https://www.facebook.com` ✅

### Test 3: URL sa http://
**Unos:** `http://www.example.com`
**Rezultat:** Link ostaje `http://www.example.com` ✅

## Izmenjeni Fajlovi
1. `/app/frontend/src/components/PromoBanner.jsx` - Dodao automatsko dodavanje protokola
2. `/app/frontend/src/components/AdminPromoBanner.jsx` - Ažurirao pomoćni tekst

## Primeri Korišćenja

### Scenario 1: Google reklama
- Admin unese: `www.google.com`
- Sistem generiše: `https://www.google.com`
- Korisnik klikne na baner → otvara se Google u novom tab-u ✅

### Scenario 2: Facebook Event
- Admin unese: `facebook.com/events/12345`
- Sistem generiše: `https://facebook.com/events/12345`
- Korisnik klikne na baner → otvara se Facebook event ✅

### Scenario 3: Sopstvena stranica promocije
- Admin unese: `https://fotoexpres.rs/zimska-akcija`
- Sistem koristi: `https://fotoexpres.rs/zimska-akcija` (bez izmene)
- Korisnik klikne na baner → otvara se promocija ✅

## Bezbednosni Aspekti
- `target="_blank"`: Otvara link u novom tab-u
- `rel="noopener noreferrer"`: Sprečava sigurnosne ranjivosti sa `window.opener`
- Automatsko dodavanje `https://`: Koristi siguran protokol po default-u

## Datum Ispravke
Decembar 2025
