# i18n Protocol - Implementation Verification

## 🔒 Verbindliches Kommunikations-Protokoll

### Events (fix)
- `UNBREAK_GET_LANG` - iFrame requests language from parent
- `UNBREAK_SET_LANG` - Parent sets language in iFrame
- `UNBREAK_LANG_ACK` - iFrame confirms language change

### Payload (fix)
```javascript
// Parent → iFrame
{
  type: "UNBREAK_SET_LANG",
  lang: "de" | "en"
}

// iFrame → Parent
{
  type: "UNBREAK_GET_LANG"
}

// iFrame → Parent
{
  type: "UNBREAK_LANG_ACK",
  lang: "de" | "en"
}
```

## ✅ Implementation Checklist

### 1. Listener EXISTS
- ✅ **File**: `src/i18n/LanguageContext.jsx`
- ✅ **Line**: ~70
- ✅ Listens for `UNBREAK_SET_LANG`
- ✅ Origin validation (whitelist + pattern matching)

### 2. Language APPLIED
- ✅ **State**: `setLanguage(newLang)` called
- ✅ **Context**: All UI components use `t()` helper
- ✅ **Files**: TopBar.jsx, App.jsx, ColorPicker.jsx, PanelHost.jsx
- ✅ **No Reload**: Pure React state change

### 3. ACK SENT
- ✅ **Always**: After `setLanguage()`
- ✅ **Target**: `event.origin` (validated)
- ✅ **Payload**: `{ type: 'UNBREAK_LANG_ACK', lang: appliedLang }`

### 4. Init Flow
- ✅ **On Mount**: `postMessage({ type: 'UNBREAK_GET_LANG' }, '*')`
- ✅ **Fallback**: 500ms timeout → default 'de'
- ✅ **URL Override**: `?lang=en` takes priority

### 5. Debug Logs (verbindlich)
```javascript
// iFrame logs (LanguageContext.jsx)
console.info('[LANG][IFRAME][RECEIVED] de from https://...');
console.info('[LANG][IFRAME][APPLIED] de');
console.info('[LANG][IFRAME->PARENT][ACK] de');
console.info('[LANG][IFRAME->PARENT][GET_LANG] Requesting...');
console.info('[LANG][IFRAME][FALLBACK] No response, using default: de');
```

### 6. UI Blocker Check
- ✅ **NO Alerts**: Removed from `handleAddToCart()`
- ✅ **NO Badges**: Debug overlay gated by `isDebugUIEnabled()`
- ✅ **NO Banners**: Only console logs
- ✅ **Console Only**: All debugging via `console.info/warn`

## 🧪 Test Flow

### Expected Console Output (iFrame)
```
[LANG][IFRAME][LISTENER] UNBREAK_SET_LANG listener ready
[LANG][IFRAME->PARENT][GET_LANG] Requesting language from parent...
[LANG][IFRAME][RECEIVED] de from http://localhost:3000
[LANG][IFRAME][APPLIED] de
[LANG][IFRAME->PARENT][ACK] de
```

### Expected Console Output (Parent)
```
[LANG][PARENT][RECEIVED] UNBREAK_GET_LANG request from iframe
[LANG][PARENT->IFRAME][SET_LANG] de
[LANG][PARENT][ACK_RECEIVED] de
✅ Language synchronized: de
```

### Language Switch Test
1. **Parent sends**: `UNBREAK_SET_LANG` with `lang: 'en'`
2. **iFrame receives**: Logs `[LANG][IFRAME][RECEIVED] en`
3. **iFrame applies**: UI changes to English
4. **iFrame sends**: `UNBREAK_LANG_ACK` with `lang: 'en'`
5. **Parent receives**: ACK confirmation
6. **Time**: < 1 second, no page reload

## 📁 Modified Files

1. **src/i18n/LanguageContext.jsx**
   - Added `UNBREAK_GET_LANG` request on mount
   - Added 500ms fallback timer
   - Updated debug logs to `[LANG][IFRAME]` format
   - Ensured ACK is ALWAYS sent

2. **src/utils/iframeBridge.js**
   - Removed duplicate `UNBREAK_GET_LANG` (now in LanguageContext)
   - Updated comment

3. **test-external-i18n.html**
   - Updated parent logs to `[LANG][PARENT]` format
   - Added language synchronization check

## ⚠️ Known Edge Cases

### Scenario 1: Parent doesn't respond
- **Behavior**: After 500ms, iFrame uses default 'de'
- **Log**: `[LANG][IFRAME][FALLBACK] No response from parent, using default: de`

### Scenario 2: Invalid language
- **Behavior**: Language change rejected
- **Log**: `[LANG][IFRAME][INVALID] Unsupported language: xyz`
- **No ACK sent**

### Scenario 3: Invalid origin
- **Behavior**: Message blocked
- **Log**: `[LANG][IFRAME][BLOCKED] Invalid origin: https://evil.com`
- **No ACK sent**

### Scenario 4: URL parameter present
- **Behavior**: Skip `UNBREAK_GET_LANG`, use URL param immediately
- **Log**: `[LANG][IFRAME][INIT] Language from URL: en`
- **No fallback needed**

## 🎯 Acceptance Criteria - VERIFIED

- ✅ **Sprache ändert sich live**: React state update, no reload
- ✅ **ACK wird immer gesendet**: After successful `setLanguage()`
- ✅ **Parent & iFrame identisch**: Verified via ACK payload
- ✅ **iFrame bleibt nicht stumm**: All events logged + ACK sent
- ✅ **Keine UI-Blocker**: No alerts, no popups, only console
- ✅ **Init-Flow funktioniert**: GET_LANG → SET_LANG → ACK

## 🚀 Quick Test

### Start Dev Server
```bash
npm run dev
```

### Open Test Page
```
test-external-i18n.html
```

### Verify Logs
1. Open Browser DevTools (F12)
2. Check Console for `[LANG][IFRAME]` logs
3. Click DE/EN buttons in test page
4. Verify UI changes in iFrame
5. Verify ACK appears in parent console
6. Confirm < 1s response time

### Production Test
```
https://unbreak-one.vercel.app
```
- No debug overlay visible
- Language switch works
- Console logs present (DevTools only)
- No alerts/popups
