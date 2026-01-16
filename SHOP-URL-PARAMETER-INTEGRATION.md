# SHOP INTEGRATION - URL Parameter Cart Flow

**Status:** ✅ **IMPLEMENTIERT**  
**Methode:** URL Parameter (Cross-Domain Safe)  
**Datum:** 15. Januar 2026

---

## 🎯 WARUM URL PARAMETER?

**Problem mit localStorage:**
- localStorage ist origin-bound
- Shop (`www.unbreak-one.com`) kann localStorage vom Konfigurator (`unbreak-3-d-konfigurator.vercel.app`) NICHT lesen
- Cross-domain = separate storage

**Lösung:**
- URL Parameter `?cfg=...` überträgt Daten cross-domain
- Shop parst Parameter beim Laden
- Sicher, robust, funktioniert überall

---

## 🔄 FLOW

```
┌─────────────────┐                    ┌──────────────┐
│  KONFIGURATOR   │                    │     SHOP     │
└────────┬────────┘                    └──────┬───────┘
         │                                     │
         │ 1) User konfiguriert               │
         │                                     │
         │ 2) Klick "In den Warenkorb"        │
         │                                     │
         │ 3) Build cartItem Object            │
         │    + JSON.stringify()               │
         │    + base64 encode                  │
         │    + URL encode                     │
         │                                     │
         │ 4) Redirect mit Parameter           │
         │    ?cfg=eyJzb3VyY2UiOi...   ───────>│
         │                                     │
         │                       5) Parse URL param
         │                          decode base64
         │                          parse JSON
         │                          validate schema
         │                                     │
         │                       6) Add to Cart
         │                          (wie normale Produkte)
         │                                     │
         │                       7) Clean URL
         │                          (replaceState)
         │                                     │
         │                       8) User sieht Cart
         │                          kann weiter einkaufen
```

---

## 📦 DATENSTRUKTUR

### Cart Item Object (Konfigurator)

```javascript
const cartItem = {
  source: 'configurator',
  product_id: 'glass_configurator',
  sku: 'UNBREAK-GLAS-CONFIG',
  name: 'Individueller Glashalter',
  quantity: 1,
  price_cents: 3900,  // Integer! Shop recalculates
  currency: 'EUR',
  configured: true,
  
  // CRITICAL v1.1: lang field REQUIRED for Cart/Checkout/Stripe/Emails
  lang: 'de',  // 'de' | 'en'
  
  config: {
    variant: 'glass_holder',
    colors: {
      base: 'ice_blue',
      arm: 'black',
      module: 'silver',
      pattern: 'red'
    },
    finish: 'matte'
  },
  
  // Redundant but safe (fallback)
  meta: {
    lang: 'de',
    source: 'configurator',
    timestamp: '2026-01-16T10:30:00.000Z'
  },
  
  // Legacy field (compatibility)
  locale: 'de',
};
```

**CRITICAL v1.1 Requirements:**
- ✅ `lang` field MUST be present (`'de'` | `'en'`)
- ✅ Used for Cart UI, Checkout UI, Stripe locale, Email language
- ✅ Detection priority: URL `?lang=` → localStorage → HTML lang → default `'de'`
- ✅ `meta.lang` optional redundant fallback

### URL Parameter Format

**Raw JSON:**
```json
{"source":"configurator","product_id":"glass_configurator","sku":"UNBREAK-GLAS-CONFIG",...}
```

**Encoding Steps:**
```javascript
// 1. JSON to String
const json = JSON.stringify(cartItem);

// 2. UTF-8 safe encoding
const utf8 = unescape(encodeURIComponent(json));

// 3. Base64 encode
const base64 = btoa(utf8);

// 4. URL encode (handle +, /, =)
const encoded = encodeURIComponent(base64);
```

**Final URL:**
```
https://www.unbreak-one.com/shop?cfg=eyJzb3VyY2UiOiJjb25maWd1cmF0b3IiLCJwcm9kdWN0X2lkIjoiZ2xhc3NfY29uZmlndXJhdG9yIiwic2t1IjoiVU5CUkVBSy1HTEFTLUNP...&lang=de
```

---

## 🔧 SHOP IMPLEMENTIERUNG (REQUIRED)

### 1. Parse URL Parameter

