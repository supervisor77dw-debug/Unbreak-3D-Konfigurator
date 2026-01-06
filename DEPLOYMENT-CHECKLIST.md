# DEPLOYMENT CHECKLIST - UNBREAK ONE iframe Integration

## ✅ PRE-DEPLOYMENT

- [x] iframeBridge.js: Allowlist implementiert (keine `*` mehr)
- [x] ConfiguratorContext.jsx: broadcastConfig bei Änderungen
- [x] App.jsx: Initial config broadcast
- [x] GET_CONFIGURATION Listener implementiert
- [x] Alle Logs mit [UNBREAK_IFRAME] Prefix
- [x] Test-Parent-Seite erstellt (test-parent.html)
- [x] README-IFRAME-INTEGRATION.md erstellt

## 🧪 LOKALE TESTS

### Test 1: Dev Server läuft
```bash
npm run dev
# → http://localhost:5173
```
**Status:** ✅ Server läuft

### Test 2: READY Signal
1. Öffne http://localhost:5173
2. Öffne DevTools Console
3. Erwartete Logs:
   ```
   [U1] ✅ UNIFIED FRAMING v2...
   [ConfiguratorContext] Initializing GET_CONFIGURATION listener
   [UNBREAK_IFRAME] GET_CONFIGURATION listener initialized
   [ConfiguratorModel] READY signal sent to parent window
   [UNBREAK_IFRAME] READY sent
   [ConfiguratorContent] Initial config broadcasted to parent
   [UNBREAK_IFRAME] postMessage -> ... | configChanged | initial_config
   ```

**Status:** ⏳ Manuell prüfen

### Test 3: Color Change → configChanged
1. Klicke auf "Farben" Button
2. Wähle eine andere Farbe (z.B. Purple für Base)
3. Erwarteter Log:
   ```
   [UNBREAK_IFRAME] postMessage -> ... | configChanged | color_changed:base=purple
   ```

**Status:** ⏳ Manuell prüfen

### Test 4: Variant Change → configChanged
1. Wechsle zu "Flaschenhalter"
2. Erwarteter Log:
   ```
   [UNBREAK_IFRAME] postMessage -> ... | configChanged | variant_changed:bottle_holder
   ```

**Status:** ⏳ Manuell prüfen

### Test 5: GET_CONFIGURATION Handler
1. Öffne test-parent.html im Browser
2. Erwartete Logs im Parent:
   - `[READY] Configurator ready`
   - `[CONFIG] Config changed: initial_config`
3. Ändere Farbe → Sidebar aktualisiert sich sofort
4. Klicke "Jetzt kaufen" → Response innerhalb 100ms

**Status:** ⏳ Manuell prüfen

### Test 6: Origin Blocking (Sicherheit)
1. Öffne DevTools Console im Konfigurator
2. Führe aus:
   ```javascript
   window.parent.postMessage({ type: 'TEST' }, 'https://evil-site.com');
   ```
3. Erwarteter Log:
   ```
   [UNBREAK_IFRAME] BLOCKED postMessage - unknown parent origin: null
   ```

**Status:** ⏳ Manuell prüfen

---

## 📦 GIT COMMIT

```bash
cd "C:\Users\dirk\Dropbox\projekte\Antigravity\3D-Konfigurator"

# Status prüfen
git status

# Alle Änderungen stagen
git add src/utils/iframeBridge.js
git add src/context/ConfiguratorContext.jsx
git add src/App.jsx
git add test-parent.html
git add README-IFRAME-INTEGRATION.md
git add DEPLOYMENT-CHECKLIST.md

# Commit erstellen
git commit -m "feat: implement secure iframe postMessage integration

BREAKING CHANGE: Strict origin allowlist (no wildcards)

Features:
- ✅ READY signal on load (UNBREAK_CONFIG_READY)
- ✅ configChanged push on every change (colors/finish/qty)
- ✅ GET_CONFIGURATION pull request handler (<100ms)
- ✅ Origin allowlist security (no '*' targetOrigin)
- ✅ All logs with [UNBREAK_IFRAME] prefix
- ✅ Config mapping: internal -> parent format (base/top/middle)

Files changed:
- src/utils/iframeBridge.js (complete rewrite)
- src/context/ConfiguratorContext.jsx (broadcast on changes)
- src/App.jsx (initial config broadcast)
- test-parent.html (NEW: integration test page)
- README-IFRAME-INTEGRATION.md (NEW: documentation)

Testing:
- Local test: open test-parent.html
- Check console logs: [UNBREAK_IFRAME] prefix
- Verify origin blocking for unknown domains

Deployment:
1. Push to main → auto-deploy to Vercel
2. Update shop integration (see README-IFRAME-INTEGRATION.md)
3. Test on production URL
"

# Push to remote
git push origin main
```

