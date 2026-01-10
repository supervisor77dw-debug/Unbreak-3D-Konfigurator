import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './TopBar.module.css';

const TopBar = ({ activePanel, onPanelToggle, variant, setVariant }) => {
    const { t } = useLanguage();
    const handlePanelClick = (panel) => {
        onPanelToggle(activePanel === panel ? null : panel);
    };

    return (
        <header className={styles.topBar}>
            <div className={styles.container}>
                {/* Brand */}
                <div className={styles.brand}>
                    <h1 className={styles.brandName}>UNBREAK ONE</h1>
                    <span className={styles.brandSub}>{t('ui.configurator')}</span>
                </div>

                {/* Product Variant Toggle */}
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

                {/* Panel Actions */}
                <div className={styles.actions}>
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