```javascript
// Shop Page (/shop) - beim Laden ausführen

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const cfg = params.get('cfg');
  
  if (cfg) {
    console.log('[SHOP][CONFIGURATOR_URL] cfg found', { length: cfg.length });
    
    try {
      // Decode: URL -> Base64 -> UTF-8 -> JSON
      const base64 = decodeURIComponent(cfg);
      const utf8 = escape(atob(base64));
      const json = decodeURIComponent(utf8);
      const item = JSON.parse(json);
      
      console.log('[SHOP][CONFIGURATOR_ITEM_PARSED]', item);
      
      // Validate schema
      if (!item?.sku || !Number.isInteger(item?.price_cents) || !item?.quantity) {
        throw new Error('Invalid item schema');
      }
      
      if (!item?.source || item.source !== 'configurator') {
        throw new Error('Invalid source');
      }
      
      // CRITICAL v1.1: Validate lang field
      if (!item?.lang || !['de', 'en'].includes(item.lang)) {
        console.warn('[SHOP][CONFIGURATOR_MISSING_LANG] Fallback required', { item });
        // Fallback to current site language
        item.lang = getCurrentSiteLanguage(); // Must implement
      }
      
      console.log('[SHOP][CONFIGURATOR_LANG_VERIFIED]', { lang: item.lang });
      
      // Normalize for cart
      const normalizedItem = normalizeConfiguratorItem(item);
      
      // Add to cart (same as regular products)
      cart.addItem(normalizedItem);
      
      console.log('[SHOP][CONFIGURATOR_ITEM_ADDED]', normalizedItem);
      
      // Clean URL to prevent double-add on refresh
      params.delete('cfg');
      const cleanUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', cleanUrl);
      
      console.log('[SHOP][URL_CLEANED]');
      
    } catch (error) {
      console.error('[SHOP][CONFIGURATOR_ITEM_ERROR]', error);
      // Don't break page, just log error
    }
  }
}, []);
```

### 2. Normalize Item Function

```javascript
function normalizeConfiguratorItem(item) {
  // Generate unique line key (für mehrere Configs)
  const configHash = hashObject(item.config);
  
  return {
    id: `configurator_${configHash}`,
    productId: item.product_id,
    skuCRITICAL v1.1: lang for Checkout/Stripe/Emails
    lang: item.lang || 'de', // With fallback
    
    // Store configuration as metadata
    metadata: {
      source: 'configurator',
      configured: true,
      config: item.config,
      lang: item.lang, // Redundant but safe
      locale: item.locale,
      timestamp: item.meta?.timestamp || new Date().toISOString()
    currency: item.currency || 'EUR',
    
    // Store configuration as metadata
    metadata: {
      source: 'configurator',
      configured: true,
      config: item.config,
      locale: item.locale,
      timestamp: item.timestamp,
    },
    
    // For display
    thumbnail: getConfiguratorThumbnail(item.config),
    customizable: false, // Already configured
  };
}
```

### 3. Hash Function (für unique ID)

```javascript
function hashObject(obj) {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
```

### 4. Price Recalculation (SECURITY)

```javascript
function calculateConfiguratorPrice(config) {
  // NEVER trust price from URL!
  // Recalculate based on variant
  
  const basePrices = {
    glass_holder: 1990,
    bottle_holder: 1490,
  };
  
  let price = basePrices[config.variant] || 1990;
  
  // Optional: Add surcharge for premium finishes
  if (config.finish === 'glossy') {
    price += 200; // +2.00 EUR
  }
  
  // Optional: Add surcharge for special colors
  // ...
  
  return price; // in cents
}
```

---

## 🛡️ SECURITY & VALIDATION

### Input Validation (MUST)

