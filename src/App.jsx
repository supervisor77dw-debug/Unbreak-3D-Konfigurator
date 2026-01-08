import React, { useEffect, useState } from 'react';
import { ConfiguratorProvider, buildConfigJSON } from './context/ConfiguratorContext';
import Scene from './components/3D/Scene';
import TopBar from './components/UI/TopBar';
import PanelHost from './components/UI/PanelHost';
import { notifyLoading, initTimeoutFallback, broadcastConfig } from './utils/iframeBridge';
import { useConfigurator } from './context/ConfiguratorContext';
import { useLanguage } from './i18n/LanguageContext';
import './index.css';

function ConfiguratorContent() {
  const { variant, setVariant, colors, finish, quantity, getCurrentConfig } = useConfigurator();
  const { t, language } = useLanguage();
  const [activePanel, setActivePanel] = useState(null);

  // NOTE: Initial config broadcast is now handled in ConfiguratorContext useEffect
  // No duplicate broadcast needed here

  const handleAddToCart = () => {
    const config = getCurrentConfig();
    
    // Build backend-compatible config_json (technical keys only)
    const configJSON = buildConfigJSON({
      nextVariant: variant,
      nextColors: colors,
      nextFinish: finish,
      nextQty: quantity,
      lang: language,
    });

    console.log('[App] Checkout Configuration (config_json):', configJSON);
    console.log('[App] Parent Config Format (with labels):', config);
    
    // Send to parent (if in iframe)
    broadcastConfig(config, 'add_to_cart');
    
    alert(`${t('ui.addToCart')}!\n${t('messages.configSaved')}`);
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
          🔄 Ansicht zurücksetzen
        </button>
        <button
          className="action-button add-to-cart"
          onClick={handleAddToCart}
        >
          In den Warenkorb
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
