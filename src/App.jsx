import React, { useEffect, useState } from 'react';
import { ConfiguratorProvider } from './context/ConfiguratorContext';
import Scene from './components/3D/Scene';
import TopBar from './components/UI/TopBar';
import PanelHost from './components/UI/PanelHost';
import { notifyLoading, initTimeoutFallback, broadcastConfig } from './utils/iframeBridge';
import { useConfigurator } from './context/ConfiguratorContext';
import './index.css';

function ConfiguratorContent() {
  const { variant, setVariant, colors, getCurrentConfig } = useConfigurator();
  const [activePanel, setActivePanel] = useState(null);

  // Broadcast initial configuration once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const config = getCurrentConfig();
      broadcastConfig(config, 'initial_config');
      console.log('[ConfiguratorContent] Initial config broadcasted to parent');
    }, 500); // Wait 500ms to ensure context is fully initialized
    
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  const handleAddToCart = () => {
    const config = getCurrentConfig();
    
    const output = {
      product_name: 'UNBREAK ONE',
      product_variant: variant,
      colors: {
        baseplate: colors.base,
        arm: colors.arm,
        insert: colors.module,
        pattern: colors.pattern,
      },
      security: {
        obfuscation_enabled: true
      }
    };

    console.log('Checkout Configuration:', output);
    console.log('Parent Config Format:', config);
    
    // Send to parent (if in iframe)
    broadcastConfig(config, 'add_to_cart');
    
    alert(`Zum Warenkorb hinzugefügt!\nKonfiguration in der Konsole anzeigen.`);
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
