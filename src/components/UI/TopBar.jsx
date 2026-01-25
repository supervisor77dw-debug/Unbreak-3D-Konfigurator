import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './TopBar.module.css';

const TopBar = ({ activePanel, onPanelToggle, variant, setVariant, returnUrl }) => {
    const { t } = useLanguage();
    const handlePanelClick = (panel) => {
        onPanelToggle(activePanel === panel ? null : panel);
    };

    const handleBackToShop = () => {
        const targetUrl = returnUrl || 'https://www.unbreak-one.com/shop';
        console.info('[CFG][NAV] backToShop ->', targetUrl);
        window.location.assign(targetUrl);
    };

    return (
        <header className={styles.topBar}>
            <div className={styles.container}>
                {/* Zone 1: Left - Back Button */}
                <div className={styles.zoneLeft}>
                    <button
                        className={styles.backBtn}
                        onClick={handleBackToShop}
                        aria-label={t('ui.backToShop') || 'Zurück zum Shop'}
                        title={t('ui.backToShop') || 'Zurück zum Shop'}
                    >
                        <span className={styles.backIcon} aria-hidden="true">←</span>
                        <span className={styles.backLabelFull}>{t('ui.backToShop') || 'Zurück zum Shop'}</span>
                        <span className={styles.backLabelShort}>{t('ui.backShort') || 'Zurück'}</span>
                    </button>
                </div>

                {/* Zone 2: Center - Product Variant Tabs */}
                <div className={styles.zoneCenter}>
                    <div className={styles.variantToggle}>
                        <button
                            className={`${styles.variantBtn} ${variant === 'glass_holder' ? styles.active : ''}`}
                            onClick={() => setVariant('glass_holder')}
                        >
                            {t('products.glass_holder')}
                        </button>
                        <button
                            className={`${styles.variantBtn} ${variant === 'bottle_holder' ? styles.active : ''}`}
                            onClick={() => setVariant('bottle_holder')}
                        >
                            {t('products.bottle_holder')}
                        </button>
                    </div>
                </div>

                {/* Zone 3: Right - Panel Actions (Colors/Settings) */}
                <div className={styles.zoneRight}>
                    <button
                        className={`${styles.actionBtn} ${activePanel === 'colors' ? styles.activePanel : ''}`}
                        onClick={() => handlePanelClick('colors')}
                        aria-label={t('ui.colors')}
                    >
                        <span className={styles.icon}>🎨</span>
                        <span className={styles.label}>{t('ui.colors')}</span>
                    </button>
                    <button
                        className={`${styles.actionBtn} ${activePanel === 'actions' ? styles.activePanel : ''}`}
                        onClick={() => handlePanelClick('actions')}
                        aria-label={t('ui.actions')}
                    >
                        <span className={styles.icon}>⚙️</span>
                        <span className={styles.label}>{t('ui.actions')}</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
