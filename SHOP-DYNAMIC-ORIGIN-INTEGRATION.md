# SHOP INTEGRATION - Dynamic shop_origin & return_path

**Status:** 🔄 **REQUIRED FOR v1.1**  
**Priority:** **CRITICAL / BLOCKING**  
**Issue:** Preview tests fail because Configurator redirects to hardcoded Production domain

---

## 🎯 PROBLEM

**Current State:**
- Configurator redirects to `https://www.unbreak-one.com/shop` (hardcoded)
- When Shop is in **Preview** (`unbreak-one-git-BRANCH.vercel.app`), user clicks Configurator → adds to cart → **leaves Preview** (goes to Production)
- Tests fail in Preview deployments

**Root Cause:**
- No dynamic `shop_origin` parameter
- Configurator doesn't know which domain to return to

---

## ✅ SOLUTION

### A) Shop - Pass Parameters When Opening Configurator

**REQUIRED:** When generating "Zum Configurator" link, Shop MUST pass:

```javascript
// Get current shop origin (works in Production AND Preview)
const shopOrigin = window.location.origin;

// Define return path (entry point after cart add)
const returnPath = '/shop'; // or '/cart' or whatever your entry is

// Get current language
const lang = currentLanguage; // 'de' | 'en'

// Build Configurator URL with parameters
const configuratorUrl = `https://unbreak-3-d-konfigurator.vercel.app?lang=${encodeURIComponent(lang)}&shop_origin=${encodeURIComponent(shopOrigin)}&return_path=${encodeURIComponent(returnPath)}`;

// Open Configurator
window.location.href = configuratorUrl;
// OR: window.open(configuratorUrl, '_blank');
```

**Example URLs:**

**Production:**
```
https://unbreak-3-d-konfigurator.vercel.app?lang=en&shop_origin=https%3A%2F%2Fwww.unbreak-one.com&return_path=%2Fshop
```

**Preview (CRITICAL):**
```
https://unbreak-3-d-konfigurator.vercel.app?lang=en&shop_origin=https%3A%2F%2Funbreak-one-git-feat-checkout.vercel.app&return_path=%2Fshop
```

---

### B) Configurator - Read Parameters Dynamically (✅ ALREADY IMPLEMENTED)

**File:** `src/App.jsx`

```javascript
const getURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  
  // CRITICAL: Dynamic shop_origin & return_path (Preview support)
  const shopOrigin = params.get('shop_origin') || 'https://www.unbreak-one.com';
  const returnPath = params.get('return_path') || '/shop';
  const lang = params.get('lang') === 'en' ? 'en' : 'de';
  
  console.info('[CFG][BOOT]', { shopOrigin, returnPath, lang });
  
  return { shopOrigin, returnPath, lang };
};
```

**Redirect after "In den Warenkorb":**

```javascript
// DYNAMIC redirect (works for Production AND Preview)
const shopUrl = `${urlParams.shopOrigin}${urlParams.returnPath}?cfg=${encoded}&lang=${lang}`;
window.location.href = shopUrl;
```

**Fallback (if Shop doesn't pass params):**
- `shop_origin` → `https://www.unbreak-one.com` (Production)
- `return_path` → `/shop`
- `lang` → `de`

---

## 🧪 ACCEPTANCE TESTS

### Test 1: Preview Flow (CRITICAL)

**Scenario:** User is testing Shop in Preview deployment

**Steps:**
1. Open Shop: `https://unbreak-one-git-BRANCH.vercel.app`
2. Click "Zum Configurator"
3. **Expected URL:**
   ```
   https://unbreak-3-d-konfigurator.vercel.app?shop_origin=https%3A%2F%2Funbreak-one-git-BRANCH.vercel.app&return_path=%2Fshop&lang=de
   ```
4. Configure product
5. Click "In den Warenkorb"
6. **Expected redirect:**
   ```
   https://unbreak-one-git-BRANCH.vercel.app/shop?cfg=eyJ...&lang=de
   ```

**CRITICAL PASS CRITERIA:**
- ✅ URL stays in **Preview domain** (`unbreak-one-git-BRANCH.vercel.app`)
- ❌ FAIL if redirected to Production (`www.unbreak-one.com`)

---

### Test 2: Production Flow

**Steps:**
1. Open Shop: `https://www.unbreak-one.com`
2. Click "Zum Configurator"
3. Expected URL:
   ```
   https://unbreak-3-d-konfigurator.vercel.app?shop_origin=https%3A%2F%2Fwww.unbreak-one.com&return_path=%2Fshop&lang=de
   ```
4. Configure product
5. Click "In den Warenkorb"
6. Expected redirect:
   ```
   https://www.unbreak-one.com/shop?cfg=eyJ...&lang=de
   ```

**PASS CRITERIA:**
- ✅ Stays in Production domain

---

### Test 3: Fallback (No Parameters)

**Scenario:** User opens Configurator directly (e.g., from bookmark)

**Steps:**
1. Open `https://unbreak-3-d-konfigurator.vercel.app` (no params)
2. Configure product
3. Click "In den Warenkorb"

**Expected:**
- Redirect to `https://www.unbreak-one.com/shop?cfg=...&lang=de` (fallback)

---

## 📋 SHOP-SIDE IMPLEMENTATION CHECKLIST

- [ ] **Find "Zum Configurator" link generation code**
- [ ] **Add dynamic `shop_origin` parameter:**
  ```javascript
  const shopOrigin = window.location.origin;
  ```
