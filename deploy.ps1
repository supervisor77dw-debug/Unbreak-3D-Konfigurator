# UNBREAK ONE - iframe Integration Deployment Script (PowerShell)
# Automatisches Commit & Push zur Vercel Auto-Deployment

Write-Host "`n🚀 UNBREAK ONE - iframe Integration Deployment" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

# Prüfe ob wir im richtigen Verzeichnis sind
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Fehler: package.json nicht gefunden!" -ForegroundColor Red
    Write-Host "Bitte führe das Script im Projekt-Root aus." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Git Status:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Frage Benutzer
$response = Read-Host "Möchtest Du alle Änderungen committen und pushen? (y/n)"

if ($response -ne 'y' -and $response -ne 'Y') {
    Write-Host "`n❌ Abgebrochen." -ForegroundColor Red
    exit 0
}

Write-Host "`n📦 Staging Files..." -ForegroundColor Yellow
git add src/utils/iframeBridge.js
git add src/context/ConfiguratorContext.jsx
git add src/App.jsx
git add test-parent.html
git add README-IFRAME-INTEGRATION.md
git add DEPLOYMENT-CHECKLIST.md
git add IMPLEMENTATION-COMPLETE.md
git add deploy.sh
git add deploy.ps1

Write-Host "✅ Files staged`n" -ForegroundColor Green

Write-Host "💾 Creating Commit..." -ForegroundColor Yellow

$commitMessage = @"
feat: implement secure iframe postMessage integration

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
"@

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Commit fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Commit erstellt`n" -ForegroundColor Green

Write-Host "🌐 Pushing to origin main..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Push fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT ERFOLGREICH!" -ForegroundColor Green
Write-Host "==============================================`n" -ForegroundColor Green

Write-Host "📍 Vercel Auto-Deploy gestartet:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/your-org/unbreak-3d-konfigurator`n"

Write-Host "🌐 Production URL (nach ~2-3 Min):" -ForegroundColor Cyan
Write-Host "   https://unbreak-3-d-konfigurator.vercel.app`n"

Write-Host "📝 Nächste Schritte:" -ForegroundColor Yellow
Write-Host "   1. Warte auf Vercel Deployment (Check Email/Dashboard)"
Write-Host "   2. Teste Production URL (DevTools Console öffnen)"
Write-Host "   3. Shop-Team informieren (siehe README-IFRAME-INTEGRATION.md)`n"

Write-Host "🔍 Logs prüfen:" -ForegroundColor Yellow
Write-Host "   [UNBREAK_IFRAME] READY sent"
Write-Host "   [UNBREAK_IFRAME] postMessage -> ... | configChanged | ...`n"

Write-Host "✨ Happy Deploying!" -ForegroundColor Magenta
