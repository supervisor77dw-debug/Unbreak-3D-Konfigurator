import React, { useEffect, useState } from 'react';
import { ConfiguratorProvider, buildConfigJSON } from './context/ConfiguratorContext';
import Scene from './components/3D/Scene';
import TopBar from './components/UI/TopBar';
import PanelHost from './components/UI/PanelHost';
import DebugOverlay from './components/UI/DebugOverlay';
import { useConfigurator } from './context/ConfiguratorContext';
import { useLanguage } from './i18n/LanguageContext';
import { addToCart } from './utils/iframeBridge';
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
 * Allowed return origins (harte Allowlist)
 * CRITICAL: Shop runs on www.unbreak-one.com (WITH www)
 * WITHOUT www = 307 redirect = CORS block = broken
 */
const ALLOWED_RETURN_ORIGINS = new Set([
  'https://www.unbreak-one.com',       // Production canonical (PRIMARY - CORS safe)
  'https://unbreak-one.vercel.app',    // Vercel production (fallback only)
]);

/**
 * Parse URL parameters
 */
const getURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') || 'de';
  const session = params.get('session') || generateSessionId();
  
  // Parse return parameter with validation
  // CRITICAL: www.unbreak-one.com (WITH www) - NO redirect, NO CORS block
  let returnUrl = 'https://www.unbreak-one.com/shop';
  let returnOrigin = 'https://www.unbreak-one.com';
  
  const returnRaw = params.get('return');
  if (returnRaw) {
    try {
      const decoded = decodeURIComponent(returnRaw);
      const parsedUrl = new URL(decoded);
      const origin = parsedUrl.origin;
      
      // Validate against allowlist
      if (ALLOWED_RETURN_ORIGINS.has(origin)) {
        returnUrl = decoded;
        returnOrigin = origin;
      } else {
        console.warn('[CFG][BOOT] Invalid return origin, using fallback:', origin);
      }
    } catch (err) {
      console.warn('[CFG][BOOT] Invalid return URL, using fallback:', returnRaw);
    }
  }
  
  // Log boot info
  console.info('[CFG][BOOT]', { lang, returnUrl, returnOrigin });
  
  return { lang, session, returnUrl, returnOrigin };
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
    
    setSaveError(null); // Clear previous errors
    setIsSaving(true);
    
    try {
      // Build configuration for postMessage
      const config = {
        variant: variant,
        product: variant,
        colors: colors,
        finish: finish,
        quantity: quantity,
        locale: language,
        lang: language,
      };

      console.info('[CFG][CART] Adding to cart via postMessage', config);

      // Send ADD_TO_CART message and wait for ACK
      const result = await addToCart(config, urlParams.session);
      
      console.info('[CFG][CART] Success - added to cart', result);
      
      // Optional: Save to backend (non-blocking)
      // This is backup persistence, not critical for cart flow
      try {
        const apiUrl = `${urlParams.returnOrigin}/api/config-session`;
        const configJSON = buildConfigJSON({
          nextVariant: variant,
          nextColors: colors,
          nextFinish: finish,
          nextQty: quantity,
          lang: language,
        });
        
        await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: urlParams.session,
            lang: language,
            config: configJSON
          }),
          credentials: 'omit',
        });
        
        console.info('[CFG][API] Backend save successful');
      } catch (backendError) {
        console.warn('[CFG][API] Backend save failed (non-critical):', backendError.message);
      }
      
      // SUCCESS: Cart updated, DO NOT REDIRECT
      // Shop will handle showing cart drawer or navigating to cart
      setIsSaving(false);
      
      // Optional: Show success message
      // (You can add a success state to show "In den Warenkorb gelegt" overlay)
      
    } catch (error) {
      console.error('[CFG][CART] Add to cart failed:', error.message || error);
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
        returnUrl={urlParams.returnUrl}
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
