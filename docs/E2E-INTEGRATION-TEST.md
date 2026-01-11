# E2E INTEGRATION TEST – Config + Shop

**Ziel**: Reproduzierbarer End-to-End Test für Shop ↔ Config Integration über Vercel Deployments.

**Grundregel**: Nur Tests über Preview/Production URLs sind gültig. Keine lokalen Tests als Freigabekriterium.

---

## SETUP / SOURCE OF TRUTH

**Shop Repo**: Vercel Project "UNBREAK-ONE"
- Production: https://www.unbreak-one.com
- Preview: `https://unbreak-one-<hash>.vercel.app` (von Vercel bereitgestellt)

**Config Repo**: Vercel Project "3D Config"
- Production: https://config.unbreak-one.com (oder https://unbreak-3-d-konfigurator.vercel.app)
- Preview: `https://unbreak-3-d-konfigurator-<hash>.vercel.app` (von Vercel bereitgestellt)

**Test-Kombination**: Immer **Preview ↔ Preview** ODER **Production ↔ Production**. Kein Mix.

---

## BUILD-STAMP VERIFIZIERUNG (Vorbedingung)

Beide Apps müssen Build-Stamp in Console loggen:

**Shop**: `console.info("[BUILD]", { app: "shop", env: "preview|prod", commit: "<sha>", buildTime: "<iso>" })`

**Config**: `console.info("[BUILD]", { app: "config", commit: "<sha>", time: "<iso>" })`

**Verifikation**:
1. Shop öffnen → DevTools Console → `[BUILD]` Eintrag suchen
2. Config öffnen → DevTools Console → `[BUILD]` Eintrag suchen
3. Screenshots machen (Commit SHA sichtbar)

---

## TEST 1 – Basis: Config öffnet korrekt aus Shop

**Schritte**:
1. Shop öffnen (Preview-URL)
2. Language Switch auf EN klicken
3. Menüpunkt "Konfigurator" / "Configurator" klicken

**Erwartung**:
- ✅ Config öffnet als **eigenständige Seite** (neue URL, kein iframe)
- ✅ Config übernimmt `lang=en` (UI ist auf Englisch)
- ✅ URL enthält Query-Parameter: `?lang=en&return=<encodedShopURL>`
- ✅ Console zeigt Build-Stamp für **beide Apps** (Shop + Config)

**Fehlschläge dokumentieren**:
- Config öffnet nicht: _______________________
- Language nicht übernommen: _______________________
- Build-Stamp fehlt: _______________________

---

## TEST 2 – Language Switch: Shop → Config

**Schritte**:
1. Im Shop DE wählen, Config öffnen
   - **Erwartung**: Config UI ist auf Deutsch
2. Zurück zum Shop, EN wählen, Config öffnen
   - **Erwartung**: Config UI ist auf Englisch

**Verifikation**:
- ✅ URL zeigt `?lang=de` bzw. `?lang=en`
- ✅ UI-Texte (TopBar, Interface, ModuleSelector) korrekt übersetzt
- ✅ **Kein Reload nötig** beim Sprachwechsel innerhalb Config (aber beim Öffnen korrekt)

**Fehlschläge dokumentieren**:
- Language nicht korrekt: _______________________
- UI bleibt in falscher Sprache: _______________________

---

## TEST 3 – Add-to-cart Rückgabeweg (cfgId / Redirect)

**Schritte**:
1. In Config eine Konfiguration wählen (Farbe, Variante, Finish)
2. "Add to Cart" / "In den Warenkorb" Button klicken

**Erwartung (Network Tab)**:
- ✅ POST zu `https://www.unbreak-one.com/api/config-session`
- ✅ Response: `200 OK` mit `{ cfgId: "<uuid>" }`
- ✅ Console Log: `[CONFIG] posting config-session` und `[CONFIG] cfgId=<uuid>`

**Erwartung (Redirect)**:
- ✅ Browser redirected zu Shop mit `?cfgId=<uuid>`
- ✅ Shop fetched GET `/api/config-session/<uuid>` (Network Tab: `200 OK`)
- ✅ Console Log: `[SHOP] cfgId detected: <uuid>` (oder ähnlich)
- ✅ Shop fügt Item dem Cart hinzu (Cart Icon zeigt +1)
- ✅ URL wird bereinigt (cfgId Parameter entfernt nach Add-to-cart)

**Fehlschläge dokumentieren**:
- POST fehlgeschlagen: _______________________
- Redirect nicht erfolgt: _______________________
- Cart nicht aktualisiert: _______________________
- cfgId bleibt in URL: _______________________

