# SHOP LISTENER - IMPLEMENTIERUNGSANLEITUNG

**Konfigurator Commit:** `5e19613`  
**Status:** ✅ Ready for Shop Integration  
**Datum:** 15. Januar 2026

---

## 🎯 WAS DER SHOP EMPFANGEN MUSS

### Message Format (vom Konfigurator)

```javascript
{
  type: 'ADD_TO_CART',
  requestId: 'cfg_1736966123456_a1b2c3d4e5f6',
  payload: {
    variant: 'glass_holder',        // oder 'bottle_holder'
    quantity: 1,
    locale: 'de',                   // oder 'en'
    colors: {
      base: 'purple',
      arm: 'red',
      module: 'ice_blue',
      pattern: 'black'
    },
    finish: 'matte',                // oder 'glossy'
    configSessionId: 'abc-123',     // optional, kann null sein
    priceCents: 0,                  // Shop berechnet Preis
    returnUrl: 'https://www.unbreak-one.com/shop'
  },
  source: 'UNBREAK-ONE_CONFIGURATOR',
  ts: 1736966123456
}
```

---

## 🔧 SHOP LISTENER IMPLEMENTIERUNG

### Minimal-Implementierung (z.B. in `_app.tsx` oder `layout.tsx`)

```typescript
// Shop Code (www.unbreak-one.com)
// Listener MUSS global sein, nicht nur in Admin/Configurator-Route

useEffect(() => {
  function handleConfiguratorMessage(event: MessageEvent) {
    // CRITICAL: Origin Check
    const allowedOrigins = [
      'https://unbreak-3-d-konfigurator.vercel.app',
      'http://localhost:5173', // nur für Development
    ];

    if (!allowedOrigins.includes(event.origin)) {
      console.warn('[SHOP][BLOCKED]', event.origin);
      return;
    }

    const data = event.data;
    if (!data || typeof data !== 'object') return;

    // Handle ADD_TO_CART
    if (data.type === 'ADD_TO_CART') {
      console.log('[SHOP][ADD_TO_CART_RECEIVED]', data);

      const { requestId, payload } = data;

      try {
        // Add to cart (Shopify/Commerce.js/Custom)
        addProductToCart({
          productId: 'unbreak-configurator',
          sku: payload.variant,
          quantity: payload.quantity,
          customAttributes: {
            variant: payload.variant,
            colors: JSON.stringify(payload.colors),
            finish: payload.finish,
            locale: payload.locale,
            configSessionId: payload.configSessionId,
          },
        });

        console.log('[SHOP][CART_ADDED]', { variant: payload.variant, quantity: payload.quantity });

        // CRITICAL: Send ACK zurück
        const ack = {
          type: 'ADD_TO_CART_ACK',
          requestId: requestId, // MUSS matchen!
          ok: true,
          cartCount: getCartItemCount(), // Aktuelle Anzahl Items
        };

        // CRITICAL: event.source ist der Konfigurator, event.origin ist dessen Origin
        event.source?.postMessage(ack, event.origin);
        console.log('[SHOP][ACK_SENT]', ack);

        // Optional: Zeige Cart Drawer
        showCartDrawer();

      } catch (error) {
        console.error('[SHOP][ADD_TO_CART_ERROR]', error);

        // Send error ACK
        const errorAck = {
          type: 'ADD_TO_CART_ACK',
          requestId: requestId,
          ok: false,
          error: error.message || 'Fehler beim Hinzufügen',
        };

        event.source?.postMessage(errorAck, event.origin);
      }
    }
  }

  window.addEventListener('message', handleConfiguratorMessage);

  console.log('[SHOP][LISTENER_READY]', { origin: window.location.origin });

  return () => {
    window.removeEventListener('message', handleConfiguratorMessage);
  };
}, []);
```

---

## 🧪 TESTEN

### 1. Lokal (Development)

**Shop:**
```bash
# Shop auf localhost:3000 starten
npm run dev
```

**Konfigurator Test-Seite:**
```
http://localhost:5173/test-add-to-cart.html
```

Diese Test-Seite simuliert den Shop-Listener perfekt und zeigt:
- Empfangene Messages
- Gesendete ACKs
- Warenkorb-Inhalt
- Vollständiges Log

### 2. Production Test

**Konfigurator mit Debug:**
```
https://www.unbreak-one.com/configurator?debug=1&lang=de
```

**Expected Console Output:**

```javascript
// Konfigurator Console:
[CFG][ADD_TO_CART_START] { variant: "glass_holder", ... }
[CFG][POSTMSG_SEND] { SHOP_ORIGIN: "https://www.unbreak-one.com", targetWindow: true, message: {...} }
[CFG][POSTMSG_SENT] { requestId: "cfg_...", SHOP_ORIGIN: "https://www.unbreak-one.com" }
[CFG][WAIT_ACK] { requestId: "cfg_...", timeoutMs: 2500 }
[CFG][ACK_RECEIVED] { type: "ADD_TO_CART_ACK", requestId: "cfg_...", ok: true, cartCount: 1 }
[CFG][ADD_TO_CART_SUCCESS] { ok: true, cartCount: 1 }
[CFG][REDIRECT_TO_CART]

// Shop Console:
[SHOP][ADD_TO_CART_RECEIVED] { type: "ADD_TO_CART", requestId: "cfg_...", payload: {...} }
[SHOP][CART_ADDED] { variant: "glass_holder", quantity: 1 }
[SHOP][ACK_SENT] { type: "ADD_TO_CART_ACK", requestId: "cfg_...", ok: true, cartCount: 1 }
```

