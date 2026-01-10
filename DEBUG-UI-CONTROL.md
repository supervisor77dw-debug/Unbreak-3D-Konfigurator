# Debug UI Control - Test Guide

## Overview
All debug UI elements (overlays, alerts, popups) are now gated behind the `isDebugUIEnabled()` flag.

## Behavior

### Production (Vercel Production Deployment)
- ✅ **ALWAYS OFF** - No debug UI elements visible
- ✅ No alerts/popups on "Add to Cart"
- ✅ No debug overlay visible
- ✅ Only console.info/warn logging (invisible to users)

### Preview/Local (Development)
- ⚙️ **Optional** - Enable via flag
- Enable: `localStorage.setItem('UNBREAK_DEBUG', '1')` OR `?debug=1` in URL
- Disable: `localStorage.removeItem('UNBREAK_DEBUG')` OR remove `?debug=1`

## Test Scenarios

### 1. Production URL Test
```
https://unbreak-one.vercel.app
```
**Expected:**
- ❌ No debug overlay
- ❌ No alerts on "Add to Cart"
- ✅ Clean UI, no popups
- ✅ Language switch works (DE/EN)
- ✅ "In den Warenkorb" sends message to parent (check parent console)

### 2. Preview Deployment Test
```
https://unbreak-[preview-id].vercel.app
```
**Expected:**
- ❌ No debug overlay (production mode)
- ❌ No alerts
- ✅ Clean UI

### 3. Local Development (Debug OFF)
```
http://localhost:5173
```
**Expected:**
- ❌ No debug overlay
- ❌ No alerts
- ✅ Console logging still works

### 4. Local Development (Debug ON)
```
http://localhost:5173?debug=1
```
**OR**
```javascript
// In browser console
localStorage.setItem('UNBREAK_DEBUG', '1');
// Reload page
```
**Expected:**
- ✅ Debug overlay visible (top-left, cyan background)
- ✅ Shows device, scale, viewport info
- ✅ Console logging works

## How to Enable Debug UI (Local/Preview Only)

### Method 1: URL Parameter
```
http://localhost:5173?debug=1
```

### Method 2: localStorage
```javascript
// Open browser console
localStorage.setItem('UNBREAK_DEBUG', '1');
// Reload page
```

### To Disable
```javascript
localStorage.removeItem('UNBREAK_DEBUG');
// Reload page without ?debug=1
```

## Files Modified

1. **src/config/debug.js** (NEW)
   - `isDebugUIEnabled()` - Central debug flag checker
   - Returns `false` in production (MODE === 'production')
   - Returns `true` in dev if localStorage or URL flag set

2. **src/App.jsx**
   - Removed `alert()` from `handleAddToCart()`
   - Changed to console.info only

3. **src/components/3D/ConfiguratorModel.jsx**
   - Import `isDebugUIEnabled()`
   - Gate debug overlay creation with `if (isDebugUIEnabled())`

4. **src/components/UI/Interface.jsx**
   - Removed `alert()` from `handleAddToCart()` (legacy component)

## Verification Checklist

- [ ] Production URL shows no debug UI
- [ ] Preview URL shows no debug UI
- [ ] Local without flags shows no debug UI
- [ ] Local with `?debug=1` shows debug overlay
- [ ] "Add to Cart" works without popups
- [ ] Language switch (DE/EN) works without popups
- [ ] Parent receives `configChanged` messages
- [ ] Console logging still works in all environments

## Parent Integration (No Changes Required)

The message protocol remains unchanged:
- ✅ `UNBREAK_CONFIG_READY` - Still sent
- ✅ `UNBREAK_GET_LANG` - Still sent
- ✅ `UNBREAK_SET_LANG` - Still handled
- ✅ `UNBREAK_LANG_ACK` - Still sent
- ✅ `configChanged` - Still sent with reason='add_to_cart'

Only internal UI behavior changed - no parent-side changes needed.
