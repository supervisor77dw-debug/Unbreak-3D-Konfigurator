# UNBREAK ONE - Farbdefinitionen (Technische Dokumentation)

**Datum:** 2026-01-04  
**Quelle:** Direkt aus dem 3D-Konfigurator ausgelesen  
**Zweck:** Verbindliche Basis für Shop-Integration Mapping

---

## 📊 ÜBERSICHT

Der UNBREAK ONE 3D-Konfigurator verwendet **exakt 7 Farben**, die in `COLOR_PALETTE` definiert sind.

**Quelle im Code:** `src/context/ConfiguratorContext.jsx` (Zeilen 23-30)

```javascript
export const COLOR_PALETTE = {
    mint: '#a2d9ce',
    green: '#145a32',
    purple: '#4a235a',
    iceBlue: '#5499c7',
    darkBlue: '#1b2631',
    red: '#b03a2e',
    black: '#121212',
};
```

---

## 🎨 VOLLSTÄNDIGE FARBDEFINITIONEN

### Farbe 1: Mint

```json
{
  "internalId": "mint",
  "internalName": "mint",
  "hex": "#a2d9ce",
  "rgb": "rgb(162, 217, 206)",
  "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
  "source": "src/context/ConfiguratorContext.jsx",
  "defaultFor": null
}
```

**Technische Details:**
- Wird über `palette[colors.base]` auf 3D-Modelle gemappt
- Verwendung: Alle 4 Bauteile (glass_holder Variante)
- UI-Element: ColorPicker zeigt als Farbkreis

---

### Farbe 2: Green

```json
{
  "internalId": "green",
  "internalName": "green",
  "hex": "#145a32",
  "rgb": "rgb(20, 90, 50)",
  "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
  "source": "src/context/ConfiguratorContext.jsx",
  "defaultFor": null
}
```

**Technische Details:**
- Dunkles Grün
- Alle Bauteile selektierbar
- Material: MeshStandardMaterial mit roughness 0.65

---

### Farbe 3: Purple

```json
{
  "internalId": "purple",
  "internalName": "purple",
  "hex": "#4a235a",
  "rgb": "rgb(74, 35, 90)",
  "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
  "source": "src/context/ConfiguratorContext.jsx",
  "defaultFor": null
}
```

**Technische Details:**
- Dunkles Lila/Violett
- Alle Bauteile selektierbar

---

### Farbe 4: Ice Blue

```json
{
  "internalId": "iceBlue",
  "internalName": "iceBlue",
  "hex": "#5499c7",
  "rgb": "rgb(84, 153, 199)",
  "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
  "source": "src/context/ConfiguratorContext.jsx",
  "defaultFor": null
}
```

**Technische Details:**
- Hellblau/Eisblau
- CamelCase Schreibweise im Code
- Alle Bauteile selektierbar

---

### Farbe 5: Dark Blue

```json
{
  "internalId": "darkBlue",
  "internalName": "darkBlue",
  "hex": "#1b2631",
  "rgb": "rgb(27, 38, 49)",
  "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
  "source": "src/context/ConfiguratorContext.jsx",
  "defaultFor": null
}
```

**Technische Details:**
- Sehr dunkles Blau (fast Anthrazit)
- CamelCase Schreibweise im Code
- Alle Bauteile selektierbar

---

### Farbe 6: Red

```json
{
  "internalId": "red",
  "internalName": "red",
  "hex": "#b03a2e",
  "rgb": "rgb(176, 58, 46)",
  "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
  "source": "src/context/ConfiguratorContext.jsx",
  "defaultFor": "pattern"
}
```

**Technische Details:**
- Dunkelrot/Bordeaux
- **DEFAULT für Windrose** (siehe CONFIGURATION_DEFAULTS)
- Premium-Farbe für Pattern

**Default-Definition:**
```javascript
// src/context/ConfiguratorContext.jsx, Zeile 17
colors: {
    base: 'black',
    arm: 'black',
    module: 'black',
    pattern: 'red', // Premium default
}
```

---