- [ ] **Add `return_path` parameter:**
  ```javascript
  const returnPath = '/shop'; // or current entry
  ```
- [ ] **Add `lang` parameter:**
  ```javascript
  const lang = currentLanguage; // 'de' | 'en'
  ```
- [ ] **Build URL with all parameters:**
  ```javascript
  const url = `https://unbreak-3-d-konfigurator.vercel.app?lang=${encodeURIComponent(lang)}&shop_origin=${encodeURIComponent(shopOrigin)}&return_path=${encodeURIComponent(returnPath)}`;
  ```
- [ ] **Test in Preview deployment** (CRITICAL)
- [ ] **Test in Production deployment**
- [ ] **Verify redirect stays in same environment**

---

## 🔍 WHERE TO FIND THE CODE (Shop)

**Possible locations for "Zum Configurator" link:**

1. **Product Detail Page:**
   - Look for `href="/configurator"` or similar
   - Could be in `ProductDetail.jsx`, `ProductPage.tsx`, etc.

2. **Navigation / Header:**
   - Check main navigation components
   - `Nav.jsx`, `Header.tsx`, `MainMenu.jsx`

3. **Custom Product Section:**
   - Dedicated configurator button/link
   - `CustomProduct.jsx`, `ConfiguratorLink.tsx`

**Search patterns:**
```bash
# Find configurator links
grep -r "configurator" --include="*.jsx" --include="*.tsx"
grep -r "unbreak-3-d-konfigurator" --include="*.jsx" --include="*.tsx"
grep -r "Zum Konfigurator" --include="*.jsx" --include="*.tsx"
```

---

## 💻 EXAMPLE IMPLEMENTATION (Shop)

### Option A: React Component

```jsx
// ConfiguratorLink.jsx
import { useLanguage } from '@/context/LanguageContext';

export default function ConfiguratorLink() {
  const { currentLanguage } = useLanguage();
  
  const handleClick = () => {
    // CRITICAL: Dynamic shop_origin (works in Preview AND Production)
    const shopOrigin = window.location.origin;
    const returnPath = '/shop';
    const lang = currentLanguage; // 'de' | 'en'
    
    const configuratorUrl = `https://unbreak-3-d-konfigurator.vercel.app?lang=${encodeURIComponent(lang)}&shop_origin=${encodeURIComponent(shopOrigin)}&return_path=${encodeURIComponent(returnPath)}`;
    
    console.log('[SHOP][CONFIGURATOR_LINK]', { configuratorUrl, shopOrigin, lang });
    
    window.location.href = configuratorUrl;
  };
  
  return (
    <button onClick={handleClick}>
      {currentLanguage === 'de' ? 'Zum Konfigurator' : 'Open Configurator'}
    </button>
  );
}
```

### Option B: Simple Link (HTML)

```jsx
<a
  href={`https://unbreak-3-d-konfigurator.vercel.app?lang=${currentLang}&shop_origin=${encodeURIComponent(window.location.origin)}&return_path=%2Fshop`}
  target="_blank"
>
  Zum Konfigurator
</a>
```

**Note:** For `target="_blank"`, use `window.opener.postMessage()` instead of `window.location.href` redirect (advanced).

---

## 🚨 CRITICAL NOTES

1. **`window.location.origin` is DYNAMIC:**
   - Preview: `https://unbreak-one-git-BRANCH.vercel.app`
   - Production: `https://www.unbreak-one.com`
   - **DO NOT hardcode!**

2. **Always `encodeURIComponent()`:**
   ```javascript
   // WRONG:
   const url = `?shop_origin=${shopOrigin}`; // Breaks with https://
   
   // CORRECT:
   const url = `?shop_origin=${encodeURIComponent(shopOrigin)}`;
   ```

3. **Test in Preview FIRST:**
   - Most common failure: hardcoded Production origin
   - Use Vercel Preview deployments to verify

4. **Configurator Fallback:**
   - If Shop doesn't pass params → fallback to `www.unbreak-one.com`
   - Not ideal but won't break Production

---

## 📸 REQUIRED SCREENSHOTS

**Shop Team must provide:**

1. **Preview Flow:**
   - Screenshot: Configurator URL in address bar (showing Preview `shop_origin`)
   - Screenshot: Redirect URL after "Add to Cart" (still Preview domain)

2. **Production Flow:**
   - Screenshot: Configurator URL (showing Production `shop_origin`)
   - Screenshot: Redirect URL (Production domain)

3. **Console Logs:**
   - `[SHOP][CONFIGURATOR_LINK]` with `shop_origin` value
   - `[CFG][BOOT]` with parsed params
   - `[CFG][REDIRECT_TO_SHOP]` with final URL

---

## ✅ DEFINITION OF DONE

- [ ] Shop passes `shop_origin` parameter (dynamic `window.location.origin`)
- [ ] Shop passes `return_path` parameter
- [ ] Shop passes `lang` parameter
- [ ] **Test 1 (Preview):** Preview → Configurator → **Preview** (no Production leak)
- [ ] **Test 2 (Production):** Production → Configurator → Production
- [ ] Screenshots provided (URLs + console logs)
- [ ] Code review: No hardcoded origins in Shop or Configurator

---

**BLOCKING:** v1.1 cannot ship until Preview flow works correctly.

**ETA:** Implement in Shop → Test → Screenshots → Ready for Messe
