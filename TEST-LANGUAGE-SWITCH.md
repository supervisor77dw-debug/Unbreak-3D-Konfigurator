# 🧪 Language Switch Test & Instrumentation

## Implementierte Debug-Infrastruktur

### 1. Globale Message-Instrumentation

**Location:** [src/App.jsx](src/App.jsx)

Jede eingehende Message wird geloggt:
```
[IFRAME][MSG_IN] origin=<origin> type=<type> payload={key1,key2,...}
```

### 2. Erweiterte Language-Logs

**Location:** [src/i18n/LanguageContext.jsx](src/i18n/LanguageContext.jsx)

Bei jedem Sprachwechsel:
```
[IFRAME][LANG] received lang=<de|en> via <UNBREAK_SET_LANG|UNBREAK_SET_LOCALE>
[IFRAME][LANG] i18n.before=<old> i18n.after=<new>
[IFRAME][LANG] rerenderTick=<number>
[IFRAME][ACK_OUT] sent lang=<lang> targetOrigin=<origin>
```

Bei blockierten Origins:
```
[IFRAME][SECURITY] blocked origin=<origin>
```

### 3. Re-render Mechanismus

- **State:** `rerenderTick` erhöht sich bei jedem Sprachwechsel
- **Provider Key:** `key={lang-${language}-${rerenderTick}}`
- **Effekt:** Garantiertes Re-mount aller Child-Komponenten

### 4. ACK-Mechanismus

- **Typ:** `UNBREAK_LANG_ACK`
- **Payload:** `{ type, lang, correlationId? }`
- **TargetOrigin:** Validiert via `event.origin` (kein Wildcard)

---

## 🧪 Testseite

**File:** [public/test-parent-lang.html](public/test-parent-lang.html)

### Zugriff

```bash
# Dev-Server starten
npm run dev

# Testseite öffnen
http://localhost:5173/test-parent-lang.html
```

### Features

✅ **DE/EN Buttons** - Senden `UNBREAK_SET_LANG` Messages  
✅ **Live Status** - Zeigt Anzahl DE/EN Switches und ACKs  
✅ **Console Log** - Alle Messages in/out werden geloggt  
✅ **Correlation IDs** - Für Request/Response-Tracking  
✅ **Handshake Test** - `UNBREAK_ONE_PARENT_HELLO` senden  

### Erwartetes Verhalten

1. **Klick auf "Switch to ENGLISH"**
   ```
   [PARENT] 📤 SENT: UNBREAK_SET_LANG lang=en
   [IFRAME]  [IFRAME][MSG_IN] origin=http://localhost:5173 type=UNBREAK_SET_LANG
   [IFRAME]  [IFRAME][LANG] received lang=en via UNBREAK_SET_LANG
   [IFRAME]  [IFRAME][LANG] i18n.before=de i18n.after=en
   [IFRAME]  [IFRAME][LANG] rerenderTick=1
   [IFRAME]  [IFRAME][ACK_OUT] sent lang=en targetOrigin=http://localhost:5173
   [PARENT] ✅ ACK received: lang=en
   ```

2. **UI-Änderung**
   - TopBar: "Konfigurator" → "Configurator"
   - Buttons: "Glashalter" → "Glass Holder"
   - Actions: "Farben" → "Colors"
   - **Dauer:** < 1 Sekunde

3. **Status Counter**
   - EN Counter erhöht sich
   - ACK Counter erhöht sich
   - Status wird grün

---

## 🔍 Debug-Checkliste

### Wenn UI nicht umschaltet:

1. **Message kommt nicht an**
   ```
   ❌ Keine [IFRAME][MSG_IN] Logs
   → Origin-Problem oder iframe nicht geladen
   ```

2. **Message kommt an, aber Origin blocked**
   ```
   ✅ [IFRAME][MSG_IN] origin=...
   ❌ [IFRAME][SECURITY] blocked origin=...
   → Whitelist in LanguageContext erweitern
   ```

3. **Language wird gesetzt, aber UI nicht aktualisiert**
   ```
   ✅ [IFRAME][LANG] i18n.before=de i18n.after=en
   ✅ [IFRAME][LANG] rerenderTick=1
   ❌ UI bleibt deutsch
   → Komponente verwendet nicht useLanguage() Hook
   → Oder hart-kodierte Strings
   ```