### Farbe 7: Black

```json
{
  "internalId": "black",
  "internalName": "black",
  "hex": "#121212",
  "rgb": "rgb(18, 18, 18)",
  "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
  "source": "src/context/ConfiguratorContext.jsx",
  "defaultFor": ["base", "arm", "module"]
}
```

**Technische Details:**
- Fast reines Schwarz (leicht aufgehellt für bessere Rendering-Eigenschaften)
- **DEFAULT für Grundplatte, Arm und Gummilippe**
- Häufigste Default-Farbe

---

## 🏗️ BAUTEIL-MAPPING

### Glashalter-Variante (`glass_holder`)

Alle 7 Farben sind verfügbar für:

1. **Grundplatte** (`base`)
   - Variable: `colors.base`
   - 3D-Mapping: `baseplateColor = palette[colors.base]`
   - GLTF: `U1_Baseplate.glb`

2. **Arm** (`arm`)
   - Variable: `colors.arm`
   - 3D-Mapping: `armColor = palette[colors.arm]`
   - GLTF: `U1_Arm.glb`

3. **Gummilippe** (`module`)
   - Variable: `colors.module`
   - 3D-Mapping: `insertColor = palette[colors.module]`
   - GLTF: `U1_Insert_Rubber.glb`

4. **Windrose** (`pattern`)
   - Variable: `colors.pattern`
   - 3D-Mapping: `patternColor = palette[colors.pattern]`
   - GLTF: `U1_Pattern_Windrose.glb`
   - Material: isAccent=true (roughness 0.4, metalness 0.2)

### Flaschenhalter-Variante (`bottle_holder`)

**NUR Windrose** (`pattern`) ist farblich konfigurierbar:
- Andere Bauteile: Fixed Black (`isFixedBlack={true}`)
- GLTF Assets:
  - `U1_Base_Flaschenhalter.glb` (fixed black)
  - `U1_Flaschenhalter.glb` (fixed black)
  - `U1_Rose_Flaschenhalter.glb` (konfigurierbar)

**Quelle:** `src/components/UI/ColorPicker.jsx`, Zeilen 29-48

```javascript
const isBottleHolder = variant === 'bottle_holder';

{!isBottleHolder && (
    <>
        {/* Grundplatte, Arm, Gummilippe nur bei Glashalter */}
    </>
)}

{/* Windrose immer verfügbar */}
<ColorSection
    title="Windrose"
    activeColor={colors.pattern}
    onSelect={(color) => updateColor('pattern', color)}
/>
```

---

## 🔄 COLOR-STATE MANAGEMENT

### Interne Struktur (`colors` State)

```javascript
{
    base: 'black',      // Grundplatte
    arm: 'black',       // Arm
    module: 'black',    // Gummilippe
    pattern: 'red'      // Windrose
}
```

### Parent-Format (für Shop-Integration)

```javascript
{
    base: colors.base,      // Grundplatte
    top: colors.pattern,    // Windrose (oberste Schicht)
    middle: colors.arm      // Arm (mittlere Schicht)
}
```

**Achtung:** `module` (Gummilippe) wird **NICHT** an Parent gesendet!

**Quelle:** `src/context/ConfiguratorContext.jsx`, `getCurrentConfig()` Funktion

---

## 📁 QUELLEN IM CODE

### Primäre Definition
- **Datei:** `src/context/ConfiguratorContext.jsx`
- **Export:** `COLOR_PALETTE` (Zeilen 23-30)
- **Defaults:** `CONFIGURATION_DEFAULTS.colors` (Zeilen 14-17)

### Verwendung in UI
- **Datei:** `src/components/UI/ColorPicker.jsx`
- **Import:** `import { useConfigurator, COLOR_PALETTE } from '../../context/ConfiguratorContext'`
- **Rendering:** `Object.entries(COLOR_PALETTE).map(...)` (Zeile 10)

