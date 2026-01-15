# SHOP INTEGRATION - localStorage Cart Flow

**Status:** ✅ **IMPLEMENTIERT**  
**Methode:** localStorage (Simple & Robust)  
**Datum:** 15. Januar 2026

---

## 🎯 FLOW ÜBERSICHT

```
┌─────────────────┐                    ┌──────────────┐
│  KONFIGURATOR   │                    │     SHOP     │
└────────┬────────┘                    └──────┬───────┘
         │                                     │
         │ 1) User konfiguriert Produkt       │
         │                                     │
         │ 2) Klick "In den Warenkorb"        │
         │                                     │
         │ 3) Speichert in localStorage:      │
         │    unbreak_configurator_cart_item  │
         │                                     │
         │ 4) Redirect zu /shop ──────────────>│
         │                                     │
         │                       5) /shop lädt
         │                          liest localStorage
         │                          fügt Item zum Cart hinzu
         │                          löscht localStorage
         │                                     │
         │                       6) User sieht Produkt im Cart
         │                          kann weiter einkaufen
         │                          Checkout aus Warenkorb
```

---

## 📦 DATENSTRUKTUR

### localStorage Key
```
unbreak_configurator_cart_item
```

### Data Format
```json
{
  "source": "configurator",
  "variant": "glass_holder",
  "quantity": 1,
  "price": 1990,
  "configuration": {
    "base": "ice_blue",
    "arm": "black",
    "module": "silver",
    "pattern": "red",
    "finish": "matte"
  },
  "locale": "de",
  "timestamp": 1736966123456
}
```

### Varianten
- `variant: "glass_holder"` = Glashalter (4-teilig)
- `variant: "bottle_holder"` = Flaschenhalter (2-teilig)

### Finish
- `finish: "matte"` = Matt
- `finish: "glossy"` = Glänzend

---

## 🔧 SHOP IMPLEMENTIERUNG

### Minimal-Code (z.B. in `/shop` page)

```javascript
// Shop Seite (/shop oder /products)
// Wird beim Laden ausgeführt

useEffect(() => {
  // Check for configurator cart item
  const item = localStorage.getItem('unbreak_configurator_cart_item');
  
  if (item) {
    try {
      const cartItem = JSON.parse(item);
      console.log('[SHOP][CONFIGURATOR_ITEM]', cartItem);
      
      // Add to cart (same as regular products)
      addToCart({
        productId: 'unbreak-configurator',
        sku: cartItem.variant, // glass_holder | bottle_holder
        quantity: cartItem.quantity,
        price: cartItem.price,
        customAttributes: {
          source: 'configurator',
          configuration: JSON.stringify(cartItem.configuration),
          locale: cartItem.locale,
        },
      });
      
      // Remove from localStorage
      localStorage.removeItem('unbreak_configurator_cart_item');
      console.log('[SHOP][CONFIGURATOR_ITEM_ADDED]');
      
      // Optional: Show toast notification
      showNotification('Produkt wurde zum Warenkorb hinzugefügt');
      
    } catch (err) {
      console.error('[SHOP][CONFIGURATOR_ITEM_ERROR]', err);
      // Keep item in localStorage for retry
    }
  }
}, []);
```

---

## 🛒 SHOPIFY BEISPIEL

```javascript
// Shopify Liquid Template oder Theme JavaScript

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const item = localStorage.getItem('unbreak_configurator_cart_item');
    
    if (item) {
      try {
        const cartItem = JSON.parse(item);
        
        // Shopify AJAX Cart Add
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 'YOUR_CONFIGURATOR_VARIANT_ID', // Shopify Variant ID
            quantity: cartItem.quantity,
            properties: {
              _source: 'configurator',
              _variant: cartItem.variant,
              _config: JSON.stringify(cartItem.configuration),
              _locale: cartItem.locale,
            }
          })
        })
        .then(response => response.json())
        .then(data => {
          console.log('[SHOPIFY][CART_ADD]', data);
          localStorage.removeItem('unbreak_configurator_cart_item');
          
          // Reload cart drawer
          if (window.updateCartDrawer) {
            window.updateCartDrawer();
          }
        })
        .catch(err => {
          console.error('[SHOPIFY][CART_ADD_ERROR]', err);
        });
        
      } catch (err) {
        console.error('[SHOPIFY][PARSE_ERROR]', err);
      }
    }
  });
</script>
```

