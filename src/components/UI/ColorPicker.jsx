import React from 'react';
import { useConfigurator, COLOR_PALETTE } from '../../context/ConfiguratorContext';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './ColorPicker.module.css';

const ColorSection = ({ title, activeColor, onSelect, t }) => {
    return (
        <div className={styles.section}>
            <h4>{title}</h4>
            <div className={styles.palette}>
                {Object.entries(COLOR_PALETTE).map(([colorKey, hex]) => (
                    <button
                        key={colorKey}
                        className={`${styles.swatch} ${activeColor === colorKey ? styles.active : ''}`}
                        style={{ backgroundColor: hex }}
                        onClick={() => onSelect(colorKey)}
                        aria-label={t(`colors.${colorKey}`)}
                        title={t(`colors.${colorKey}`)}
                    />
                ))}
            </div>
        </div>
    );
};

const ColorPicker = () => {
    const { colors, updateColor, pattern, variant } = useConfigurator();
    const { t } = useLanguage();
    const isBottleHolder = variant === 'bottle_holder';

    return (
        <div className={styles.container}>
            {!isBottleHolder && (
                <>
                    <ColorSection
                        title={t('parts.base')}
                        activeColor={colors.base}
                        onSelect={(color) => updateColor('base', color)}
                        t={t}
                    />
                    <ColorSection
                        title={t('parts.arm')}
                        activeColor={colors.arm}
                        onSelect={(color) => updateColor('arm', color)}
                        t={t}
                    />
                    <ColorSection
                        title={t('parts.module')}
                        activeColor={colors.module}
                        onSelect={(color) => updateColor('module', color)}
                        t={t}
                    />
                </>
            )}

            <ColorSection
                title={t('parts.pattern')}
                activeColor={colors.pattern}
                onSelect={(color) => updateColor('pattern', color)}
                t={t}
            />
        </div>
    );
};

export default ColorPicker;