### Verwendung in 3D-Rendering
- **Datei:** `src/components/3D/ConfiguratorModel.jsx`
- **Mapping:** Zeilen 362-365
  ```javascript
  const baseplateColor = palette[colors.base];
  const armColor = palette[colors.arm];
  const insertColor = palette[colors.module];
  const patternColor = palette[colors.pattern];
  ```

---

## 📋 EXPORT FÜR SHOP-INTEGRATION

### JSON Format (Komplett)

```json
[
  {
    "internalId": "mint",
    "internalName": "mint",
    "hex": "#a2d9ce",
    "rgb": "rgb(162, 217, 206)",
    "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
    "source": "src/context/ConfiguratorContext.jsx"
  },
  {
    "internalId": "green",
    "internalName": "green",
    "hex": "#145a32",
    "rgb": "rgb(20, 90, 50)",
    "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
    "source": "src/context/ConfiguratorContext.jsx"
  },
  {
    "internalId": "purple",
    "internalName": "purple",
    "hex": "#4a235a",
    "rgb": "rgb(74, 35, 90)",
    "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
    "source": "src/context/ConfiguratorContext.jsx"
  },
  {
    "internalId": "iceBlue",
    "internalName": "iceBlue",
    "hex": "#5499c7",
    "rgb": "rgb(84, 153, 199)",
    "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
    "source": "src/context/ConfiguratorContext.jsx"
  },
  {
    "internalId": "darkBlue",
    "internalName": "darkBlue",
    "hex": "#1b2631",
    "rgb": "rgb(27, 38, 49)",
    "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
    "source": "src/context/ConfiguratorContext.jsx"
  },
  {
    "internalId": "red",
    "internalName": "red",
    "hex": "#b03a2e",
    "rgb": "rgb(176, 58, 46)",
    "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
    "source": "src/context/ConfiguratorContext.jsx",
    "defaultFor": "pattern"
  },
  {
    "internalId": "black",
    "internalName": "black",
    "hex": "#121212",
    "rgb": "rgb(18, 18, 18)",
    "availableFor": ["Grundplatte", "Arm", "Gummilippe", "Windrose"],
    "source": "src/context/ConfiguratorContext.jsx",
    "defaultFor": ["base", "arm", "module"]
  }
]
```

---

## ⚠️ WICHTIGE HINWEISE FÜR SHOP-INTEGRATION

### 1. CamelCase Beachten
- `iceBlue` und `darkBlue` verwenden CamelCase
- **Nicht** `ice_blue` oder `IceBlue`

### 2. HEX-Werte sind Referenz
- Exakte Werte verwenden für Color-Matching
- Keine Approximationen

### 3. Defaults Berücksichtigen
- Initial Load: `base=black, arm=black, module=black, pattern=red`
- Shop sollte diese Defaults auch verwenden

### 4. Varianten-Unterschiede
- **Glashalter:** 4 konfigurierbare Bauteile
- **Flaschenhalter:** Nur 1 konfigurierbares Bauteil (Windrose)

### 5. Parent-Mapping fehlt `module`
- Shop erhält: `{ base, top, middle }`
- Gummilippe (`module`) wird nicht übertragen
- Siehe: `getCurrentConfig()` in ConfiguratorContext.jsx

---

## 🔍 VALIDIERUNG

### Test-Code (Console)

```javascript
// Im Browser Console ausführen (mit Konfigurator geladen):
console.log('COLOR_PALETTE:', COLOR_PALETTE);
// Erwartet: { mint: '#a2d9ce', green: '#145a32', ... }

console.log('Anzahl Farben:', Object.keys(COLOR_PALETTE).length);
// Erwartet: 7

console.log('Farb-IDs:', Object.keys(COLOR_PALETTE));
// Erwartet: ['mint', 'green', 'purple', 'iceBlue', 'darkBlue', 'red', 'black']
```

### Runtime-Check

Alle 7 Farben sind zur Laufzeit verfügbar über:
- `useConfigurator().palette`
- Direkter Import: `COLOR_PALETTE`

---

**Dokumentation erstellt:** 2026-01-04  
**Version:** 1.0.0  
**Status:** ✅ Vollständig & Validiert