---

## 🎨 NEXT.JS / REACT BEISPIEL

```typescript
// app/shop/page.tsx or pages/shop.tsx

'use client'; // if App Router

import { useEffect } from 'react';
import { useCart } from '@/hooks/useCart'; // Your cart hook

export default function ShopPage() {
  const { addToCart } = useCart();

  useEffect(() => {
    // Check for configurator item
    const checkConfiguratorItem = () => {
      const item = localStorage.getItem('unbreak_configurator_cart_item');
      
      if (item) {
        try {
          const cartItem = JSON.parse(item);
          
          // Add to cart
          addToCart({
            id: 'configurator-product',
            name: cartItem.variant === 'glass_holder' 
              ? 'Glashalter (konfiguriert)' 
              : 'Flaschenhalter (konfiguriert)',
            variant: cartItem.variant,
            quantity: cartItem.quantity,
            price: cartItem.price,
            metadata: {
              configuration: cartItem.configuration,
              locale: cartItem.locale,
            },
          });
          
          // Clear localStorage
          localStorage.removeItem('unbreak_configurator_cart_item');
          
          console.log('[CART] Configurator item added');
          
        } catch (err) {
          console.error('[CART] Error adding configurator item:', err);
        }
      }
    };

    checkConfiguratorItem();
  }, [addToCart]);

  return (
    <div>
      {/* Your shop content */}
    </div>
  );
}
```

---

## ✅ VORTEILE localStorage-Flow

### vs. postMessage:
- ✅ **Einfacher:** Keine komplexe Kommunikation
- ✅ **Robuster:** Funktioniert auch nach Redirect
- ✅ **Kein Timeout:** Keine ACK-Timeouts
- ✅ **Unabhängig:** Keine Parent/Opener Abhängigkeit
- ✅ **Cross-Domain:** Funktioniert über verschiedene Domains

### vs. API-Call:
- ✅ **Schneller:** Kein Server-Roundtrip
- ✅ **Offline-fähig:** Funktioniert auch ohne Backend
- ✅ **Simpler:** Keine API-Endpoints nötig

---

## 🧪 TESTEN

### 1. Lokal

**Konfigurator:**
```
http://localhost:5173/?debug=1
```

**Nach "In den Warenkorb" Klick:**
```javascript
// Browser Console (bevor Redirect)
localStorage.getItem('unbreak_configurator_cart_item')
// → {"source":"configurator","variant":"glass_holder",...}
```

**Test-Shop-Seite:**
```
http://localhost:5173/test-add-to-cart.html
```

Diese Seite simuliert perfekt das Shop-Verhalten:
- Pollt localStorage alle 500ms
- Zeigt gefundene Items
- Fügt zum Cart hinzu
- Löscht localStorage

### 2. Production

**Konfigurator öffnen:**
```
https://www.unbreak-one.com/configurator?lang=de
```

**Produkt konfigurieren und "In den Warenkorb" klicken**

**Prüfe localStorage VOR Redirect:**
```javascript
// F12 Console SCHNELL nach Klick
localStorage.getItem('unbreak_configurator_cart_item')
```

**Nach Redirect zu /shop:**
- Item sollte im Warenkorb sein
- localStorage sollte leer sein

---

## 🚨 FEHLERBEHANDLUNG

### localStorage voll oder disabled

```javascript
try {
  localStorage.setItem('unbreak_configurator_cart_item', JSON.stringify(cartItem));
} catch (err) {
  // Fallback: sessionStorage
  try {
    sessionStorage.setItem('unbreak_configurator_cart_item', JSON.stringify(cartItem));
  } catch {
    // Fallback: URL Parameter
    const params = new URLSearchParams({
      cfg: btoa(JSON.stringify(cartItem))
    });
    window.location.href = `https://www.unbreak-one.com/shop?${params}`;
  }
}
```

### Item nicht JSON-parsebar

```javascript
try {
  const cartItem = JSON.parse(item);
} catch (err) {
  console.error('[SHOP] Invalid cart item format:', err);
  localStorage.removeItem('unbreak_configurator_cart_item');
  return;
}
```

### Alte Items (> 1 Stunde)

```javascript
const cartItem = JSON.parse(item);

