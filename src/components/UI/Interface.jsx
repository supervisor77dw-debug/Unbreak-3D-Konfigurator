
import React from 'react';
import ModuleSelector from './ModuleSelector';
import ColorPicker from './ColorPicker';
import { useConfigurator, COLOR_PALETTE } from '../../context/ConfiguratorContext';
import styles from './Interface.module.css';

const Interface = () => {
    const {
        variant, setVariant,
        module,
        pattern, togglePattern,
        colors
    } = useConfigurator();

    const handleAddToCart = () => {
        // 7. ORDER / OUTPUT JSON Logic
        const output = {
            product_variant: variant,
            glass_mode: module,
            colors: {
                baseplate: colors.base,
                arm: colors.arm,
                insert: colors.module,
                pattern: pattern.enabled ? colors.pattern : null,
            },
            pattern: {
                enabled: pattern.enabled,
                type: pattern.type,
            },
            security: {
                obfuscation_enabled: true
            }
        };

        console.log('Checkout Configuration:', output);
        alert(`Added to Cart!\nCheck console for JSON output.`);
    };

    return (
        <div className={styles.interface}>
            <div className={styles.sidebar}>
                <div className={styles.header}>
                    <h1>UNBREAK1</h1>
                    <p>Configure your setup</p>
                </div>

                <div className={styles.content}>
                    {/* Variant Selection */}
                    <div className={styles.section}>
                        <h3>Product Type</h3>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${variant === 'glass_holder' ? styles.activeTab : ''} `}
                                onClick={() => setVariant('glass_holder')}
                            >
                                Glass Holder
                            </button>
                            <button
                                className={`${styles.tab} ${variant === 'bottle_holder' ? styles.activeTab : ''} `}
                                onClick={() => setVariant('bottle_holder')}
                            >
                                Bottle Holder
                            </button>
                        </div>
                    </div>

                    {variant === 'bottle_holder' ? (
                        <div className={styles.comingSoon}>
                            <p>Coming Soon</p>
                            <small>This product variant is currently in development.</small>
                        </div>
                    ) : (
                        <>
                            <ModuleSelector />

                            <hr className={styles.divider} />

                            {/* Pattern Toggle */}
                            <div className={styles.section}>
                                <h3>Pattern</h3>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={pattern.enabled}
                                        onChange={togglePattern}
                                    />
                                    <span className={styles.label}>
                                        Add Windrose Pattern (+15€)
                                    </span>
                                </label>
                            </div>

                            <hr className={styles.divider} />

                            <ColorPicker />
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.addToCart}
                        onClick={handleAddToCart}
                        disabled={variant === 'bottle_holder'}
                    >
                        {variant === 'bottle_holder' ? 'Not Available' : 'Add to Cart / Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Interface;

