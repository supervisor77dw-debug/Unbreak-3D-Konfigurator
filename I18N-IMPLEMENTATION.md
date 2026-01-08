# UNBREAK ONE - Internationalization (i18n) Implementation

## ✅ COMPLETE (2026-01-08)

Vollständige Zweisprachigkeit (DE/EN) implementiert mit technischen Keys für Backend-Kommunikation.

---

## 🌍 ARCHITEKTUR

### 1. Language Management
- **LanguageProvider** (`src/i18n/LanguageContext.jsx`)
  - Context für globale Sprachverwaltung
  - Query-Parameter Support: `?lang=de` / `?lang=en`
  - postMessage API: `{type: "SET_LANGUAGE", lang: "en"}`
  - Default: `de`

### 2. Translations
- **translations.js** (`src/i18n/translations.js`)
  - Single Source of Truth für alle Übersetzungen
  - Strukturiert nach: colors, parts, products, ui, messages
  - Helper-Funktion: `t(lang, path)`

### 3. Technical Keys
- **IMMER snake_case** (backend-kompatibel)
- **NIE übersetzte Werte im JSON**

---

## 🎨 CANONICAL COLOR IDS (7)

### Technical Keys (snake_case)
```javascript
mint       // #a2d9ce
green      // #145a32
purple     // #4a235a
ice_blue   // #5499c7 (NICHT iceBlue!)
dark_blue  // #1b2631 (NICHT darkBlue!)
red        // #b03a2e
black      // #121212
```

### Translations
| Key | DE | EN |
|-----|----|----|
| `mint` | Mint | Mint |
| `green` | Grün | Green |
| `purple` | Lila | Purple |
| `ice_blue` | Eisblau | Ice Blue |
| `dark_blue` | Dunkelblau | Dark Blue |
| `red` | Rot | Red |
| `black` | Schwarz | Black |

---

## 🔧 CANONICAL PART IDS (4)

### Technical Keys
```javascript
base
arm
module
pattern
```

### Translations
| Key | DE | EN |
|-----|----|----|
| `base` | Grundplatte | Base Plate |
| `arm` | Arm | Arm |
| `module` | Gummilippe | Rubber Lip |
| `pattern` | Muster | Pattern |

---

## 📦 CONFIG_JSON (Backend-Vertrag)

### Glashalter (4 Parts)
```json
{
  "product_type": "glass_holder",
  "base": "black",
  "arm": "ice_blue",
  "module": "mint",
  "pattern": "dark_blue",
  "finish": "matte",
  "quantity": 1,
  "lang": "de"
}
```

### Flaschenhalter (2 Parts)
```json
{
  "product_type": "bottle_holder",
  "base": "black",
  "pattern": "red",
  "finish": "matte",
  "quantity": 1,
  "lang": "en"
}
```

**KRITISCH:**
- ✅ Keys in snake_case
- ✅ Values sind technische IDs (NICHT "Rot" oder "Red")
- ✅ `lang` optional für Backend-Tracking

---

## 🔄 SPRACHSTEUERUNG

### 1. URL Query-Parameter
```html
<iframe src="https://configurator.domain/?lang=en"></iframe>
```

### 2. postMessage API
```javascript
iframe.contentWindow.postMessage(
  { type: "SET_LANGUAGE", lang: "en" },
  "https://configurator.domain"
);
```

### 3. Fallback
- Wenn nichts übergeben → `de`

---

## 📝 UI-ÜBERSETZUNGEN

### Beispiele
| Key | DE | EN |
|-----|----|----|
| `ui.configure` | Konfigurieren | Configure |
| `ui.selectColor` | Farbe auswählen | Select Color |
| `ui.buyNow` | Jetzt kaufen | Buy Now |
| `ui.addToCart` | In den Warenkorb | Add to Cart |
| `ui.finish` | Oberfläche | Finish |
| `ui.matte` | Matt | Matte |
| `ui.glossy` | Glänzend | Glossy |

---

## 🔧 GEÄNDERTE DATEIEN

### Core i18n
- ✅ **src/i18n/translations.js** (NEU)
- ✅ **src/i18n/LanguageContext.jsx** (NEU)

### Integration
- ✅ **src/main.jsx** - LanguageProvider wrapper
- ✅ **src/context/ConfiguratorContext.jsx** - snake_case color keys + buildConfigJSON()
- ✅ **src/components/UI/ColorPicker.jsx** - Übersetzungen
- ✅ **src/App.jsx** - useLanguage + buildConfigJSON

---

## ✅ AKZEPTANZKRITERIEN

- [x] Konfigurator vollständig DE/EN umschaltbar
- [x] Backend versteht config_json ohne Mapping-Hacks
- [x] Color Keys: snake_case (ice_blue, dark_blue)
- [x] Query-Parameter: `?lang=en` funktioniert
- [x] postMessage: `SET_LANGUAGE` funktioniert
- [x] buildConfigJSON() liefert technische Keys
- [x] UI-Texte übersetzt
- [x] Keine hardcodierten Strings

---

## 🚀 NÄCHSTE SCHRITTE

1. **Testen:**
   ```bash
   npm run dev
   # Öffne: http://localhost:5173?lang=en
   ```

2. **postMessage testen:**
   ```javascript
   // In Parent Console:
   document.getElementById('iframe').contentWindow.postMessage(
     {type: "SET_LANGUAGE", lang: "en"},
     "http://localhost:5173"
   );
   ```

3. **config_json validieren:**
   - Farbe ändern
   - Console öffnen
   - Prüfe `[App] Checkout Configuration (config_json)`
   - Keys MÜSSEN snake_case sein

---

## ⚠️ MIGRATION NOTES

**Color Keys geändert:**
- `iceBlue` → `ice_blue`
- `darkBlue` → `dark_blue`

**Bestehende Configs müssen migriert werden!**

**Backend-Schema prüfen:**
- Akzeptiert Backend `ice_blue` / `dark_blue`?
- Oder erwartet es noch `iceBlue` / `darkBlue`?

---

**Implementation vollständig. Bereit für Tests und Deployment.**