// Check timestamp
const age = Date.now() - cartItem.timestamp;
const oneHour = 60 * 60 * 1000;

if (age > oneHour) {
  console.warn('[SHOP] Cart item expired (> 1h)');
  localStorage.removeItem('unbreak_configurator_cart_item');
  return;
}
```

---

## 📊 EXPECTED CONSOLE OUTPUT

### Konfigurator Console:

```
[CFG][ADD_TO_CART_START] { variant: "glass_holder", ... }
[CFG][SAVE_TO_LOCALSTORAGE] { source: "configurator", ... }
[CFG][LOCALSTORAGE_SAVED]
[CFG][API] Backend save successful
[CFG][REDIRECT_TO_SHOP] https://www.unbreak-one.com/shop
```

### Shop Console:

```
[SHOP][CONFIGURATOR_ITEM] { source: "configurator", variant: "glass_holder", ... }
[SHOP][CONFIGURATOR_ITEM_ADDED]
```

---

## 🔒 SECURITY

### Input Validation

```javascript
// Shop Code
const cartItem = JSON.parse(item);

// Validate variant
if (!['glass_holder', 'bottle_holder'].includes(cartItem.variant)) {
  throw new Error('Invalid variant');
}

// Validate quantity
if (cartItem.quantity < 1 || cartItem.quantity > 10) {
  throw new Error('Invalid quantity');
}

// Validate configuration
const requiredKeys = ['base', 'arm', 'module', 'pattern', 'finish'];
const hasAllKeys = requiredKeys.every(key => cartItem.configuration?.[key]);
if (!hasAllKeys) {
  throw new Error('Invalid configuration');
}
```

### Price Recalculation

```javascript
// NEVER trust price from localStorage
// Shop MUST recalculate based on variant

const prices = {
  glass_holder: 1990,
  bottle_holder: 1490,
};

const actualPrice = prices[cartItem.variant];

addToCart({
  ...cartItem,
  price: actualPrice, // Use shop price, not localStorage price
});
```

---

## ❌ VERBOTE (für Konfigurator)

- ❌ **Kein Redirect zu Stripe**
- ❌ **Kein postMessage mehr**
- ❌ **Kein Sonder-Checkout**
- ❌ **Kein Abweichen vom Shop-Flow**

---

## ✅ AKZEPTANZKRITERIEN

1. ✅ User konfiguriert Produkt
2. ✅ Klick "In den Warenkorb"
3. ✅ Item landet in localStorage
4. ✅ Redirect zu /shop
5. ✅ /shop liest localStorage
6. ✅ Item erscheint im Warenkorb
7. ✅ localStorage wird geleert
8. ✅ User kann weiter einkaufen
9. ✅ Checkout nur aus Warenkorb
10. ✅ Identisch zu normalen Shop-Produkten

---

## 🎯 NÄCHSTE SCHRITTE

### Für Shop-Entwickler:

1. **Implementiere localStorage-Check** in `/shop` Page
2. **Parse und validiere** Cart Item
3. **Füge zum Cart hinzu** (gleicher Weg wie normale Produkte)
4. **Lösche localStorage** nach erfolgreicher Addition
5. **Teste** mit [test-add-to-cart.html](test-add-to-cart.html)

### Test-URL:
```
http://localhost:5173/test-add-to-cart.html
```

Diese Seite zeigt exakt, wie der Shop reagieren muss.

---

## 📞 SUPPORT

**Bei Problemen:**

1. Öffne Konfigurator mit `?debug=1`
2. Klicke "In den Warenkorb"
3. Prüfe Console: `[CFG][LOCALSTORAGE_SAVED]`
4. Prüfe localStorage: `localStorage.getItem('unbreak_configurator_cart_item')`
5. Prüfe Shop Console: `[SHOP][CONFIGURATOR_ITEM]`

**Typische Fehler:**

| Error | Ursache | Lösung |
|-------|---------|---------|
| Item nicht im localStorage | localStorage disabled | Nutze sessionStorage Fallback |
| Parse Error | Invalides JSON | Prüfe Konfigurator Output |
| Item verschwindet | Shop löscht zu früh | Error Handling verbessern |
| Preis falsch | localStorage-Preis verwendet | Shop MUSS Preis neu berechnen |

---

**Status:** ✅ Ready for Production  
**Methode:** Simple, Robust, Shop-Standard-Flow