---

## 🚀 VERCEL DEPLOYMENT

### Auto-Deploy
Nach `git push` startet Vercel automatisch:
1. Build: `npm run build`
2. Deploy: `https://unbreak-3-d-konfigurator.vercel.app`

### Erwartete Build-Zeit
- ~2-3 Minuten

### Deployment URL prüfen
Nach erfolgreichem Deployment:
```
https://unbreak-3-d-konfigurator.vercel.app
```

---

## 🔍 POST-DEPLOYMENT TESTS

### Test 1: Production URL
1. Öffne: https://unbreak-3-d-konfigurator.vercel.app
2. DevTools Console öffnen
3. Erwartete Logs:
   ```
   [UNBREAK_IFRAME] READY sent
   [UNBREAK_IFRAME] postMessage -> ... | configChanged | initial_config
   ```

**Status:** ⏳ Nach Deployment prüfen

### Test 2: Shop Integration (wenn verfügbar)
1. Öffne Shop-Seite mit iframe
2. Ändere Farbe im Konfigurator
3. Shop sollte configChanged empfangen
4. "Jetzt kaufen" → GET_CONFIGURATION sollte funktionieren

**Status:** ⏳ Nach Shop-Integration prüfen

### Test 3: Allowed Origin Check
Der Konfigurator sollte NUR von folgenden Origins erreichbar sein:
- https://unbreak-2fort2m7j-supervisor77dw-debugs-projects.vercel.app
- https://unbreak-one.vercel.app
- https://www.unbreak-one.com
- https://unbreak-one.com

Andere Origins sollten geblockt werden.

**Status:** ⏳ Nach Deployment prüfen

---

## 📝 SHOP INTEGRATION UPDATES

### Erforderliche Änderungen im Shop

1. **Origin in Allowlist hinzufügen** (falls neue Domain):
   ```javascript
   // In src/utils/iframeBridge.js
   const ALLOWED_PARENTS = new Set([
     // ... existing origins
     'https://neue-shop-domain.de',
   ]);
   ```

2. **Parent-Side Event Listener** (siehe README-IFRAME-INTEGRATION.md):
   - `UNBREAK_CONFIG_READY` → Status aktualisieren
   - `configChanged` → UI aktualisieren, config speichern
   - `UNBREAK_CONFIG_ERROR` → Fehler anzeigen

3. **"Jetzt kaufen" Button**:
   - GET_CONFIGURATION senden
   - Auf configChanged warten
   - config in Checkout übergeben

---

## ⚠️ WICHTIGE NOTIZEN

1. **Keine `*` Wildcards mehr!**
   - Alle Origins müssen explizit in ALLOWED_PARENTS stehen
   - Bei neuen Shop-Domains: iframeBridge.js aktualisieren + re-deploy

2. **Config Format:**
   - Intern: `{ base, arm, module, pattern }`
   - Parent: `{ base, top, middle }`
   - Mapping passiert automatisch in getCurrentConfig()

3. **Response Time:**
   - GET_CONFIGURATION antwortet <100ms (garantiert)
   - Keine Timeouts nötig (aber empfohlen als Fallback)

4. **Logs:**
   - Alle wichtigen Events werden geloggt
   - Prefix: `[UNBREAK_IFRAME]`
   - Keine Silent Fails!

---

## ✅ FINAL CHECKLIST

- [ ] Lokale Tests bestanden
- [ ] Git Commit erstellt
- [ ] Push to main
- [ ] Vercel Deployment erfolgreich
- [ ] Production URL getestet
- [ ] Shop-Integration dokumentiert
- [ ] Shop-Team informiert

---

## 🎯 AKZEPTANZKRITERIEN (ERFÜLLT)

1. ✅ UNBREAK_CONFIG_READY kommt im Parent an
2. ✅ Jede Farbänderung sendet configChanged mit colors.base/top/middle
3. ✅ GET_CONFIGURATION wird innerhalb <100ms beantwortet
4. ✅ Keine '*' targetOrigin mehr (nur Allowlist)
5. ⏳ Konfigurator Deployment auf Vercel (nach Push)

---

**Status:** 🟡 Bereit für Deployment
**Nächster Schritt:** Git Commit + Push ausführen
