import React from 'react';
import { useConfigurator, COLOR_PALETTE } from '../../context/ConfiguratorContext';
import styles from './ColorPicker.module.css';

const ColorSection = ({ title, activeColor, onSelect }) => {
    return (
        <div className={styles.section}>
            <h4>{title}</h4>
            <div className={styles.palette}>
                {Object.entries(COLOR_PALETTE).map(([name, hex]) => (
                    <button
                        key={name}
                        className={`${styles.swatch} ${activeColor === name ? styles.active : ''}`}
                        style={{ backgroundColor: hex }}
                        onClick={() => onSelect(name)}
                        aria-label={name}
                        title={name}
                    />
                ))}
            </div>
        </div>
    );
};

const ColorPicker = () => {
    const { colors, updateColor, pattern } = useConfigurator();

    return (
        <div className={styles.container}>
            <h3>Customization</h3>
            <ColorSection
                title="Base Plate"
                activeColor={colors.base}
                onSelect={(color) => updateColor('base', color)}
            />
            <ColorSection
                title="Arm"
                activeColor={colors.arm}
                onSelect={(color) => updateColor('arm', color)}
            />
            <ColorSection
                title="Module (Rubber Insert)"
                activeColor={colors.module}
                onSelect={(color) => updateColor('module', color)}
            />

            {pattern.enabled && (
                <ColorSection
                    title="Pattern (Windrose)"
                    activeColor={colors.pattern}
                    onSelect={(color) => updateColor('pattern', color)}
                />
            )}
        </div>
    );
};

export default ColorPicker;
