import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './TopBar.module.css';

// ========================================
// SVG Icons as React Components
// CRITICAL: These ensure icons NEVER disappear
// ========================================
const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
);

const CartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
);

const GlassIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M7 3h10l-2 8a5 5 0 0 1-6 0L7 3z"/>
    </svg>
);

const BottleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2h4M10 6V4h4v2M9 18V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9M8 22h8a1 1 0 0 0 1-1v-3H7v3a1 1 0 0 0 1 1z"/>
    </svg>
);

const PaletteIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/>
        <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
    </svg>
);

const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
);

// ========================================
// TopBar Component
// ========================================
const TopBar = ({ activePanel, onPanelToggle, variant, setVariant, returnUrl, onAddToCart, isSaving, cartCount = 0 }) => {
    const { t, language, setLanguage } = useLanguage();
    const [screenSize, setScreenSize] = useState('large'); // 'large' | 'medium' | 'small' | 'tiny'

    // Detect screen size for responsive rendering
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width <= 360) setScreenSize('tiny');
            else if (width <= 420) setScreenSize('small');
            else if (width <= 600) setScreenSize('medium');
            else setScreenSize('large');
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const handlePanelClick = (panel) => {
        onPanelToggle(activePanel === panel ? null : panel);
    };

    const handleBackToShop = () => {
        const targetUrl = returnUrl || 'https://www.unbreak-one.com/shop';
        console.info('[CFG][NAV] backToShop ->', targetUrl);
        window.location.assign(targetUrl);
    };

    // ========================================
    // Responsive text visibility helpers
    // RULE: Icon ALWAYS visible, text conditional
    // ========================================
    const showFullBackText = screenSize === 'large';
    const showShortBackText = screenSize === 'medium';
    
    const showFullVariantText = screenSize === 'large';
    const showShortVariantText = screenSize === 'medium';
    
    const showCartText = screenSize === 'large' || screenSize === 'medium';
    const showActionLabels = screenSize === 'large';

    return (
        <header className={styles.topBar} role="banner">
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
                        <span className={styles.iconWrapper} aria-hidden="true">
                            <BackIcon />
                        </span>
                        {showFullBackText && (
                            <span className={styles.labelText}>
                                {t('ui.backToShop') || 'Zurück zum Shop'}
                            </span>
                        )}
                        {showShortBackText && (
                            <span className={styles.labelText}>
                                {t('ui.backShort') || 'Zurück'}
                            </span>
                        )}
                    </button>
                </div>

                {/* Right: Cart + Language Toggle */}
                <div className={styles.zoneRight}>
                    {/* Language Toggle (Desktop) - styled like unbreak-one.com */}
                    <div className={`${styles.langToggleWrapper} ${styles.desktopOnly}`}>
                        <button
                            className={`${styles.langBtn} ${language === 'de' ? styles.langActive : ''}`}
                            onClick={() => setLanguage('de')}
                            aria-label="Deutsch"
                            aria-pressed={language === 'de'}
                        >
                            DE
                        </button>
                        <button
                            className={`${styles.langBtn} ${language === 'en' ? styles.langActive : ''}`}
                            onClick={() => setLanguage('en')}
                            aria-label="English"
                            aria-pressed={language === 'en'}
                        >
                            EN
                        </button>
                    </div>

                    {/* Cart Button */}
                    <button
                        className={styles.cartBtn}
                        onClick={onAddToCart}
                        disabled={isSaving}
                        aria-label={t('ui.addToCart') || 'In den Warenkorb'}
                        title={t('ui.addToCart') || 'In den Warenkorb'}
                    >
                        <span className={styles.iconWrapper} aria-hidden="true">
                            <CartIcon />
                        </span>
                        {showCartText && (
                            <span className={styles.labelText}>
                                {isSaving ? (t('ui.loading') || 'Lädt...') : (t('ui.addToCart') || 'In den Warenkorb')}
                            </span>
                        )}
                        {cartCount > 0 && (
                            <span className={styles.cartBadge} aria-label={`${cartCount} items`}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Row 2: Variant Tabs + Actions (+ Lang on mobile) */}
            <nav className={styles.row2} aria-label={t('ui.navigation') || 'Navigation'}>
                {/* Variant Toggle */}
                <div className={styles.variantToggle} role="group" aria-label={t('ui.selectProduct') || 'Produkt wählen'}>
                    <button
                        className={`${styles.variantBtn} ${variant === 'glass_holder' ? styles.active : ''}`}
                        onClick={() => setVariant('glass_holder')}
                        aria-label={t('products.glass_holder') || 'Glashalter'}
                        aria-pressed={variant === 'glass_holder'}
                        title={t('products.glass_holder') || 'Glashalter'}
                    >
                        <span className={styles.iconWrapper} aria-hidden="true">
                            <GlassIcon />
                        </span>
                        {showFullVariantText && (
                            <span className={styles.labelText}>
                                {t('products.glass_holder') || 'Glashalter'}
                            </span>
                        )}
                        {showShortVariantText && (
                            <span className={styles.labelText}>
                                {t('products.glass_short') || 'Glas'}
                            </span>
                        )}
                    </button>
                    <button
                        className={`${styles.variantBtn} ${variant === 'bottle_holder' ? styles.active : ''}`}
                        onClick={() => setVariant('bottle_holder')}
                        aria-label={t('products.bottle_holder') || 'Flaschenhalter'}
                        aria-pressed={variant === 'bottle_holder'}
                        title={t('products.bottle_holder') || 'Flaschenhalter'}
                    >
                        <span className={styles.iconWrapper} aria-hidden="true">
                            <BottleIcon />
                        </span>
                        {showFullVariantText && (
                            <span className={styles.labelText}>
                                {t('products.bottle_holder') || 'Flaschenhalter'}
                            </span>
                        )}
                        {showShortVariantText && (
                            <span className={styles.labelText}>
                                {t('products.bottle_short') || 'Flasche'}
                            </span>
                        )}
                    </button>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionGroup} role="group" aria-label={t('ui.actions') || 'Aktionen'}>
                    <button
                        className={`${styles.actionBtn} ${activePanel === 'colors' ? styles.activePanel : ''}`}
                        onClick={() => handlePanelClick('colors')}
                        aria-label={t('ui.colors') || 'Farben'}
                        aria-pressed={activePanel === 'colors'}
                        title={t('ui.colors') || 'Farben'}
                    >
                        <span className={styles.iconWrapper} aria-hidden="true">
                            <PaletteIcon />
                        </span>
                        {showActionLabels && (
                            <span className={styles.labelText}>{t('ui.colors') || 'Farben'}</span>
                        )}
                    </button>
                    <button
                        className={`${styles.actionBtn} ${activePanel === 'actions' ? styles.activePanel : ''}`}
                        onClick={() => handlePanelClick('actions')}
                        aria-label={t('ui.settings') || 'Einstellungen'}
                        aria-pressed={activePanel === 'actions'}
                        title={t('ui.settings') || 'Einstellungen'}
                    >
                        <span className={styles.iconWrapper} aria-hidden="true">
                            <SettingsIcon />
                        </span>
                        {showActionLabels && (
                            <span className={styles.labelText}>{t('ui.actions') || 'Aktionen'}</span>
                        )}
                    </button>

                    {/* Language Toggle (Mobile) - styled like unbreak-one.com */}
                    <div className={`${styles.langToggleWrapper} ${styles.mobileOnly}`}>
                        <button
                            className={`${styles.langBtn} ${language === 'de' ? styles.langActive : ''}`}
                            onClick={() => setLanguage('de')}
                            aria-label="Deutsch"
                            aria-pressed={language === 'de'}
                        >
                            DE
                        </button>
                        <button
                            className={`${styles.langBtn} ${language === 'en' ? styles.langActive : ''}`}
                            onClick={() => setLanguage('en')}
                            aria-label="English"
                            aria-pressed={language === 'en'}
                        >
                            EN
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default TopBar;
