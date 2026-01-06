# UNBREAK ONE - Bottle Holder Support Documentation

**Datum:** 2026-01-04  
**Feature:** Extended postMessage config for bottle_holder (2-part product)

---

## 📦 PRODUCT TYPES

Der Konfigurator unterstützt **2 Produktvarianten**:

1. **Glass Holder** (Glashalter) - 4 konfigurierbare Teile
2. **Bottle Holder** (Flaschenhalter) - 2 Teile (nur 1 konfigurierbar)

---

## 🔄 PAYLOAD EXAMPLES

### 1. Glass Holder (Glashalter)

```json
{
  "type": "configChanged",
  "config": {
    "product": "glass_holder",
    "product_sku": "UNBREAK-GLAS-01",
    "colors": {
      "base": "black",
      "middle": "purple",
      "top": "red"
    },
    "parts": [
      { "key": "base", "label_de": "Grundplatte", "editable": true },
      { "key": "middle", "label_de": "Arm", "editable": true },
      { "key": "top", "label_de": "Windrose", "editable": true },
      { "key": "lip", "label_de": "Gummilippe", "editable": true, "internal_only": true }
    ],
    "finish": "matte",
    "quantity": 1,
    "preview_image_url": null,
    "engraving": null
  },
  "reason": "color_changed:middle=purple"
}
```

**Colors Schema:**
- `base` → Grundplatte (editable)
- `middle` → Arm (editable)
- `top` → Windrose (editable)
- ⚠️ Gummilippe wird intern gemappt (colors.module), aber **NICHT** in colors object gesendet

---

### 2. Bottle Holder (Flaschenhalter)

```json
{
  "type": "configChanged",
  "config": {
    "product": "bottle_holder",
    "product_sku": "UNBREAK-FLASCHE-01",
    "colors": {
      "base": "black",
      "top": "iceBlue"
    },
    "parts": [
      { "key": "base", "label_de": "Unterteil", "editable": false },
      { "key": "top", "label_de": "Oberteil/Farbakzent", "editable": true }
    ],
    "finish": "matte",
    "quantity": 1,
    "preview_image_url": null,
    "engraving": null
  },
  "reason": "color_changed:pattern=iceBlue"
}
```

**Colors Schema:**
- `base` → Unterteil (fixed "black", NOT editable)
- `top` → Oberteil/Farbakzent (editable)
- ❌ **NO `middle` key** (omitted, not null!)

---

## 🎯 KEY DIFFERENCES

| Aspect | Glass Holder | Bottle Holder |
|--------|--------------|---------------|
| **Product ID** | `glass_holder` | `bottle_holder` |
| **SKU** | `UNBREAK-GLAS-01` | `UNBREAK-FLASCHE-01` |
| **Colors Keys** | `base`, `middle`, `top` | `base`, `top` |
| **Editable Parts** | 3 (base, middle, top) | 1 (top only) |
| **Parts Count** | 4 (+ lip internal) | 2 |
| **Base Color** | Configurable | Fixed "black" |
| **Top Color** | Configurable | Configurable |

---

## 📁 CODE LOCATIONS

### Product Switching Detection
**Datei:** `src/context/ConfiguratorContext.jsx`

```javascript
const isBottleHolder = variant === 'bottle_holder';
```

**Lines:** 54, 82, 119

### Color Mapping Logic
**Funktion:** `getCurrentConfig()`  
**Datei:** `src/context/ConfiguratorContext.jsx`  
**Lines:** 49-91

```javascript
const colorConfig = isBottleHolder 
    ? {
        base: 'black',          // Fixed for bottle holder
        top: colors.pattern,    // Configurable (Rose/Farbakzent)
      }
    : {
        base: colors.base,      // Configurable (Grundplatte)
        middle: colors.arm,     // Configurable (Arm)
        top: colors.pattern,    // Configurable (Windrose)
      };
```

### Parts Metadata Logic
**Funktion:** `getCurrentConfig()`  
**Datei:** `src/context/ConfiguratorContext.jsx`  
**Lines:** 69-84

```javascript
const partsMetadata = isBottleHolder
    ? [
        { key: 'base', label_de: 'Unterteil', editable: false },
        { key: 'top', label_de: 'Oberteil/Farbakzent', editable: true },
      ]
    : [
        { key: 'base', label_de: 'Grundplatte', editable: true },
        { key: 'middle', label_de: 'Arm', editable: true },
        { key: 'top', label_de: 'Windrose', editable: true },
        { key: 'lip', label_de: 'Gummilippe', editable: true, internal_only: true },
      ];
```

### 3D Model Mapping
**Datei:** `src/components/3D/ConfiguratorModel.jsx`  
**Lines:** 377-387

