import React, { useEffect, useState } from 'react';
import { ConfiguratorProvider, buildConfigJSON } from './context/ConfiguratorContext';
import Scene from './components/3D/Scene';
import TopBar from './components/UI/TopBar';
import PanelHost from './components/UI/PanelHost';
import DebugOverlay from './components/UI/DebugOverlay';
import { useConfigurator } from './context/ConfiguratorContext';
import { useLanguage } from './i18n/LanguageContext';
import './index.css';

/**
 * Generate session ID (UUID v4)
 */
const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Language Detection (CRITICAL for v1.1)
 * Priority: URL ?lang= → localStorage → html lang → default 'de'
 */
function detectLanguage() {
  // 1. URL parameter (highest priority)
  const params = new URLSearchParams(window.location.search);
  if (params.has('lang')) {
    return params.get('lang') === 'en' ? 'en' : 'de';
  }

  // 2. localStorage
  const stored = localStorage.getItem('unbreakone_lang');
  if (stored === 'en' || stored === 'de') {
    return stored;
  }

  // 3. HTML lang attribute
  const htmlLang = document.documentElement.lang || '';
  if (htmlLang.toLowerCase().startsWith('en')) {
    return 'en';
  }

  // 4. Default
  return 'de';
}

/**
 * Parse URL parameters
 * CRITICAL v1.1: shop_origin and return_path from URL (Preview support)
 */
const getURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') || 'de';
  const session = params.get('session') || generateSessionId();
  
  // CRITICAL: Dynamic shop_origin & return_path (Preview support)
  // Shop passes these when opening configurator
  const shopOrigin = params.get('shop_origin') || 'https://www.unbreak-one.com';
  const returnPath = params.get('return_path') || '/shop';
  
  // Log boot info
  console.info('[CFG][BOOT]', { 
    lang, 
    shopOrigin, 
    returnPath,
    session 
  });
  
  return { 
    lang, 
    session, 
    shopOrigin, 
    returnPath 
  };
};