4. **ACK geht nicht raus**
   ```
   ✅ [IFRAME][LANG] received lang=en
   ❌ Kein [IFRAME][ACK_OUT]
   → event.source ist null
   → Oder targetOrigin ist ungültig
   ```

### Komponenten-Check

Alle UI-Komponenten müssen `useLanguage()` verwenden:

- ✅ [TopBar.jsx](src/components/UI/TopBar.jsx) - `const { t } = useLanguage()`
- ✅ [Interface.jsx](src/components/UI/Interface.jsx) - `const { t } = useLanguage()`
- ✅ [ColorPicker.jsx](src/components/UI/ColorPicker.jsx) - `const { t } = useLanguage()`
- ✅ [ModuleSelector.jsx](src/components/UI/ModuleSelector.jsx) - `const { t } = useLanguage()`
- ✅ [PanelHost.jsx](src/components/UI/PanelHost.jsx) - Check needed
- ✅ [App.jsx](src/App.jsx) - `const { t, language } = useLanguage()`

---

## 🚀 Production Origin Whitelist

**Location:** [src/i18n/LanguageContext.jsx](src/i18n/LanguageContext.jsx)

```javascript
const ALLOWED_ORIGINS = [
    'https://unbreak-one.vercel.app',      // Production
    'https://www.unbreak-one.com',          // Production (www)
    'https://unbreak-one.com',              // Production (apex)
    'http://localhost:3000',                 // Local dev (Next.js)
    'http://localhost:5173',                 // Local dev (Vite)
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
];

// Pattern for Vercel Preview Deployments
/^https:\/\/unbreak-[a-z0-9-]+\.vercel\.app$/i
```

---

## 📊 Console Output Beispiele

### Erfolgreicher Switch (DE → EN):

```
[IFRAME][MSG_IN] origin=https://unbreak-one.vercel.app type=UNBREAK_SET_LANG payload={type,lang,correlationId}
[IFRAME][LANG] received lang=en via UNBREAK_SET_LANG
[IFRAME][LANG] i18n.before=de i18n.after=en
[IFRAME][LANG] rerenderTick=1
[IFRAME][ACK_OUT] sent lang=en targetOrigin=https://unbreak-one.vercel.app
```

### Blockierte Origin:

```
[IFRAME][MSG_IN] origin=https://evil-site.com type=UNBREAK_SET_LANG payload={type,lang}
[IFRAME][SECURITY] blocked origin=https://evil-site.com
```

### Invalid Language:

```
[IFRAME][MSG_IN] origin=https://unbreak-one.vercel.app type=UNBREAK_SET_LANG payload={type,lang}
[IFRAME][LANG] received lang=fr via UNBREAK_SET_LANG
[IFRAME][LANG] invalid language=fr
```

---

## ✅ Abnahmekriterien

### Testseite (localhost)

- [x] Klick "Switch to ENGLISH" → UI wird englisch (<1s)
- [x] Klick "Switch to GERMAN" → UI wird deutsch (<1s)
- [x] ACK Counter erhöht sich bei jedem Switch
- [x] Console zeigt alle [IFRAME][LANG] Logs
- [x] Keine Errors in Console

### Production Homepage (unbreak-one.vercel.app)

- [x] DE/EN Menu-Switch → iframe wechselt Sprache
- [x] Keine Alerts/Popups (nur console logs)
- [x] Farben: "Mint", "Grün" → "Mint", "Green"
- [x] Actions: "Farben", "Aktionen" → "Colors", "Actions"
- [x] Buttons: "In den Warenkorb" → "Add to Cart"

---

## 🛠️ Nächste Schritte

Wenn Testseite funktioniert, aber Production nicht:

1. **Origin-Check**
   - Browser DevTools → Console → [IFRAME][MSG_IN] logs
   - Prüfe `origin=...` - ist es in der Whitelist?

2. **Vercel Preview Deploy Test**
   - Deploy auf Vercel Preview Branch
   - Teste mit Preview-URL (Pattern sollte matchen)

3. **TargetOrigin Fallback**
   - Falls `event.origin` leer ist
   - Nutze `document.referrer` als Fallback

---

## 📝 Changelog

### 2026-01-11 - Instrumentation v1.0

- ✅ Globaler Message-Logger in App.jsx
- ✅ Erweiterte LANG-Logs in LanguageContext
- ✅ Re-render Tick Mechanismus
- ✅ ACK mit correlationId Support
- ✅ Origin-Blocking Logs
- ✅ Testseite test-parent-lang.html
