# Mobile Scale Test – UNBREAK ONE Konfigurator

## TESTPROZEDUR (Mobile Initial Scale -40%)

### 1. TEST AUF HANDY (im gleichen WLAN)
```
URL: http://192.168.178.135:5173/?debug=1
```

### 2. ERWARTETES VERHALTEN

#### **Debug-Overlay (oben links, cyan Badge):**
```
U1 DEBUG
MOBILE: true
SCALE: 0.60
VIEWPORT: 390x844 (o.ä.)
BUILD: [timestamp]
```

#### **Console-Logs (F12 Remote Debugging):**
```
[U1-Scale] isMobile: true | scaleFactor: 0.6 | viewport: 390 x 844
[U1-Scale] Applied to: group | finalScale: 0.06
```

#### **Visuell:**
- Modell erscheint beim Start ~40% kleiner als auf Desktop
- Komplett sichtbar, kein Anschnitt durch UI
- Orbit/Zoom funktioniert normal

### 3. VARIANT-SWITCH TEST
1. Wechsle zwischen **Glashalter** ↔ **Flaschenhalter**
2. Scale bleibt **0.6** (prüfe im Badge: `SCALE: 0.60`)
3. Kamera zoomt smooth ein (300ms Animation)

### 4. DESKTOP VERGLEICH
```
URL: http://localhost:5173/?debug=1
```

**Erwartetes Badge:**
```
MOBILE: false
SCALE: 1.00
VIEWPORT: 1920x1080 (o.ä.)
```

Modell erscheint größer als auf Mobile.

---

## CACHE-BUST STRATEGIE

### Parent-iFrame Integration:
Wenn der Konfigurator im iFrame eingebunden ist, nutze:
```html
<iframe src="https://config.unbreakone.de/?t=1234567890&debug=1"></iframe>
```

- `?t=[timestamp]` → erzwingt Neu-Laden (Cache umgehen)
- `&debug=1` → aktiviert Debug-Overlay

### Hard Reload auf Handy:
- **Chrome Android**: Einstellungen → Website-Daten löschen
- **Safari iOS**: Adressleiste lange gedrückt halten → "Seite neu laden"

---

## DEBUGGING (falls MOBILE: false auf Handy)

### Mögliche Ursachen:
1. **Viewport Meta Tag fehlt** → Prüfe `index.html`:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   ```
   ✅ Ist bereits vorhanden!

2. **Breakpoint passt nicht** → Verkleinere Fenster auf Desktop:
   - Bei Breite **≤ 820px** muss `MOBILE: true` erscheinen
   - Falls nicht: `matchMedia` Logik prüfen

3. **Service Worker cached alte Version**:
   - DevTools → Application → Clear Storage
   - Oder: Private/Incognito Mode nutzen

---

## GEÄNDERTE DATEIEN

### `src/components/3D/ConfiguratorModel.jsx`
- ✅ Neue Funktion: `useEffect` mit `window.matchMedia('(max-width: 820px)')`
- ✅ Scale wird direkt auf `group.current.scale.setScalar()` angewendet
- ✅ Debug-Overlay erstellt bei `?debug=1`
- ✅ Console Logs: isMobile, scaleFactor, viewport, finalScale
- ✅ Funktioniert für Glashalter UND Flaschenhalter

### `index.html`
- ✅ Viewport Meta Tag bereits vorhanden (kein Änderungsbedarf)

---

## DEPLOYMENT VALIDIERUNG (Vercel/Production)

1. Nach Deploy, öffne: `https://config.unbreakone.de/?debug=1`
2. Prüfe `BUILD: [timestamp]` im Badge → muss aktuell sein
3. Falls alter BUILD: Cache-Bust mit `?t=[neuer-timestamp]`

---

**Erstellt:** 2025-12-24  
**Breakpoint:** 820px  
**Mobile Scale Factor:** 0.6 (-40%)
