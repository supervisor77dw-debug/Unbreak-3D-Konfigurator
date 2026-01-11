# DEPLOYMENT & INTEGRATION REQUIREMENTS

## VERCEL DEPLOYMENT

**Production Domain**: https://config.unbreak-one.com (oder https://unbreak-3-d-konfigurator.vercel.app)

**Preview Domains**: `https://unbreak-3-d-konfigurator-<hash>.vercel.app`

**Environment Variables (Vercel)**:
- `VITE_VERCEL_GIT_COMMIT_SHA`: Automatisch von Vercel bereitgestellt (für Build-Stamp)

---

## CORS REQUIREMENTS (für Shop API)

Da der Konfigurator im **standalone mode** läuft (keine iframe-Integration), muss die **Shop API** CORS-Header für folgende Origins setzen:

### Production:
```
Access-Control-Allow-Origin: https://config.unbreak-one.com
```

### Preview (Vercel):
```
Access-Control-Allow-Origin: https://unbreak-3-d-konfigurator-*.vercel.app
```

**Shop API Endpoints, die CORS benötigen**:
- `POST https://www.unbreak-one.com/api/config-session`

**Hinweis**: Preview Deployments von Vercel verwenden dynamische Hashes. Shop API muss entweder:
1. Regex-basierte Origin-Whitelist: `/^https:\/\/unbreak-3-d-konfigurator-[a-z0-9-]+\.vercel\.app$/`
2. Oder: Environment Variable `ALLOWED_CONFIG_ORIGINS` mit komma-separierter Liste

**Beispiel (Next.js API Route)**:
```javascript
// Shop: app/api/config-session/route.ts
const allowedOrigins = [
  'https://config.unbreak-one.com',
  /^https:\/\/unbreak-3-d-konfigurator-[a-z0-9-]+\.vercel\.app$/
];

export async function POST(request) {
  const origin = request.headers.get('origin');
  
  // Check origin
  const isAllowed = allowedOrigins.some(allowed => 
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
  );
  
  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  
  // ... API logic
  
  return new Response(JSON.stringify({ cfgId }), { headers });
}
```

---

## API CONTRACT (Config → Shop)

**Endpoint**: `POST https://www.unbreak-one.com/api/config-session`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "lang": "de" | "en",
  "variantKey": "glass_holder" | "bottle_holder",
  "product_sku": "UNBREAK-GLAS-01" | "UNBREAK-FLASCHE-01",
  "config": {
    "product_type": "glass_holder" | "bottle_holder",
    "finish": "matte" | "glossy",
    "quantity": 1,
    "base": "mint" | "green" | "purple" | "ice_blue" | "dark_blue" | "red" | "black",
    "arm": "mint" | "green" | ... (nur bei glass_holder),
    "module": "mint" | "green" | ... (nur bei glass_holder),
    "pattern": "mint" | "green" | ...
  },
  "meta": {
    "source": "config-app",
    "ts": 1704984000000,
    "version": "1.0.0"
  }
}
```

**Response (200 OK)**:
```json
{
  "cfgId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (4xx/5xx)**:
```json
{
  "error": "Invalid configuration",
  "details": "..."
}
```

---

## REDIRECT FLOW

Nach erfolgreicher API-Antwort redirected der Konfigurator zu:

```
<returnUrl>?cfgId=<uuid>
```

**Default Return URL**: `https://www.unbreak-one.com/shop`

**Custom Return URL**: Query-Parameter `?return=<encodedURL>` beim Öffnen der Config

**Beispiele**:
- Config öffnen: `https://config.unbreak-one.com/?lang=en&return=https%3A%2F%2Fwww.unbreak-one.com%2Fshop`
- Nach Add-to-cart: `https://www.unbreak-one.com/shop?cfgId=550e8400-...`

**Shop-seitige Erwartung**:
1. Shop detektiert `?cfgId=` Parameter
2. Fetched `GET /api/config-session/<cfgId>`
3. Fügt Produkt dem Cart hinzu
4. Bereinigt URL (entfernt `cfgId` Parameter)

---

## CONSOLE LOGGING CONVENTIONS

**Prefix**: Alle Logs mit `[CONFIG]` oder `[BUILD]`

**Beispiele**:
```javascript
console.info('[CONFIG] lang=', lang, '(from URL)');
console.info('[CONFIG] posting config-session');
console.info('[CONFIG] cfgId=', cfgId);
console.error('[CONFIG] Add to cart error:', error);
console.info('[BUILD]', { app: 'config', env: 'production', commit: 'abc123', time: '2026-01-11T...' });
```

**Verboten in Production/Preview**:
- UI-Banner (Debug-Overlays)
- Spam-Logs ohne Prefix
- Logs ohne erkennbaren Mehrwert

**Warnungen nur bei echten Fehlern**:
- API 4xx/5xx
- Invalid return URL
- Missing cfgId in response

---

## BUILD STAMP

**Wo**: `src/App.jsx` (useEffect on mount)

**Format**:
```javascript
console.info('[BUILD]', {
  app: 'config',
  env: import.meta.env.MODE, // 'development' | 'production'
  commit: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || 'local',
  time: new Date().toISOString(),
});
```

**Vercel Environment Variables**:
- `VITE_VERCEL_GIT_COMMIT_SHA`: Automatisch gesetzt (short SHA)

**Beispiel-Output**:
```
[BUILD] { app: 'config', env: 'production', commit: 'b4ec7fa', time: '2026-01-11T15:30:00.000Z' }
```

---

## TESTING CHECKLIST (vor Deployment)

Siehe [E2E-INTEGRATION-TEST.md](./E2E-INTEGRATION-TEST.md) für vollständige Test-Routine.

**Quick Check**:
1. ✅ Build-Stamp in Console sichtbar (mit Commit SHA)
2. ✅ Language switching funktioniert (?lang=de|en)
3. ✅ Add-to-cart POST erfolgreich (200 OK)
4. ✅ Redirect zu Shop mit cfgId
5. ✅ Keine CORS-Fehler in Console

---

## ROLLBACK-STRATEGIE

Bei kritischen Fehlern (Blank Page, API Errors):

1. **Sofort**: Git Revert auf letzten stabilen Commit
2. **Deploy**: Vercel triggert automatisch neues Deployment
3. **Verify**: Production URL prüfen (Build-Stamp + funktionsfähige UI)
4. **Fix**: Lokal debuggen, kleinen Fix committen, Preview testen
5. **Redeploy**: Erst bei bestandenem Preview → Production

**Wichtig**: Keine Hotfixes direkt in Production ohne Preview-Test.

---

## CONTACT / SUPPORT

**Config Repo**: https://github.com/supervisor77dw-debug/Unbreak-3D-Konfigurator

**Shop Repo**: [Link zum Shop Repo]

**Vercel Projects**:
- Config: https://vercel.com/[team]/unbreak-3-d-konfigurator
- Shop: https://vercel.com/[team]/unbreak-one

**Bei Fragen**: E2E-Test-Protokoll ausfüllen und Screenshots anhängen.
