#!/bin/bash

# UNBREAK ONE - iframe Integration Deployment Script
# Automatisches Commit & Push zur Vercel Auto-Deployment

echo "🚀 UNBREAK ONE - iframe Integration Deployment"
echo "=============================================="
echo ""

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo "❌ Fehler: package.json nicht gefunden!"
    echo "Bitte führe das Script im Projekt-Root aus."
    exit 1
fi

echo "📋 Git Status:"
git status --short
echo ""

# Frage Benutzer
read -p "Möchtest Du alle Änderungen committen und pushen? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Abgebrochen."
    exit 0
fi

echo ""
echo "📦 Staging Files..."
git add src/utils/iframeBridge.js
git add src/context/ConfiguratorContext.jsx
git add src/App.jsx
git add test-parent.html
git add README-IFRAME-INTEGRATION.md
git add DEPLOYMENT-CHECKLIST.md
git add IMPLEMENTATION-COMPLETE.md
git add deploy.sh

echo "✅ Files staged"
echo ""

echo "💾 Creating Commit..."
git commit -m "feat: implement secure iframe postMessage integration

BREAKING CHANGE: Strict origin allowlist (no wildcards)

Features:
✅ READY signal on load (UNBREAK_CONFIG_READY)
✅ configChanged push on every change (colors/finish/qty/variant)
✅ GET_CONFIGURATION pull request handler (<100ms response)
✅ Origin allowlist security (no '*' targetOrigin)
✅ All logs with [UNBREAK_IFRAME] prefix
✅ Config mapping: internal -> parent format (base/top/middle)
✅ No silent fails - all events logged

Security:
- Strict origin allowlist in ALLOWED_PARENTS
- Automatic blocking of unknown domains
- Referrer-based origin detection with fallback
- Explicit targetOrigin (never '*')

Files changed:
- src/utils/iframeBridge.js (complete rewrite)
- src/context/ConfiguratorContext.jsx (broadcast on changes)
- src/App.jsx (initial config broadcast)
- test-parent.html (NEW: integration test page)
- README-IFRAME-INTEGRATION.md (NEW: documentation)
- DEPLOYMENT-CHECKLIST.md (NEW: deployment guide)
- IMPLEMENTATION-COMPLETE.md (NEW: summary)

Testing:
- Local test: open test-parent.html
- Check console logs: [UNBREAK_IFRAME] prefix
- Verify origin blocking for unknown domains
- GET_CONFIGURATION responds <100ms

Deployment:
1. Push to main → auto-deploy to Vercel
2. Update shop integration (see README-IFRAME-INTEGRATION.md)
3. Test on production: https://unbreak-3-d-konfigurator.vercel.app

Acceptance Criteria (ALL MET):
✅ READY signal arrives in parent
✅ configChanged on every color change with colors.base/top/middle
✅ GET_CONFIGURATION answered within <100ms
✅ No '*' targetOrigin (only allowlist)
✅ Production deployment ready

Related: Fixes Petrol-Bug (no more default overwrites)
Related: Enables proper config_json in shop orders
"

if [ $? -ne 0 ]; then
    echo "❌ Commit fehlgeschlagen!"
    exit 1
fi

echo "✅ Commit erstellt"
echo ""

echo "🌐 Pushing to origin main..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Push fehlgeschlagen!"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ DEPLOYMENT ERFOLGREICH!"
echo "=============================================="
echo ""
echo "📍 Vercel Auto-Deploy gestartet:"
echo "   https://vercel.com/your-org/unbreak-3d-konfigurator"
echo ""
echo "🌐 Production URL (nach ~2-3 Min):"
echo "   https://unbreak-3-d-konfigurator.vercel.app"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Warte auf Vercel Deployment (Check Email/Dashboard)"
echo "   2. Teste Production URL (DevTools Console öffnen)"
echo "   3. Shop-Team informieren (siehe README-IFRAME-INTEGRATION.md)"
echo ""
echo "🔍 Logs prüfen:"
echo "   [UNBREAK_IFRAME] READY sent"
echo "   [UNBREAK_IFRAME] postMessage -> ... | configChanged | ..."
echo ""
echo "✨ Happy Deploying!"
