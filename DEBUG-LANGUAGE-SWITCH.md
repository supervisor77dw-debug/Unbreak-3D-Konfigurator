# 🔍 Language Switch - Debug Report & Implementation

**Datum:** 2026-01-11  
**Status:** ✅ Instrumentation vollständig implementiert

---

## 📋 Implementierte Änderungen

### 1. Globale Message-Instrumentation

**Datei:** [src/App.jsx](src/App.jsx#L11-L19)

```javascript
// GLOBAL MESSAGE INSTRUMENTATION (DEBUG)
window.addEventListener('message', (event) => {
  if (!event?.data) return;
  
  const payloadKeys = Object.keys(event.data).join(',');
  console.info(`[IFRAME][MSG_IN] origin=${event.origin} type=${event.data.type || 'N/A'} payload={${payloadKeys}}`);
}, true); // Capture phase - logs BEFORE other listeners
```

**Zweck:** 
- Jede eingehende Message wird geloggt (auch blockierte)
- Läuft in Capture-Phase → garantiert erste Log-Ausgabe
- Zeigt Origin, Type und Payload-Keys

---

### 2. Erweiterte Language-Logs

**Datei:** [src/i18n/LanguageContext.jsx](src/i18n/LanguageContext.jsx#L90-L125)

#### Bei Message-Empfang:

```javascript
console.info(`[IFRAME][LANG] received lang=${newLang} via ${receivedVia}`);
```

#### Bei Origin-Validierung:

```javascript
// Erfolg: stumm (nur [IFRAME][MSG_IN] zeigt es)
// Blockiert:
console.warn(`[IFRAME][SECURITY] blocked origin=${event.origin}`);
```

#### Vor/Nach Language-Switch:

```javascript
const i18nBefore = language;
console.info(`[IFRAME][LANG] i18n.before=${i18nBefore} i18n.after=${newLang}`);
```

#### Re-render Trigger:

```javascript
setRerenderTick(prev => {
  const next = prev + 1;
  console.info(`[IFRAME][LANG] rerenderTick=${next}`);
  return next;
});
```

#### ACK Senden:

```javascript
console.info(`[IFRAME][ACK_OUT] sent lang=${newLang} targetOrigin=${event.origin}`);
```

---

### 3. Re-render Mechanismus

**Datei:** [src/i18n/LanguageContext.jsx](src/i18n/LanguageContext.jsx#L34)

```javascript
const [rerenderTick, setRerenderTick] = useState(0);

// ... beim Language-Switch:
setRerenderTick(prev => prev + 1);

// Provider mit Key:
<LanguageContext.Provider 
  value={{ language, setLanguage, t }} 
  key={`lang-${language}-${rerenderTick}`}
>
  {children}
</LanguageContext.Provider>
```

**Effekt:**
- Bei jedem Language-Switch → `rerenderTick` erhöht sich
- Provider bekommt neuen Key → React remounted ALLE Kinder
- Garantiert Re-render, auch wenn Komponenten nicht optimal implementiert sind

---

### 4. ACK-Mechanismus (verbessert)

**Datei:** [src/i18n/LanguageContext.jsx](src/i18n/LanguageContext.jsx#L114-L119)

```javascript
const ackPayload = {
  type: 'UNBREAK_LANG_ACK',
  lang: newLang,
  ...(msg.correlationId && { correlationId: msg.correlationId })
};
event.source?.postMessage(ackPayload, event.origin);
```

**Features:**
- ✅ `correlationId` wird durchgereicht (für Request/Response-Tracking)
- ✅ `event.origin` als `targetOrigin` (kein Wildcard)
- ✅ Geht IMMER raus (kein conditional)

---

### 5. UI-Komponenten (alle i18n-ready)

Alle UI-Komponenten verwenden jetzt `useLanguage()`:

#### Bereits vorher fertig:
- ✅ [TopBar.jsx](src/components/UI/TopBar.jsx) 
- ✅ [ColorPicker.jsx](src/components/UI/ColorPicker.jsx)

#### Neu implementiert:
- ✅ [Interface.jsx](src/components/UI/Interface.jsx) - Alle Labels übersetzt
- ✅ [ModuleSelector.jsx](src/components/UI/ModuleSelector.jsx) - Glasvarianten übersetzt
- ✅ [PanelHost.jsx](src/components/UI/PanelHost.jsx) - Panel-Titel + Info-Texte übersetzt

**Keine hart-kodierten deutschen Texte mehr!**

---

## 🧪 Testseite

**Datei:** [public/test-parent-lang.html](public/test-parent-lang.html)

### Zugriff:

```bash
npm run dev
# Dann öffnen: http://localhost:5173/test-parent-lang.html
```

### Features:

✅ **DE/EN Buttons** - Simulieren Homepage Language-Switch  
✅ **Live Status Counter** - Zeigt DE/EN/ACK Counts  
✅ **Console Log** - Alle Messages werden geloggt  
✅ **Correlation IDs** - Request/Response-Tracking  
✅ **Handshake Test** - `UNBREAK_ONE_PARENT_HELLO` senden  

### Erwartetes Verhalten:

1. **Klick auf "Switch to ENGLISH"**
   - UI wechselt zu Englisch (< 1s)
   - TopBar: "Konfigurator" → "Configurator"
   - Buttons: "Glashalter" → "Glass Holder"
   - Actions: "Farben" → "Colors"

2. **Console Output (iframe):**
   ```
   [IFRAME][MSG_IN] origin=http://localhost:5173 type=UNBREAK_SET_LANG payload={type,lang,correlationId}
   [IFRAME][LANG] received lang=en via UNBREAK_SET_LANG
   [IFRAME][LANG] i18n.before=de i18n.after=en
   [IFRAME][LANG] rerenderTick=1
   [IFRAME][ACK_OUT] sent lang=en targetOrigin=http://localhost:5173
   ```

3. **Console Output (parent):**
   ```
   [PARENT] 📤 SENT: UNBREAK_SET_LANG lang=en
   [PARENT] ✅ ACK received: lang=en correlationId=...
   ```

---

## ✅ Abnahmekriterien (Checkliste)

### Testseite (localhost)

- [ ] Dev-Server läuft (`npm run dev`)
- [ ] Testseite öffnen: `http://localhost:5173/test-parent-lang.html`
- [ ] Klick "Switch to ENGLISH" → UI wird englisch (<1s)
- [ ] Klick "Switch to GERMAN" → UI wird deutsch (<1s)
- [ ] ACK Counter erhöht sich bei jedem Switch
- [ ] Console zeigt alle `[IFRAME][LANG]` Logs
- [ ] Console zeigt alle `[IFRAME][ACK_OUT]` Logs
- [ ] Keine Errors in Console

### Production Homepage (unbreak-one.vercel.app)

- [ ] Homepage öffnen
- [ ] Konfigurator-Seite aufrufen
- [ ] DE/EN Menu-Switch klicken
- [ ] iframe wechselt Sprache sichtbar (<1s)
- [ ] Keine Alerts/Popups (nur console logs)
- [ ] **Farben:** "Grün" → "Green", "Eisblau" → "Ice Blue"
- [ ] **Produkte:** "Glashalter" → "Glass Holder"
- [ ] **Actions:** "Farben", "Aktionen" → "Colors", "Actions"
- [ ] **Buttons:** "In den Warenkorb" → "Add to Cart"

---

## 🔧 Troubleshooting

### Problem 1: UI bleibt deutsch

**Symptom:** 
```
✅ [IFRAME][LANG] received lang=en
✅ [IFRAME][LANG] i18n.before=de i18n.after=en
✅ [IFRAME][LANG] rerenderTick=1
❌ UI zeigt weiterhin deutsche Texte
```

**Diagnose:**
- Komponente verwendet nicht `useLanguage()` Hook
- Oder: hart-kodierte Strings

**Lösung:**
1. Prüfe Komponente: `const { t } = useLanguage()`
2. Prüfe Texte: `t('ui.addToCart')` statt `"In den Warenkorb"`
3. Re-render sollte durch `rerenderTick` erzwungen werden

---

### Problem 2: Message kommt nicht an

**Symptom:**
```
❌ Kein [IFRAME][MSG_IN] Log
```

**Diagnose:**
- iframe ist nicht geladen
- Oder: Message wird an falsche Origin gesendet

**Lösung:**
1. Prüfe iframe.src - stimmt die URL?
2. Prüfe postMessage targetOrigin - matcht sie iframe.src?
3. Warte bis iframe vollständig geladen ist

---

### Problem 3: Origin blocked

**Symptom:**
```
✅ [IFRAME][MSG_IN] origin=https://new-domain.com type=UNBREAK_SET_LANG
❌ [IFRAME][SECURITY] blocked origin=https://new-domain.com
```

**Diagnose:**
- Origin ist nicht in Whitelist

**Lösung:**
Erweitere Whitelist in [LanguageContext.jsx](src/i18n/LanguageContext.jsx):
```javascript
const ALLOWED_ORIGINS = [
    'https://unbreak-one.vercel.app',
    'https://new-domain.com',  // ← Neue Domain hinzufügen
    // ...
];
```

---

### Problem 4: ACK geht nicht raus

**Symptom:**
```
✅ [IFRAME][LANG] received lang=en
✅ [IFRAME][LANG] i18n.before=de i18n.after=en
❌ Kein [IFRAME][ACK_OUT] Log
```

**Diagnose:**
- `event.source` ist null
- Oder: Code-Exception vor ACK

**Lösung:**
1. Prüfe Browser-Console auf Errors
2. Prüfe: Wird Message via `postMessage()` gesendet (nicht direkt event.data = ...)?
3. Test: Sende Message manuell via DevTools

---

## 📊 Log-Format-Referenz

### Message Eingang (alle Messages)

```
[IFRAME][MSG_IN] origin=<origin> type=<type> payload={key1,key2,...}
```

**Beispiel:**
```
[IFRAME][MSG_IN] origin=https://unbreak-one.vercel.app type=UNBREAK_SET_LANG payload={type,lang,correlationId}
```

---

### Language-Switch Sequenz

```
[IFRAME][LANG] received lang=<de|en> via <UNBREAK_SET_LANG|UNBREAK_SET_LOCALE>
[IFRAME][LANG] i18n.before=<old> i18n.after=<new>
[IFRAME][LANG] rerenderTick=<number>
[IFRAME][ACK_OUT] sent lang=<lang> targetOrigin=<origin>
```

**Beispiel:**
```
[IFRAME][LANG] received lang=en via UNBREAK_SET_LANG
[IFRAME][LANG] i18n.before=de i18n.after=en
[IFRAME][LANG] rerenderTick=1
[IFRAME][ACK_OUT] sent lang=en targetOrigin=https://unbreak-one.vercel.app
```

---

### Security Block

```
[IFRAME][SECURITY] blocked origin=<origin>
```

**Beispiel:**
```
[IFRAME][SECURITY] blocked origin=https://evil-site.com
```

---

### Invalid Language

```
[IFRAME][LANG] invalid language=<lang>
```

**Beispiel:**
```
[IFRAME][LANG] invalid language=fr
```

---

## 🚀 Nächste Schritte

### Phase 1: Lokaler Test ✅ (fertig)

- [x] Instrumentation implementiert
- [x] Testseite erstellt
- [x] Alle UI-Komponenten i18n-ready
- [x] Re-render Mechanismus implementiert

### Phase 2: Lokaler Funktionstest 🔄 (anstehend)

- [ ] Dev-Server starten
- [ ] Testseite aufrufen
- [ ] DE ↔ EN Switch testen
- [ ] Console-Logs verifizieren
- [ ] Screenshot der Logs erstellen

### Phase 3: Production Test 🔄 (anstehend)

- [ ] Deploy auf Vercel
- [ ] Teste auf unbreak-one.vercel.app
- [ ] Teste DE/EN Switch im Menü
- [ ] Console-Logs in Production prüfen
- [ ] Origin-Whitelist ggf. erweitern

---

## 📸 Screenshot-Checkliste

Für finale Abnahme bitte Screenshots/Logs liefern:

### 1. Testseite - Erfolgreicher Switch
```
[Console-Log kopieren]
```

### 2. Testseite - UI Vorher/Nachher
- Screenshot: UI auf Deutsch
- Screenshot: UI auf Englisch

### 3. Production - Erfolgreicher Switch
```
[Console-Log kopieren]
```

### 4. Production - UI Vorher/Nachher
- Screenshot: Homepage DE → Konfigurator DE
- Screenshot: Homepage EN → Konfigurator EN

---

## 💾 Commit-Message

```
feat: Add comprehensive language switch instrumentation

- Add global message listener in App.jsx for debug logging
- Enhance LanguageContext with before/after logs and rerenderTick
- Implement ACK mechanism with correlationId support
- Add origin blocking logs ([IFRAME][SECURITY])
- Create test-parent-lang.html for isolated testing
- Fix all UI components to use useLanguage() (no hardcoded strings)
- Add PanelHost.jsx i18n support

Log format:
- [IFRAME][MSG_IN] origin=... type=... payload={...}
- [IFRAME][LANG] received lang=... via ...
- [IFRAME][LANG] i18n.before=... i18n.after=...
- [IFRAME][LANG] rerenderTick=...
- [IFRAME][ACK_OUT] sent lang=... targetOrigin=...
- [IFRAME][SECURITY] blocked origin=...

Test page: http://localhost:5173/test-parent-lang.html
```

---

**Ende des Reports**
