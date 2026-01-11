import React, { useEffect, useState } from 'react';
import { ConfiguratorProvider, buildConfigJSON } from './context/ConfiguratorContext';
import Scene from './components/3D/Scene';
import TopBar from './components/UI/TopBar';
import PanelHost from './components/UI/PanelHost';
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
 * Allowed return origins (harte Allowlist)
 */
const ALLOWED_RETURN_ORIGINS = new Set([
  'https://unbreak-one.vercel.app',
]);

/**
 * Parse URL parameters
 */
const getURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') || 'de';
  const session = params.get('session') || generateSessionId();
  
  // Parse return parameter with validation
  let returnUrl = 'https://unbreak-one.vercel.app/shop';
  let returnOrigin = 'https://unbreak-one.vercel.app';
  
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
      // Build configuration JSON
      const configJSON = buildConfigJSON({
        nextVariant: variant,
        nextColors: colors,
        nextFinish: finish,
        nextQty: quantity,
        lang: language,
      });

      // Prepare payload for API
      const payload = {
        sessionId: urlParams.session,
        lang: language,
        config: configJSON
      };

      // API endpoint derived from returnOrigin
      const apiUrl = `${urlParams.returnOrigin}/api/config-session`;
      console.info('[CFG][API] post ->', apiUrl);
      
      // POST to config-session API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error('Session save failed');
      }

      console.info('[CFG][API] session saved', { sessionId: urlParams.session });

      // Redirect to shop with session ID
      const separator = urlParams.returnUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${urlParams.returnUrl}${separator}sessionId=${encodeURIComponent(urlParams.session)}`;
      
      window.location.assign(redirectUrl);
      
    } catch (error) {
      console.error('[CFG][API] save failed', error);
      setIsSaving(false);
      setSaveError(error.message || 'Speichern fehlgeschlagen');
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
      <ConfiguratorContent />
    </ConfiguratorProvider>
  );
}

export default App;
