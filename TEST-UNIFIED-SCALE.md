# TEST: Unified Scale 0.6 für alle Devices

## AKTUELLE KONFIGURATION (Code)

### 1. Base Scale: ✅
```javascript
const baseScale = 0.06; // = 0.1 × 0.6 = 60%
```
**Zeile 374** in `ConfiguratorModel.jsx`

### 2. Fit Margin: ✅
```javascript
const fitMargin = 1.6; // UNIFIED für alle Devices
```
**Zeile 211** in `ConfiguratorModel.jsx`

### 3. Dolly-Out: ✅
```javascript
const dollyFactor = 1.45; // IMMER angewendet (nicht nur Mobile)
distance *= dollyFactor;
```
**Zeilen 49-50** in `ConfiguratorModel.jsx`

---

## TEST-SCHRITTE

### LOKAL testen:
1. **Öffne:** http://localhost:5173/?debug=1
2. **Hard Reload:** `Ctrl + Shift + R`
3. **Console öffnen:** `F12`

### ERWARTETE CONSOLE-AUSGABE:
```
[U1] ✅ UNIFIED FRAMING v2: scale=0.6, fitMargin=1.6, dolly=1.45x for ALL devices
[U1] Build timestamp: 1735232XXX - If you see old values, clear browser cache!
[FitCamera] Radius: X.XXX | Margin: 1.6 | Dolly: 1.45x (unified)
[U1] FIT RUN { variantKey: "glass_holder", fitMargin: 1.6, dolly: "1.45x (unified)", ... }
```

### ERWARTETES DEBUG-OVERLAY (oben links):
```
U1 DEBUG
DEVICE: DESKTOP (oder MOBILE)
SCALE: 0.60 (unified)
FIT_MARGIN: 1.60 (unified)
DOLLY: 1.45x (unified)
DIST: 0.XXX
CAM: 0.XXX
FIT_RUNS: 1
VIEWPORT: 1920x1080
```

---

## TROUBLESHOOTING

### Problem: "Nichts hat sich geändert"

**Ursache 1: Browser-Cache**
- Lösung: `Ctrl + Shift + R` (Chrome/Edge)
- Oder: Inkognito-Modus testen

**Ursache 2: Service Worker cached**
- Lösung: F12 → Application → Clear Storage → Clear site data

**Ursache 3: Vercel Deploy noch nicht live**
- Lösung: Warte 1-2 Min nach Git Push
- Prüfe: https://vercel.com/dashboard (Deployments Tab)

**Ursache 4: Alte Build-Artefakte**
```bash
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

---

## VERIFIKATION

### Desktop sollte jetzt aussehen wie Mobile:
- ✅ Modell nimmt ~60% der Viewport ein
- ✅ Viel "Luft" um das Produkt herum
- ✅ Nicht flächenfüllend

### Code-Commits:
- `bc3c56f` - Unified Scale 0.6
- `4c79a3c` - Unified Framing (fitMargin 1.6 + Dolly 1.45x)

Git Status prüfen:
```bash
git log --oneline -3
```
Sollte zeigen:
```
4c79a3c FIX Desktop flächenfüllig: Einheitliches Framing
bc3c56f FIX: Einheitliche Skalierung 0.6 für alle Devices
62843b4 Global: Modellgröße um 30% reduziert
```