---

## TEST 4 – Checkout

**Schritte**:
1. Cart öffnen (sollte konfiguriertes Produkt enthalten)
2. Checkout starten

**Erwartung**:
- ✅ Checkout läuft durch (oder bis Zahlungsseite)
- ✅ Konfiguriertes Produkt sichtbar in Checkout-Übersicht
- ✅ **Kein Hänger** "Konfiguration gespeichert" ohne Weiterleitung
- ✅ Preise korrekt berechnet

**Fehlschläge dokumentieren**:
- Checkout blockt: _______________________
- Produkt fehlt: _______________________
- Preis falsch: _______________________

---

## TEST 5 – Regression: Normale Produkte

**Schritte**:
1. Im Shop ein **normales Produkt** (nicht konfigurierbar) in den Cart legen
2. Cart prüfen
3. Checkout starten

**Erwartung**:
- ✅ Normales Produkt wird korrekt hinzugefügt
- ✅ Cart funktioniert (Count, Preis, UI)
- ✅ Checkout funktioniert (keine Seiteneffekte durch Config-Integration)

**Fehlschläge dokumentieren**:
- Cart defekt: _______________________
- Checkout fehlgeschlagen: _______________________

---

## CONSOLE / LOGGING AUDIT

**Zulässige Prefixes**:
- `[SHOP] ...`
- `[CONFIG] ...`
- `[BUILD] ...`
- `[API] ...`

**Verboten in Production/Preview**:
- UI-Banner ("Ready", "Button not in viewport", etc.)
- Spam-Logs ohne Prefix
- Debug-Overlays

**Warnungen nur bei echten Fehlern**:
- 4xx/5xx Status Codes
- cfgId missing
- Session not found
- CORS errors

---

## CORS / ORIGIN HANDLING

**Whitelist konfigurieren**:
- Shop Preview Domain: `https://unbreak-one-*.vercel.app`
- Shop Production: `https://www.unbreak-one.com`
- Config Preview: `https://unbreak-3-d-konfigurator-*.vercel.app`
- Config Production: `https://config.unbreak-one.com`

**NICHT verwenden**: `*` (wildcard CORS)

**Verifikation**:
- Network Tab: Keine CORS-Fehler bei API-Calls
- Console: Keine "blocked by CORS policy" Meldungen

---

## FREIGABEKRITERIEN (Definition of Done)

Ein Deployment gilt als **produktionsreif**, wenn:

1. ✅ **Alle 5 Tests** im Preview-Deployment erfolgreich
2. ✅ **Schritte und Ergebnisse** in diesem Dokument dokumentiert (z.B. Screenshots, Console-Logs)
3. ✅ **Production Deployment** danach ebenfalls Test 1–5 besteht (Nachtest)
4. ✅ **Commit SHA** in Build-Stamp sichtbar

---

## TEST-PROTOKOLL (Template)

**Datum**: _______________________  
**Tester**: _______________________  
**Shop URL**: _______________________  
**Config URL**: _______________________  
**Shop Commit**: _______________________  
**Config Commit**: _______________________  

| Test | Status | Anmerkungen |
|------|--------|-------------|
| TEST 1 – Basis | ❌ / ✅ |  |
| TEST 2 – Language | ❌ / ✅ |  |
| TEST 3 – Add-to-cart | ❌ / ✅ |  |
| TEST 4 – Checkout | ❌ / ✅ |  |
| TEST 5 – Regression | ❌ / ✅ |  |

**Screenshots**: (Anhängen: Build-Stamp, Console, Cart, Checkout)

**Freigabe**: ❌ / ✅

---

## ROLLBACK-STRATEGIE

Bei fehlgeschlagenen Tests:

1. **Nicht mergen** in Production
2. **Preview-URL** für Debugging nutzen
3. **Kleinen Fix** committen → neues Preview Deployment → erneut testen
4. **Erst bei 5/5 PASS** → Production Merge

**Wichtig**: Lokale Tests sind ok für schnelles Entwickeln, aber **Status = nur Preview/Production**.

---

## NEXT STEPS (nach bestandenen Tests)

Nach erfolgreicher E2E-Freigabe:
- ✅ Production Deployment
- ✅ Post-Deployment Nachtest (Test 1–5)
- ✅ Monitoring für 24h (Console Errors, API 5xx, User Reports)
- ✅ Erst dann: Kosmetische Themen / Features