```javascript
function validateConfiguratorItem(item) {
  // Required fields
  if (!item?.source || item.source !== 'configurator') {
    throw new Error('Invalid source');
  }
  
  if (!item?.sku || typeof item.sku !== 'string') {
    throw new Error('Invalid SKU');
  }
  
  if (!Number.isInteger(item?.quantity) || item.quantity < 1 || item.quantity > 10) {
    throw new Error('Invalid quantity');
  }
  
  if CRITICAL v1.1: Validate lang field
  if (!item?.lang || !['de', 'en'].includes(item.lang)) {
    throw new Error('Invalid or missing lang field');
  }
  
  // (!Number.isInteger(item?.price_cents) || item.price_cents < 0) {
    throw new Error('Invalid price');
  }
  
  // Validate config structure
  if (!item?.config || typeof item.config !== 'object') {
    throw new Error('Invalid config');
  }
  
  const allowedVariants = ['glass_holder', 'bottle_holder'];
  if (!allowedVariants.includes(item.config.variant)) {
    throw new Error('Invalid variant');
  }
  
  const requiredColorKeys = ['base', 'arm', 'module', 'pattern'];
  const hasAllColors = requiredColorKeys.every(key => item.config.colors?.[key]);
  if (!hasAllColors) {
    throw new Error('Invalid colors');
  }
  
  const allowedFinishes = ['matte', 'glossy'];
  if (!allowedFinishes.includes(item.config.finish)) {
    throw new Error('Invalid finish');
  }
  
  return true;
}
```

### Price Security

```javascript
// NEVER use item.price_cents directly
// ALWAYS recalculate server-side or client-side

const trustedPrice = calculateConfiguratorPrice(item.config);

// Ignore item.price_cents from URL
```

---

## 📏 URL LENGTH PROTECTION

### Check & Fallback

```javascript
// Konfigurator Code (bereits implementiert)

const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(json))));

if (encoded.length > 1500) {
  console.warn('[CFG][URL_TOO_LONG] Fallback required');
  
  // Fallback Option 1: Backend Session
  const sessionId = await saveToBackend(cartItem);
  window.location.href = `https://www.unbreak-one.com/shop?cfgSession=${sessionId}`;
  
  // Shop muss dann sessionId auslesen und Backend abfragen
}
```

### Backend Session Fallback (Optional)

**Konfigurator:**
```javascript
async function saveToBackend(cartItem) {
  const response = await fetch('https://www.unbreak-one.com/api/config-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartItem }),
  });
  
  const { sessionId } = await response.json();
  return sessionId;
}
```

**Shop:**
```javascript
const cfgSession = params.get('cfgSession');

