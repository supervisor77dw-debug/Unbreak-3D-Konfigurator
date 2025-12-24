
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
        pattern: 'red', // Premium default
    },
};

export const COLOR_PALETTE = {
    mint: '#a2d9ce',
    green: '#145a32',
    purple: '#4a235a',
    iceBlue: '#5499c7',
    darkBlue: '#1b2631',
    red: '#b03a2e',
    black: '#121212',
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
