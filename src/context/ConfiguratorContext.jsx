
import React, { createContext, useContext, useState } from 'react';

const ConfiguratorContext = createContext();

export const CONFIGURATION_DEFAULTS = {
    variant: 'glass_holder', // 'glass_holder' | 'bottle_holder'
    module: 'wine', // 'wine', 'champagne'
    pattern: {
        enabled: false,
        type: 'windrose',
    },
    colors: {
        base: 'black',
        arm: 'black',
        module: 'black',
        pattern: 'green',
    },
};

export const COLOR_PALETTE = {
    mint: '#98ff98',
    green: '#2ecc71',
    purple: '#9b59b6',
    iceBlue: '#a3d5fa',
    darkBlue: '#34495e',
    red: '#e74c3c',
    black: '#2c3e50',
};

export const ConfiguratorProvider = ({ children }) => {
    const [variant, setVariant] = useState(CONFIGURATION_DEFAULTS.variant);
    const [module, setModule] = useState(CONFIGURATION_DEFAULTS.module);
    const [pattern, setPattern] = useState(CONFIGURATION_DEFAULTS.pattern);
    const [colors, setColors] = useState(CONFIGURATION_DEFAULTS.colors);

    const updateColor = (part, colorName) => {
        setColors((prev) => ({
            ...prev,
            [part]: colorName,
        }));
    };

    const togglePattern = () => {
        setPattern(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    return (
        <ConfiguratorContext.Provider
            value={{
                variant,
                setVariant,
                module,
                setModule,
                pattern,
                togglePattern,
                colors,
                updateColor,
                palette: COLOR_PALETTE,
            }}
        >
            {children}
        </ConfiguratorContext.Provider>
    );
};

export const useConfigurator = () => useContext(ConfiguratorContext);