if (cfgSession) {
  const response = await fetch(`/api/config-session/${cfgSession}`);
  const { cartItem } = await response.json();
  
  cart.addItem(normalizeConfiguratorItem(cartItem));
  
  // Delete session
  await fetch(`/api/config-session/${cfgSession}`, { method: 'DELETE' });
}
```

---

## 🧪 TESTING

### 1. Console Output Expected

**Konfigurator:**
```javascript
[CFG][ADD_TO_CART_START]
[CFG][CART_ITEM_BUILT] { source: "configurator", ... }
[CFG][ENCODED_LEN] 847
[CFG][REDIRECT_TO_SHOP] https://www.unbreak-one.com/shop?cfg=eyJ...&lang=de
```

**Shop:**
```javascript
[SHOP][CONFIGURATOR_URL] cfg found { length: 847 }
[SHOP][CONFIGURATOR_ITEM_PARSED] { source: "configurator", ... }
[SHOP][CONFIGURATOR_ITEM_ADDED] { id: "configurator_a3f2b1", ... }
[SHOP][URL_CLEANED]
```

### 2. Test Cases (REQUIRED)

#### Test 1: Basic Flow
1. ✅ Konfigurator öffnen
2. ✅ Produkt konfigurieren
3. ✅ "In den Warenkorb" klicken
4. ✅ Redirect zu Shop mit `?cfg=...`
5. ✅ Item erscheint im Cart
6. ✅ URL wird bereinigt (kein `?cfg`)

#### Test 2: Multi-Item Cart
1. ✅ Konfigurator Item hinzufügen (siehe Test 1)
2. ✅ Normal Shop-Produkt hinzufügen
3. ✅ Cart zeigt beide Items
4. ✅ Checkout möglich

#### Test 3: No Double-Add
1. ✅ Konfigurator Item hinzufügen
2. ✅ Page refresh (F5)
3. ✅ Item ist NUR EINMAL im Cart
4. ✅ URL zeigt kein `?cfg` Parameter

#### Test 4: Long Config (Fallback)
1. ✅ Sehr komplexe Config erstellen
2. ✅ Wenn URL > 1500 chars: Backend Session
3. ✅ Redirect mit `?cfgSession=...`
4. ✅ Shop lädt von Backend
5. ✅ Item im Cart

---

## 📸 REQUIRED DELIVERABLES

### 1. Screenshots

- [ ] Konfigurator Console Log
- [ ] Shop Console Log
- [ ] Cart UI mit konfiguriertem Item
- [ ] Cart UI mit konfiguriertem + normalem Item

### 2. Code

- [ ] Shop-seitige Parameter-Parsing Implementierung
- [ ] normalizeConfiguratorItem() Funktion
- [ ] validateConfiguratorItem() Funktion
- [ ] calculateConfiguratorPrice() Funktion

### 3. Tests

- [ ] Test 1-4 durchgeführt
- [ ] Screenshots für jeden Test
- [ ] Logs kopiert

---

## 🔗 PRODUCT CATALOG INTEGRATION

### Option A: Dummy Product (RECOMMENDED)

**Im Shop-Katalog anlegen:**

```
Product: Configurator Glass Holder
SKU: UNBREAK-GLAS-CONFIG
Price: €19.90 (base price)
Description: Individualized glass holder
Category: Configurator
```

**Im Cart:**
- Base Product aus Katalog
- Preis wird überschrieben
- Metadata enthält Config

### Option B: Custom Line Items

**Cart erlaubt "custom" Items:**

```javascript
cart.addCustomItem({
  name: 'Individueller Glashalter',
  price: 1990,
  quantity: 1,
  metadata: { ... }
});
```

Benötigt Cart-System Anpassung.

---

## ❌ VERBOTE

- ❌ Kein Stripe-Redirect aus Konfigurator
- ❌ Kein localStorage für cross-domain
- ❌ Kein postMessage
- ❌ Keine Sonder-Checkout-Flows
- ❌ URL Parameter NICHT für Preis vertrauen (recalculate!)

---

## ✅ DEFINITION OF DONE

1. ✅ Konfigurator sendet `?cfg=...` Parameter
2. ✅ Shop parsed und validiert Parameter
3. ✅ Item erscheint im Cart wie normale Produkte
4. ✅ Checkout nur über Warenkorb
5. ✅ URL wird nach Add bereinigt (kein Double-Add)
6. ✅ Multi-Item Cart funktioniert
7. ✅ Console Logs vorhanden
8. ✅ Tests 1-4 bestanden
9. ✅ Fallback für lange URLs (optional)
10. ✅ Canonical Domain: https://www.unbreak-one.com

---

## 🚀 DEPLOYMENT

**Konfigurator:** ✅ Implementiert (Commit: pending)  
**Shop:** ⏳ Muss implementiert werden (siehe oben)

**Test URL:**
```
https://www.unbreak-one.com/shop?cfg=eyJzb3VyY2UiOiJjb25maWd1cmF0b3IiLCJwcm9kdWN0X2lkIjoiZ2xhc3NfY29uZmlndXJhdG9yIiwic2t1IjoiVU5CUkVBSy1HTEFTLUNPT0ZJRyIsIm5hbWUiOiJJbmRpdmlkdWVsbGVyIEdsYXNoYWx0ZXIiLCJxdWFudGl0eSI6MSwicHJpY2VfY2VudHMiOjE5OTAsImN1cnJlbmN5IjoiRVVSIiwiY29uZmlndXJlZCI6dHJ1ZSwiY29uZmlnIjp7InZhcmlhbnQiOiJnbGFzc19ob2xkZXIiLCJjb2xvcnMiOnsiYmFzZSI6ImljZV9ibHVlIiwiYXJtIjoiYmxhY2siLCJtb2R1bGUiOiJzaWx2ZXIiLCJwYXR0ZXJuIjoicmVkIn0sImZpbmlzaCI6Im1hdHRlIn0sImxvY2FsZSI6ImRlIiwidGltZXN0YW1wIjoxNzM2OTY2MTIzNDU2fQ==&lang=de
```

Decoded:
```json
{
  "source": "configurator",
  "product_id": "glass_configurator",
  "sku": "UNBREAK-GLAS-CONFIG",
  "name": "Individueller Glashalter",
  "quantity": 1,
  "price_cents": 1990,
  "currency": "EUR",
  "configured": true,
  "config": {
    "variant": "glass_holder",
    "colors": {
      "base": "ice_blue",
      "arm": "black",
      "module": "silver",
      "pattern": "red"
    },
    "finish": "matte"
  },
  "locale": "de",
  "timestamp": 1736966123456
}
```
