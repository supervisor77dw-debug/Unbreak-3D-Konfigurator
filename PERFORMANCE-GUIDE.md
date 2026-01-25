# Performance Optimierungen - UNBREAK ONE 3D Konfigurator

## Datum: 2026-01-25
## Branch: fix/mobile-header-lighthouse

---

## BEREITS IMPLEMENTIERT (CSS/JSX)

###  CSS Optimierungen (TopBar.module.css)
- **clamp()** für responsive Spacing (gap, padding)
- **min-width: 0** auf allen flex children (verhindert Overflow)
- **min-height: 44px** auf allen interaktiven Elementen (Touch Targets)
- **focus-visible** für Keyboard Navigation
- **prefers-contrast: high** Support
- **prefers-reduced-motion** Support

###  A11y Verbesserungen (TopBar.jsx)
- **role="banner"** auf header
- **role="navigation"** auf nav (row2)
- **aria-label** auf allen Buttons
- **aria-pressed** auf Toggle-Buttons (Variant, Colors, Actions)
- **aria-hidden="true"** auf dekorativen Icons
- **Semantic HTML** (header, nav, button)
- **Dynamic aria-labels** (icon-only buttons auf small screens)

###  SEO Verbesserungen (index.html)
- **meta description** optimiert
- **meta keywords** hinzugefügt
- **Open Graph** Tags (Facebook/LinkedIn)
- **Twitter Card** Tags
- **Preconnect** zu critical origins
- **dns-prefetch** für bessere Performance
- **Loading Fallback** (aria-live, role="status")

---

## EMPFOHLENE PERFORMANCE-OPTIMIERUNGEN (Code-Splitting)

###  Stufe 1: Lazy Loading (Quick Wins)

#### A) Scene Component lazy loaden
```jsx
// src/App.jsx
import { lazy, Suspense } from 'react';

const Scene = lazy(() => import('./components/3D/Scene'));

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Scene />
    </Suspense>
  );
}
```

**Vorteil:** Three.js wird erst geladen, wenn Scene gerendert wird (ca. 500KB Ersparnis im Initial Bundle)

---

#### B) Debug Overlays conditional laden
```jsx
// src/App.jsx
const DebugOverlay = import.meta.env.DEV 
  ? lazy(() => import('./components/UI/DebugOverlay'))
  : () => null;
  
const Debug3DOverlay = import.meta.env.DEV
  ? lazy(() => import('./components/UI/Debug3DOverlay'))
  : () => null;
```

**Vorteil:** Debug-Tools werden nur im Dev-Modus geladen (ca. 50KB Ersparnis in Production)

---

###  Stufe 2: Render-Loop Optimierung

#### A) requestAnimationFrame nur bei Interaktion
```jsx
// src/components/3D/Scene.jsx
import { useFrame } from '@react-three/fiber';
import { useState, useRef } from 'react';

function Scene() {
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef(0);

  useFrame((state, delta) => {
    // Nur rendern wenn nötig
    if (!isAnimating) {
      frameRef.current++;
      // Nur jedes 60. Frame rendern wenn idle (= 1fps statt 60fps)
      if (frameRef.current % 60 !== 0) return;
    }
    
    // Normal render logic here
  });

  return (
    <mesh onPointerOver={() => setIsAnimating(true)} 
          onPointerOut={() => setIsAnimating(false)}>
      {/* ... */}
    </mesh>
  );
}
```

**Vorteil:** CPU-Last reduziert wenn User nicht interagiert (wichtig für Mobile)

---

#### B) Texture Compression (Basis/KTX2)
```jsx
// src/components/3D/Materials.jsx
import { useTexture } from '@react-three/drei';

function Materials() {
  // Verwende komprimierte Texturen statt PNG/JPG
  const texture = useTexture('/textures/steel.ktx2', (tex) => {
    tex.generateMipmaps = true; // Für bessere Performance
  });
  
  return <meshStandardMaterial map={texture} />;
}
```

**Vorteil:** 50-75% kleinere Texturen, schnelleres Laden

---

###  Stufe 3: Bundle Analysis

#### Vite Bundle Analyzer
```bash
npm install --save-dev rollup-plugin-visualizer
```

```js
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    react(),
    visualizer({ open: true }) // Öffnet Bericht nach Build
  ]
}
```

**Ausführen:**
```bash
npm run build
```

**Ergebnis:** Zeigt welche Dependencies am meisten Platz brauchen

---

## LIGHTHOUSE ERWARTUNGEN

### Vorher (geschätzt ohne Optimierungen)
- **Performance:** 60-70
- **Accessibility:** 85-90 (Missing: aria-labels, touch targets)
- **Best Practices:** 90-95
- **SEO:** 85-90 (Missing: meta description)

### Nachher (mit allen Optimierungen)
- **Performance:** 80-90 (+20 durch CSS clamp, lazy loading)
- **Accessibility:** 95-100 (+10 durch aria-labels, semantic HTML, touch targets)
- **Best Practices:** 90-95 (gleich)
- **SEO:** 95-100 (+10 durch meta tags, Open Graph)

---

## NÄCHSTE SCHRITTE

1. **Testen:** Dev-Server starten, Header auf allen Breakpoints prüfen
2. **Lighthouse:** Chrome DevTools  Lighthouse (Incognito, Extensions off)
3. **A11y:** Keyboard navigation (Tab-Reihenfolge), Screen reader testen
4. **Performance:** Bundle-Analyse, Lazy Loading implementieren (optional)

---

## ROLLBACK (Falls nötig)

```bash
# CSS zurücksetzen
cp src/components/UI/TopBar.module.css.backup src/components/UI/TopBar.module.css

# JSX zurücksetzen
cp src/components/UI/TopBar.jsx.backup src/components/UI/TopBar.jsx

# HTML zurücksetzen
cp index.html.backup index.html
```

---
