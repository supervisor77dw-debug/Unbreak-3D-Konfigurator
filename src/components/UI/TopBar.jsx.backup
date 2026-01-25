import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './TopBar.module.css';

const TopBar = ({ activePanel, onPanelToggle, variant, setVariant, returnUrl, onAddToCart, isSaving, cartCount = 0 }) => {
    const { t, language, setLanguage } = useLanguage();
    
    const handlePanelClick = (panel) => {
        onPanelToggle(activePanel === panel ? null : panel);
    };

    const handleBackToShop = () => {
        const targetUrl = returnUrl || 'https://www.unbreak-one.com/shop';
        console.info('[CFG][NAV] backToShop ->', targetUrl);
        window.location.assign(targetUrl);
    };

    const toggleLanguage = () => {
        const newLang = language === 'de' ? 'en' : 'de';
        setLanguage(newLang);
    };

    return (
        <header className={styles.topBar}>
            {/* Row 1: Back + Cart (+ Lang on desktop) */}
            <div className={styles.row1}>
                {/* Left: Back Button */}
                <div className={styles.zoneLeft}>
                    <button
                        className={styles.backBtn}
                        onClick={handleBackToShop}
                        aria-label={t('ui.backToShop') || 'Zurück zum Shop'}
                        title={t('ui.backToShop') || 'Zurück zum Shop'}
                    >
                        <span className={styles.backIcon} aria-hidden="true">←</span>
                        <span className={styles.backLabelFull}>{t('ui.backToShop') || 'Zurück zum Shop'}</span>
                        <span className={styles.backLabelMedium}>{t('ui.backShort') || 'Zurück'}</span>
                    </button>
                </div>

                {/* Right: Cart + Language Toggle */}
                <div className={styles.zoneRight}>
                    {/* Language Toggle (Desktop position - also appears in row2 on mobile) */}
                    <button
                        className={`${styles.langToggle} ${styles.desktopOnly}`}
                        onClick={toggleLanguage}
                        aria-label={language === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
                        title={language === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
                    >
                        <span className={`${styles.langOption} ${language === 'de' ? styles.langActive : ''}`}>DE</span>
                        <span className={styles.langDivider}>/</span>
                        <span className={`${styles.langOption} ${language === 'en' ? styles.langActive : ''}`}>EN</span>
                    </button>

                    {/* Cart Button */}
                    <button
                        className={styles.cartBtn}
                        onClick={onAddToCart}
                        disabled={isSaving}
                        aria-label={t('ui.addToCart')}
                    >
                        <span className={styles.cartIcon}>🛒</span>
                        <span className={styles.cartLabel}>{isSaving ? t('ui.loading') : t('ui.addToCart')}</span>
                        {cartCount > 0 && (
                            <span className={styles.cartBadge}>{cartCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Row 2: Variant Tabs + Actions (+ Lang on mobile) */}
            <div className={styles.row2}>
                {/* Variant Toggle */}
                <div className={styles.variantToggle}>
                    <button
                        className={`${styles.variantBtn} ${variant === 'glass_holder' ? styles.active : ''}`}
                        onClick={() => setVariant('glass_holder')}
                    >
                        <span className={styles.variantLabelFull}>{t('products.glass_holder')}</span>
                        <span className={styles.variantLabelShort}>🍷</span>
                    </button>
                    <button
                        className={`${styles.variantBtn} ${variant === 'bottle_holder' ? styles.active : ''}`}
                        onClick={() => setVariant('bottle_holder')}
                    >
                        <span className={styles.variantLabelFull}>{t('products.bottle_holder')}</span>
                        <span className={styles.variantLabelShort}>🍾</span>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionGroup}>
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

                    {/* Language Toggle (Mobile position) */}
                    <button
                        className={`${styles.langToggle} ${styles.mobileOnly}`}
                        onClick={toggleLanguage}
                        aria-label={language === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
                    >
                        <span className={`${styles.langOption} ${language === 'de' ? styles.langActive : ''}`}>DE</span>
                        <span className={styles.langDivider}>/</span>
                        <span className={`${styles.langOption} ${language === 'en' ? styles.langActive : ''}`}>EN</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
