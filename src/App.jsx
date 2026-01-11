import React, { useEffect, useState } from 'react';
import { ConfiguratorProvider, buildConfigJSON } from './context/ConfiguratorContext';
import Scene from './components/3D/Scene';
import TopBar from './components/UI/TopBar';
import PanelHost from './components/UI/PanelHost';
import { useConfigurator } from './context/ConfiguratorContext';
import { useLanguage } from './i18n/LanguageContext';
import './index.css';

function ConfiguratorContent() {
  const { variant, setVariant, colors, finish, quantity, getCurrentConfig } = useConfigurator();
  const { t, language } = useLanguage();
  const [activePanel, setActivePanel] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState(null);

  const handleExport = () => {
    // Build configuration JSON
    const config = getCurrentConfig();
    const configJSON = buildConfigJSON({
      nextVariant: variant,
      nextColors: colors,
      nextFinish: finish,
      nextQty: quantity,
      lang: language,
    });

    // Create export payload
    const payload = {
      variantKey: variant,
      lang: language,
      payload: {
        colors: configJSON.base ? {
          base: configJSON.base,
          arm: configJSON.arm,
          module: configJSON.module,
          pattern: configJSON.pattern
        } : {
          base: configJSON.base,
          pattern: configJSON.pattern
        },
        finish: configJSON.finish,
        quantity: configJSON.quantity
      }
    };

    console.info('[CONFIG][EXPORT] payload', payload);
    
    setExportData(payload);
    setShowExport(true);
  };

  const handleCopyToClipboard = () => {
    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      console.info('[CONFIG][EXPORT] copied to clipboard');
      alert(t('messages.exportCopied') || 'Konfiguration kopiert!');
    }).catch(() => {
      console.error('[CONFIG][EXPORT] clipboard copy failed');
    });
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
  // Log build stamp on mount
  useEffect(() => {
    console.info('[BUILD]', {
      app: 'config',
      env: import.meta.env.MODE, // 'development' | 'production'
      commit: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || 'local',
      time: new Date().toISOString(),
    });
  }, []);

  return (
    <ConfiguratorProvider>
      <ConfiguratorContent />
    </ConfiguratorProvider>
  );
}

export default App;
export-config"
          onClick={handleExport}
        >
          💾 {t('ui.saveConfig') || 'Konfiguration speichern'}
        </button>
      </PanelHost>

      {/* Export Modal */}
      {showExport && (
        <div className="export-modal-overlay" onClick={() => setShowExport(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('ui.exportTitle') || 'Konfiguration'}</h3>
            <pre className="export-json">{JSON.stringify(exportData, null, 2)}</pre>
            <div className="export-actions">
              <button onClick={handleCopyToClipboard}>
                📋 {t('ui.copyToClipboard') || 'Kopieren'}
              </button>
              <button onClick={() => setShowExport(false)}>
                ✕ {t('ui.close') || 'Schließen'}
              </button>
            </div>
          </div>
        </div>
      )}