import React, { useEffect, useState } from 'react';
import { ConfiguratorProvider, buildConfigJSON } from './context/ConfiguratorContext';
import Scene from './components/3D/Scene';
import TopBar from './components/UI/TopBar';
import PanelHost from './components/UI/PanelHost';
import { useConfigurator } from './context/ConfiguratorContext';
import { useLanguage } from './i18n/LanguageContext';
import './index.css';

/**
 * Get return URL from query parameter
 * @returns {string} Return URL or default shop URL
 */
const getReturnURL = () => {
  const params = new URLSearchParams(window.location.search);
  const returnParam = params.get('return');
  
  if (returnParam) {
    try {
      // Validate URL
      new URL(returnParam);
      return returnParam;
    } catch (e) {
      console.error('[CONFIG] Invalid return URL:', returnParam);
    }
  }
  
  // Default return URL
  return 'https://www.unbreak-one.com/shop';
};

function ConfiguratorContent() {
  const { variant, setVariant, colors, finish, quantity, getCurrentConfig } = useConfigurator();
  const { t, language } = useLanguage();
  const [activePanel, setActivePanel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddToCart = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Build configuration JSON
      const config = getCurrentConfig();
      const configJSON = buildConfigJSON({
        nextVariant: variant,
        nextColors: colors,
        nextFinish: finish,
        nextQty: quantity,
        lang: language,
      });

      // Prepare payload for API
      const payload = {
        lang: language,
        variantKey: variant,
        product_sku: config.product_sku,
        config: configJSON,
        meta: {
          source: 'config-app',
          ts: Date.now(),
          version: config.config_version || '1.0.0'
        }
      };

      console.info('[CONFIG] posting config-session');

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
      const cfgId = data.cfgId;

      if (!cfgId) {
        throw new Error('No cfgId in response');
      }

      console.info('[CONFIG] cfgId=', cfgId);

      // Get return URL
      const returnUrl = getReturnURL();
      const separator = returnUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${returnUrl}${separator}cfgId=${encodeURIComponent(cfgId)}`;

      // Redirect to shop
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('[CONFIG] Add to cart error:', error);
      setIsSubmitting(false);
      
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
          onClick={handleAddToCart}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('ui.loading') || 'Lädt...' : t('ui.addToCart')}
        </button>
      </PanelHost>
    </div>
  );
}

function App() {
  // Send LOADING signal on mount and setup timeout fallback
  useEffect(() => {
    notifyLoading(0);
    console.log('[App] Sent LOADING signal to parent');
    
    // Setup 12s timeout fallback
    const cleanup = initTimeoutFallback(12000);
    return cleanup;
  }, []);

  return (
    <ConfiguratorProvider>
      <ConfiguratorContent />
    </ConfiguratorProvider>
  );
}

export default App;