```javascript
if (variant === 'bottle_holder') {
    return (
        <group ref={group} dispose={null} scale={finalScale}>
            <Part url={ASSETS.bottleBase} color={patternColor} renderOrder={0} isFixedBlack={true} />
            <Part url={ASSETS.bottleBody} color={patternColor} renderOrder={1} isFixedBlack={true} />
            <Part url={ASSETS.bottleRose} color={patternColor} renderOrder={2} isFixedBlack={false} isAccent={true} />
        </group>
    );
}
```

**Mapping:**
- `bottleBase` → isFixedBlack={true} → always black → colors.base="black"
- `bottleBody` → isFixedBlack={true} → always black → (not exposed in config)
- `bottleRose` → patternColor → colors.pattern → **mapped to** colors.top

---

## 🔍 VALIDATION LOGS

### Expected Console Output (Bottle Holder)

```
[UNBREAK_IFRAME] postMessage -> https://... | configChanged | variant_changed:bottle_holder
[UNBREAK_IFRAME] Config Object:
  {
    product: "bottle_holder",
    product_sku: "UNBREAK-FLASCHE-01",
    colors: { base: "black", top: "red" },
    parts: [...]
  }

[UNBREAK_IFRAME] postMessage -> https://... | configChanged | color_changed:pattern=iceBlue
[UNBREAK_IFRAME] Config Object:
  {
    product: "bottle_holder",
    colors: { base: "black", top: "iceBlue" }
  }
```

### Expected Console Output (Glass Holder)

```
[UNBREAK_IFRAME] postMessage -> https://... | configChanged | variant_changed:glass_holder
[UNBREAK_IFRAME] Config Object:
  {
    product: "glass_holder",
    product_sku: "UNBREAK-GLAS-01",
    colors: { base: "black", middle: "black", top: "red" },
    parts: [...]
  }

[UNBREAK_IFRAME] postMessage -> https://... | configChanged | color_changed:base=purple
[UNBREAK_IFRAME] Config Object:
  {
    product: "glass_holder",
    colors: { base: "purple", middle: "black", top: "red" }
  }
```

---

## 🧪 TESTING SCENARIOS

### Test 1: Initial Load (Glass Holder)
1. Open configurator
2. Default variant: `glass_holder`
3. Expected payload: base=black, middle=black, top=red

### Test 2: Switch to Bottle Holder
1. Click "Flaschenhalter" button
2. Expected payload: 
   - product=bottle_holder
   - colors={ base: "black", top: "red" }
   - **NO middle key!**

### Test 3: Change Bottle Holder Color
1. While on bottle_holder
2. Change Windrose color to "iceBlue"
3. Expected payload: colors={ base: "black", top: "iceBlue" }

### Test 4: GET_CONFIGURATION (Bottle Holder)
1. Parent sends GET_CONFIGURATION
2. Expected response <100ms
3. Response should have bottle_holder schema (base + top only)

---

## ⚠️ IMPORTANT NOTES

### 1. NO NULL VALUES
❌ **WRONG:**
```json
{
  "colors": {
    "base": "black",
    "middle": null,    // ← NEVER DO THIS!
    "top": "red"
  }
}
```

✅ **CORRECT (bottle_holder):**
```json
{
  "colors": {
    "base": "black",
    "top": "red"      // ← middle key omitted entirely
  }
}
```

### 2. Base Color for Bottle Holder
- Always "black" (fixed in 3D model via isFixedBlack={true})
- Marked as editable=false in parts metadata
- Could be made configurable in future by removing isFixedBlack

### 3. Parts Metadata Usage
```javascript
config.parts.forEach(part => {
  if (part.editable) {
    // Show color picker for this part
  } else {
    // Show as fixed/non-editable
  }
  
  if (part.internal_only) {
    // Don't expose in admin UI
  }
});
```

### 4. Gummilippe (Lip) Handling
- **Glass Holder:** Exists as `colors.module` internally
- **Parent Payload:** NOT included in colors object
- **Reason:** Listed in parts metadata with internal_only=true
- **Future:** Could be exposed if needed

---

## 📦 DELIVERABLES CHECKLIST

- ✅ Glass Holder payload example provided
- ✅ Bottle Holder payload example provided
- ✅ Product switching code location documented (ConfiguratorContext.jsx)
- ✅ Color mapping logic documented (getCurrentConfig function)
- ✅ Parts metadata included in payload
- ✅ NO null values in colors object
- ✅ Correct schema per product type
- ✅ Logs show product type in reason

---

## 🚀 DEPLOYMENT

After implementation, verify:

1. ✅ Console shows correct product ID in logs
2. ✅ Bottle holder sends only base+top
3. ✅ Glass holder sends base+middle+top
4. ✅ GET_CONFIGURATION returns correct schema
5. ✅ Parts metadata is present
6. ✅ No "petrol" or other invalid colors

---

**Status:** ✅ Implemented & Ready for Testing  
**Files Modified:** `src/context/ConfiguratorContext.jsx`