---

## 🚨 HÄUFIGE FEHLER

### 1. **Origin Mismatch**

**Symptom:** `[CFG][ACK_TIMEOUT]`

**Ursache:** Shop-Listener prüft Origin falsch

**Lösung:**
```javascript
// FALSCH:
if (event.origin === 'https://unbreak-one.vercel.app') // NON-WWW ist falsch!

// RICHTIG:
if (event.origin === 'https://unbreak-3-d-konfigurator.vercel.app')
```

### 2. **ACK ohne requestId**

**Symptom:** `[CFG][ACK_TIMEOUT]`

**Ursache:** ACK enthält kein `requestId` oder falsches

**Lösung:**
```javascript
// FALSCH:
event.source.postMessage({ type: 'ADD_TO_CART_ACK', ok: true }, event.origin);

// RICHTIG:
event.source.postMessage({ 
  type: 'ADD_TO_CART_ACK', 
  requestId: data.requestId, // MUSS matchen!
  ok: true 
}, event.origin);
```

### 3. **Listener nur in Route**

**Symptom:** `[CFG][ACK_TIMEOUT]` manchmal

**Ursache:** Listener nur in `/configurator` Route, nicht global

**Lösung:**
Listener MUSS in `_app.tsx` / `layout.tsx` / `app/layout.tsx` sein, NICHT in einzelnen Routes.

### 4. **event.source ist null**

**Symptom:** `[CFG][ACK_TIMEOUT]`

**Ursache:** Konfigurator nicht als iframe/popup geöffnet

**Lösung:**
```javascript
if (!event.source) {
  console.error('[SHOP][NO_SOURCE]');
  return;
}
```

---

## 📊 DEBUGGING

### localStorage Debug Log

Aktiviere im Konfigurator: `?debug=1`

Dann nach Klick prüfen:

```javascript
// Browser Console (SOFORT nach Klick, bevor Redirect)
JSON.parse(localStorage.getItem('unbreak_debug_log'))
```

Output zeigt:
- `POSTMSG_SEND` - Message wurde gesendet
- `WAIT_ACK` - Wartet auf ACK
- `ACK_RECEIVED` - ACK kam an
- `ACK_TIMEOUT` - Kein ACK nach 2.5s

### Debug-Overlay

Rechts unten im Konfigurator (bei `?debug=1`):
- Minimiert: `[DEBUG] POSTMSG_SEND | 5 entries`
- Click → Expandiert → Zeigt vollständigen Log

---

## ✅ AKZEPTANZKRITERIEN

**ERFOLG wenn:**

1. ✅ Konfigurator Console zeigt:
   ```
   [CFG][POSTMSG_SEND]
   [CFG][WAIT_ACK]
   [CFG][ACK_RECEIVED]
   [CFG][REDIRECT_TO_CART]
   ```

2. ✅ Shop Console zeigt:
   ```
   [SHOP][ADD_TO_CART_RECEIVED]
   [SHOP][CART_ADDED]
   [SHOP][ACK_SENT]
   ```

3. ✅ Produkt erscheint im Warenkorb

4. ✅ Redirect zu `/cart` erfolgt

5. ✅ **KEIN** Timeout-Fehler

---

## 🔍 TROUBLESHOOTING CHECKLISTE

- [ ] Shop-Listener läuft global (nicht nur in Route)
- [ ] Origin-Check erlaubt `https://unbreak-3-d-konfigurator.vercel.app`
- [ ] ACK enthält `requestId` aus original Message
- [ ] ACK wird an `event.origin` gesendet (nicht `SHOP_ORIGIN`)
- [ ] ACK wird an `event.source` gesendet (nicht `window.parent`)
- [ ] `event.source` ist nicht null
- [ ] Konfigurator läuft als iframe oder popup (nicht standalone)

---

## 📞 SUPPORT

**Bei Problemen:**

1. Aktiviere `?debug=1` im Konfigurator
2. Klicke "In den Warenkorb"
3. Kopiere:
   - Konfigurator Console Log
   - Shop Console Log
   - `localStorage['unbreak_debug_log']`
4. Sende an Support

**Test-URL für Shop-Entwickler:**
```
http://localhost:5173/test-add-to-cart.html
```

Diese Seite zeigt perfekt, wie der Shop-Listener funktionieren muss.

---

## 🎯 NÄCHSTER SCHRITT

**Shop-Entwickler:** Implementiere obigen Listener in `_app.tsx` oder `layout.tsx`

**Test:** Öffne `https://www.unbreak-one.com/configurator?debug=1`

**Expected:** Kein Timeout, Produkt im Cart, Redirect zu `/cart`