function ConfiguratorContent() {
  const { variant, setVariant, colors, finish, quantity } = useConfigurator();
  const { t, language } = useLanguage();
  const [activePanel, setActivePanel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [urlParams] = useState(() => getURLParams());

  // Initialization logging removed (already done in getURLParams)

  const handleSaveAndReturn = async () => {
    if (isSaving) return;
    
    setSaveError(null);
    setIsSaving(true);
    
    try {
      // CRITICAL: Detect language (v1.1 requirement)
      const detectedLang = detectLanguage();
      console.log('[CFG][ADD_TO_CART_START]', { 
        variant, 
        colors, 
        finish, 
        quantity, 
        contextLang: language,
        detectedLang,
      });

      // Build cart item for URL parameter (cross-domain safe)
      // CRITICAL: lang field MUST be included (v1.1)
      const cartItem = {
        source: 'configurator',
        product_id: 'glass_configurator',
        sku: variant === 'glass_holder' ? 'UNBREAK-GLAS-CONFIG' : 'UNBREAK-FLASCHE-CONFIG',
        name: detectedLang === 'de' 
          ? (variant === 'glass_holder' ? 'Individueller Glashalter' : 'Individueller Flaschenhalter')
          : (variant === 'glass_holder' ? 'Custom Glass Holder' : 'Custom Bottle Holder'),
        quantity: quantity,
        price_cents: 3900, // Shop will recalculate (updated price)
        currency: 'EUR',
        configured: true,
        
        // CRITICAL v1.1: lang field for Cart/Checkout/Stripe/Emails
        lang: detectedLang,
        
        config: {
          variant: variant,
          colors: {
            base: colors.base,
            arm: colors.arm,
            module: colors.module,
            pattern: colors.pattern,
          },
          finish: finish,
        },
        
        // Redundant but safe (fallback)
        meta: {
          lang: detectedLang,
          source: 'configurator',
          timestamp: new Date().toISOString(),
        },
        
        // Legacy field (compatibility)
        locale: detectedLang,
      };

      // CRITICAL: Log lang field for verification
      console.log('[CFG][CART_ITEM_BUILT]', {
        product_id: cartItem.product_id,
        sku: cartItem.sku,
        lang: cartItem.lang,
        price_cents: cartItem.price_cents,
        name: cartItem.name,
      });

      // Encode for URL parameter (cross-domain safe)
      try {
        const json = JSON.stringify(cartItem);
        const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
        
        console.log('[CFG][ENCODED_LEN]', encoded.length);
        console.log('[CFG][LANG_VERIFICATION]', { lang: cartItem.lang, meta_lang: cartItem.meta.lang });

        // Check URL length limit
        if (encoded.length > 1500) {
          console.warn('[CFG][URL_TOO_LONG] Fallback to backend session required');
          throw new Error('Configuration too large for URL parameter');
        }

        // Optional: Save to backend (non-blocking backup)
        try {
          const apiUrl = `${urlParams.shopOrigin}/api/config-session`;
          const configJSON = buildConfigJSON({
            nextVariant: variant,
            nextColors: colors,
            nextFinish: finish,
            nextQty: quantity,
            lang: detectedLang,
          });
          
          await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: urlParams.session,
              lang: detectedLang,
              config: configJSON
            }),
            credentials: 'omit',
          });
          
          console.log('[CFG][API] Backend save successful');
        } catch (backendError) {
          console.warn('[CFG][API] Backend save failed (non-critical):', backendError.message);
        }

        // CRITICAL v1.1: Dynamic redirect (Preview support)
        // Use shop_origin & return_path from URL params (NO hardcoded Production)
        const shopUrl = `${urlParams.shopOrigin}${urlParams.returnPath}?cfg=${encoded}&lang=${detectedLang}`;
        console.log('[CFG][REDIRECT_TO_SHOP]', shopUrl);
        
        window.location.href = shopUrl;

      } catch (encodeError) {
        console.error('[CFG][ENCODE_FAILED]', encodeError);
        throw new Error('Encoding fehlgeschlagen');
      }
      
    } catch (error) {
      console.error('[CFG][ADD_TO_CART_FAILED]', error.message || error);
      setIsSaving(false);
      setSaveError(error.message || 'Hinzufügen zum Warenkorb fehlgeschlagen. Bitte erneut versuchen.');
    }
  };

  const handleResetView = () => {
    if (window.resetCameraView) {
      window.resetCameraView();
    }
  };

  return (
    <div className="app-container">
      <TopBar 
        activePanel={activePanel}
        onPanelToggle={setActivePanel}
        variant={variant}
        setVariant={setVariant}
        returnUrl={`${urlParams.shopOrigin}${urlParams.returnPath}`}
      />
      
      {/* Error Banner */}
      {saveError && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">
              {t('messages.errorAddToCart') || 'Speichern fehlgeschlagen'}: {saveError}
            </span>
            <button
              className="error-back-btn"
              onClick={() => window.location.assign(urlParams.returnUrl)}
            >
              {t('ui.backToShop') || 'Zurück zum Shop'}
            </button>
            <button
              className="error-close-btn"
              onClick={() => setSaveError(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="canvas-wrapper">
        <Scene />
      </div>

      <PanelHost 
        activePanel={activePanel}
        onClose={() => setActivePanel(null)}
        variant={variant}
      >
        {/* Actions Panel Content */}
        <button
          className="action-button reset-view"
          onClick={handleResetView}
        >
          🔄 {t('ui.resetView')}
        </button>
        <button
          className="action-button add-to-cart"
          onClick={handleSaveAndReturn}
          disabled={isSaving}
        >
          {isSaving ? t('ui.loading') || 'Lädt...' : t('ui.addToCart')}
        </button>
      </PanelHost>
    </div>
  );
}

function App() {
  return (
    <ConfiguratorProvider>
      <DebugOverlay />
      <ConfiguratorContent />
    </ConfiguratorProvider>
  );
}

export default App;
