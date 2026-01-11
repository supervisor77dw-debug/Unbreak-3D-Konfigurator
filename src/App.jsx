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
 * Parse URL parameters
 */
const getURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') || 'de';
  const session = params.get('session') || generateSessionId();
  const returnUrl = params.get('return') || 'https://www.unbreak-one.com/shop/config-return';
  
  return { lang, session, returnUrl };
};

function ConfiguratorContent() {
  const { variant, setVariant, colors, finish, quantity } = useConfigurator();
  const { t, language } = useLanguage();
  const [activePanel, setActivePanel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [urlParams] = useState(() => getURLParams());

  // Log initialization
  useEffect(() => {
    console.info('[CFG] init', {
      sessionId: urlParams.session,
      lang: urlParams.lang,
      return: urlParams.returnUrl
    });
  }, [urlParams]);

  const handleSaveAndReturn = async () => {
    if (isSaving) return;
    
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

      // POST to config-session API
      const response = await fetch('https://www.unbreak-one.com/api/config-session', {
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

      console.info('[CFG] saved session', { sessionId: urlParams.session });

      // Redirect to shop with session ID
      const separator = urlParams.returnUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${urlParams.returnUrl}${separator}session=${encodeURIComponent(urlParams.session)}`;
      
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('[CFG] save failed', error);
      setIsSaving(false);
      
      // User-friendly error message
      alert(t('messages.errorAddToCart') || 'Ups – bitte erneut versuchen');
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
      />
      
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
