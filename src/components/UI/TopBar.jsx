import React from 'react';
import styles from './TopBar.module.css';

const TopBar = ({ activePanel, onPanelToggle, variant, setVariant }) => {
    const handlePanelClick = (panel) => {
        onPanelToggle(activePanel === panel ? null : panel);
    };

    return (
        <header className={styles.topBar}>
            <div className={styles.container}>
                {/* Brand */}
                <div className={styles.brand}>
                    <h1 className={styles.brandName}>UNBREAK ONE</h1>
                    <span className={styles.brandSub}>Konfigurator</span>
                </div>

                {/* Product Variant Toggle */}
                <div className={styles.variantToggle}>
                    <button
                        className={`${styles.variantBtn} ${variant === 'glass_holder' ? styles.active : ''}`}
                        onClick={() => setVariant('glass_holder')}
                    >
                        Glashalter
                    </button>
                    <button
                        className={`${styles.variantBtn} ${variant === 'bottle_holder' ? styles.active : ''}`}
                        onClick={() => setVariant('bottle_holder')}
                    >
                        Flaschenhalter
                    </button>
                </div>

                {/* Panel Actions */}
                <div className={styles.actions}>
                    <button
                        className={`${styles.actionBtn} ${activePanel === 'colors' ? styles.activePanel : ''}`}
                        onClick={() => handlePanelClick('colors')}
                        aria-label="Farbauswahl"
                    >
                        <span className={styles.icon}>🎨</span>
                        <span className={styles.label}>Farben</span>
                    </button>
                    <button
                        className={`${styles.actionBtn} ${activePanel === 'actions' ? styles.activePanel : ''}`}
                        onClick={() => handlePanelClick('actions')}
                        aria-label="Aktionen"
                    >
                        <span className={styles.icon}>⚙️</span>
                        <span className={styles.label}>Aktionen</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
