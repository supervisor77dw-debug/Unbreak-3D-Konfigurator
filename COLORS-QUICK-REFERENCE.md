# UNBREAK ONE - Farben Quick Reference

## 🎯 SCHNELLÜBERSICHT (Copy & Paste Ready)

### Alle 7 Farben mit HEX-Werten

```javascript
const UNBREAK_COLORS = {
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

## 📋 MAPPING-TABELLE (Konfigurator → Shop)

| Konfigurator ID | HEX       | RGB             | Shop Name (Vorschlag) |
|-----------------|-----------|-----------------|----------------------|
| `mint`          | `#a2d9ce` | 162, 217, 206   | Mint                 |
| `green`         | `#145a32` | 20, 90, 50      | Grün                 |
| `purple`        | `#4a235a` | 74, 35, 90      | Lila                 |
| `iceBlue`       | `#5499c7` | 84, 153, 199    | Eisblau              |
| `darkBlue`      | `#1b2631` | 27, 38, 49      | Dunkelblau           |
| `red`           | `#b03a2e` | 176, 58, 46     | Rot                  |
| `black`         | `#121212` | 18, 18, 18      | Schwarz              |

---

## ⚙️ DEFAULT-KONFIGURATION

```javascript
// Initial State beim Laden
const DEFAULTS = {
    base: 'black',      // Grundplatte
    arm: 'black',       // Arm
    module: 'black',    // Gummilippe
    pattern: 'red',     // Windrose (Premium-Farbe!)
};
```

**Wichtig:** `red` ist Premium-Default für Windrose!

---

## 🔄 CONFIG FORMAT (vom Konfigurator an Shop)

```javascript
{
  type: "configChanged",
  config: {
    colors: {
      base: "black",      // Grundplatte
      top: "red",         // Windrose
      middle: "black"     // Arm
    },
    // ... weitere Felder
  }
}
```

**Achtung:** Gummilippe (`module`) wird NICHT übertragen!

---

## 🎨 FARB-VALIDIERUNG (TypeScript)

```typescript
type UnbreakColorId = 
  | 'mint' 
  | 'green' 
  | 'purple' 
  | 'iceBlue'   // CamelCase!
  | 'darkBlue'  // CamelCase!
  | 'red' 
  | 'black';

interface ColorDefinition {
  id: UnbreakColorId;
  hex: string;
  rgb: { r: number; g: number; b: number };
}

// Validator
function isValidUnbreakColor(colorId: string): colorId is UnbreakColorId {
  return ['mint', 'green', 'purple', 'iceBlue', 'darkBlue', 'red', 'black']
    .includes(colorId);
}
```

---

## 🚨 WICHTIGE HINWEISE

### 1. CamelCase IDs
```javascript
✅ 'iceBlue'
❌ 'ice_blue'
❌ 'IceBlue'

✅ 'darkBlue'
❌ 'dark_blue'
❌ 'DarkBlue'
```

### 2. HEX-Format
```javascript
✅ '#a2d9ce'  // Lowercase mit #
❌ 'a2d9ce'   // Fehlendes #
❌ '#A2D9CE'  // Uppercase (funktioniert, aber nicht konsistent)
```

### 3. Defaults nicht überschreiben
```javascript
// ❌ FALSCH (Petrol-Bug)
const config = {
  colors: {
    base: 'petrol',  // Existiert nicht!
    // ...
  }
};

// ✅ RICHTIG
const config = {
  colors: {
    base: 'black',  // Aus UNBREAK_COLORS
    // ...
  }
};
```

---

## 📦 JSON IMPORT (für Datenbank)

```json
[
  { "id": "mint", "hex": "#a2d9ce", "name": "Mint" },
  { "id": "green", "hex": "#145a32", "name": "Grün" },
  { "id": "purple", "hex": "#4a235a", "name": "Lila" },
  { "id": "iceBlue", "hex": "#5499c7", "name": "Eisblau" },
  { "id": "darkBlue", "hex": "#1b2631", "name": "Dunkelblau" },
  { "id": "red", "hex": "#b03a2e", "name": "Rot" },
  { "id": "black", "hex": "#121212", "name": "Schwarz" }
]
```

---

## 🧪 RUNTIME-TESTS

### Test 1: Alle IDs vorhanden
```javascript
const expectedColors = ['mint', 'green', 'purple', 'iceBlue', 'darkBlue', 'red', 'black'];
const actualColors = Object.keys(UNBREAK_COLORS);

console.assert(
  expectedColors.every(id => actualColors.includes(id)),
  'Fehlende Farb-IDs!'
);
```

### Test 2: HEX-Format validieren
```javascript
Object.entries(UNBREAK_COLORS).forEach(([id, hex]) => {
  console.assert(
    /^#[0-9a-f]{6}$/.test(hex),
    `Ungültiges HEX-Format für ${id}: ${hex}`
  );
});
```

### Test 3: Default-Config validieren
```javascript
Object.values(DEFAULTS).forEach(colorId => {
  console.assert(
    UNBREAK_COLORS[colorId],
    `Default-Farbe ${colorId} existiert nicht in COLOR_PALETTE`
  );
});
```

---

## 🔗 WEITERE RESSOURCEN

- **Vollständige Spec:** [COLORS-TECHNICAL-SPEC.md](COLORS-TECHNICAL-SPEC.md)
- **JSON Export:** [colors-definition.json](colors-definition.json)
- **Visuelle Übersicht:** [colors-overview.html](colors-overview.html)

---

**Letzte Aktualisierung:** 2026-01-04  
**Version:** 1.0.0
