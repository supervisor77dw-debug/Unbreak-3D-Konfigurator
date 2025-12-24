
import React from 'react';
import ModuleSelector from './ModuleSelector';
import ColorPicker from './ColorPicker';
import { useConfigurator, COLOR_PALETTE } from '../../context/ConfiguratorContext';
import styles from './Interface.module.css';

const Interface = () => {
    const {
        variant, setVariant,
        colors
    } = useConfigurator();

    const handleAddToCart = () => {
        // Updated Order Logic
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
        alert(`Zum Warenkorb hinzugefügt!\nKonfiguration in der Konsole anzeigen.`);
    };

    const handleResetView = () => {
        if (window.resetCameraView) {
            window.resetCameraView();
        }
    };

    return (
        <div className={styles.interface}>
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <h1>UNBREAK ONE</h1>
                    <p>Produktkonfigurator</p>
                </div>

                <div className={styles.content}>
                    {/* Variant Selection */}
                    <div className={styles.section}>
                        <h3>Produktvariante</h3>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${variant === 'glass_holder' ? styles.activeTab : ''} `}
                                onClick={() => setVariant('glass_holder')}
                            >
                                Glashalter
                            </button>
                            <button
                                className={`${styles.tab} ${variant === 'bottle_holder' ? styles.activeTab : ''} `}
                                onClick={() => setVariant('bottle_holder')}
                            >
                                Flaschenhalter
                            </button>
                        </div>
                    </div>

                    <hr className={styles.divider} />

                    <div className={styles.section}>
                        <h3>Farbauswahl</h3>
                        {variant === 'bottle_holder' && (
                            <p className={styles.info}>
                                Der Flaschenhalter wird in edlem Matt-Schwarz geliefert.
                                Die integrierte Windrose kann farblich angepasst werden.
                            </p>
                        )}
                        <ColorPicker />
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.resetView}
                        onClick={handleResetView}
                    >
                        🔄 Ansicht zurücksetzen
                    </button>
                    <button
                        className={styles.addToCart}
                        onClick={handleAddToCart}
                    >
                        In den Warenkorb
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Interface;

