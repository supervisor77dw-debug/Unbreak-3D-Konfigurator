
import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfiguratorContext = createContext();

export const CONFIGURATION_DEFAULTS = {
    variant: 'glass_holder', // 'glass_holder' | 'bottle_holder'
    pattern: {
        enabled: true, // Always active
        type: 'windrose',
    },
    colors: {
        base: 'black',
        arm: 'black',
        module: 'black',
        pattern: 'red', // Premium default
    },
    finish: 'matte', // 'matte' | 'glossy'
    quantity: 1,
};

/**
 * COLOR PALETTE - Technical Keys (snake_case)
 * CRITICAL: Keys MUST match backend schema
 * HEX values for rendering only
 * STANDARD 7 COLORS for Base, Arm, Pattern (NO grey)
 */
export const COLOR_PALETTE = {
    mint: '#a2d9ce',
    green: '#145a32',
    purple: '#4a235a',
    ice_blue: '#5499c7',    // snake_case (was: iceBlue)
    dark_blue: '#1b2631',   // snake_case (was: darkBlue)
    red: '#b03a2e',
    black: '#121212',
};

/**
 * ADAPTER-SPECIFIC COLOR PALETTE
 * Different material (rubber) -> grey instead of mint
 * CRITICAL: Only for adapter/module part
 */
export const ADAPTER_COLOR_PALETTE = {
    red: '#b03a2e',
    black: '#121212',
    ice_blue: '#5499c7',
    green: '#145a32',
    grey: '#7f8c8d',        // ADAPTER ONLY - not available for other parts
};

/**
 * STANDARD PARTS COLOR RESTRICTIONS
 * For Base, Arm, Pattern - 7 colors (NO grey)
 */
export const STANDARD_ALLOWED_COLORS = ['mint', 'green', 'purple', 'ice_blue', 'dark_blue', 'red', 'black'];

/**
 * ADAPTER COLOR RESTRICTIONS
 * Adapter uses different material -> grey instead of mint
 * CRITICAL: Only 5 colors available (product requirement)
 */
export const ADAPTER_ALLOWED_COLORS = ['red', 'black', 'ice_blue', 'green', 'grey'];
export const ADAPTER_DEFAULT_COLOR = 'black';

// SKU mapping
const PRODUCT_SKU_MAP = {
    glass_holder: 'UNBREAK-GLAS-01',
    bottle_holder: 'UNBREAK-FLASCHE-01',
};

/**
 * Build configuration payload from explicit next-state values
 * Prevents stale closure bugs by NOT relying on useState closures
 * @param {object} params - { nextVariant, nextColors, nextFinish, nextQty }
 * @returns {object} Complete config payload
 */
const buildConfig = ({ nextVariant, nextColors, nextFinish, nextQty }) => {
    const isBottleHolder = nextVariant === 'bottle_holder';
    
    // Build colors object based on product type
    const colorsObj = isBottleHolder
        ? {
            // BOTTLE HOLDER: Only base (Unterteil) and pattern (Oberteil/Farbakzent)
            base: 'black',             // Unterteil (fixed black in 3D model)
            pattern: nextColors.pattern,   // Oberteil/Farbakzent (konfigurierbar)
          }
        : {
            // GLASS HOLDER: ALL 4 PARTS (REQUIRED)
            base: nextColors.base,         // Grundplatte
            arm: nextColors.arm,           // Arm
            module: nextColors.module,     // Adapter
            pattern: nextColors.pattern,   // Windrose/Pattern
          };
    
    // Build parts metadata
    const partsMetadata = isBottleHolder
        ? [
            { key: 'base', label_de: 'Unterteil', editable: false },
            { key: 'pattern', label_de: 'Oberteil/Farbakzent', editable: true },
          ]
        : [
            { key: 'base', label_de: 'Grundplatte', editable: true },
            { key: 'arm', label_de: 'Arm', editable: true },
            { key: 'module', label_de: 'Adapter', editable: true },
            { key: 'pattern', label_de: 'Windrose', editable: true },
          ];
    
    return {
        variant: nextVariant,
        product_sku: PRODUCT_SKU_MAP[nextVariant] || 'UNBREAK-UNKNOWN',
        colors: colorsObj,
        parts: partsMetadata,
        finish: nextFinish,
        quantity: nextQty,
        config_version: '1.0.0',
    };
};

/**
 * Build config_json for backend (technical keys only)
 * CRITICAL: Must use snake_case keys, NO translated labels
 * @param {object} params - { nextVariant, nextColors, nextFinish, nextQty, lang }
 * @returns {object} Backend-compatible config_json
 */
export const buildConfigJSON = ({ nextVariant, nextColors, nextFinish, nextQty, lang = 'de' }) => {
    const isBottleHolder = nextVariant === 'bottle_holder';
    
    const configJSON = {
        product_type: nextVariant,
        finish: nextFinish,
        quantity: nextQty,
        lang: lang, // Optional: for backend tracking/debugging
    };
    
    // Add color keys based on product type
    if (isBottleHolder) {
        configJSON.base = 'black'; // Fixed for bottle holder
        configJSON.pattern = nextColors.pattern;
    } else {
        // Glass holder: all 4 parts
        // Validate adapter color before sending to backend
        const adapterColor = ADAPTER_ALLOWED_COLORS.includes(nextColors.module)
            ? nextColors.module
            : ADAPTER_DEFAULT_COLOR;
        
        if (adapterColor !== nextColors.module) {
            console.warn('[CONFIG][BUILD] Invalid adapter color blocked:', nextColors.module, '- using:', adapterColor);
        }
        
        configJSON.base = nextColors.base;
        configJSON.arm = nextColors.arm;
        configJSON.module = adapterColor;  // Validated adapter color
        configJSON.pattern = nextColors.pattern;
    }
    
    return configJSON;
};

export const ConfiguratorProvider = ({ children }) => {
    const [variant, setVariant] = useState(CONFIGURATION_DEFAULTS.variant);
    const [pattern, setPattern] = useState(CONFIGURATION_DEFAULTS.pattern);
    const [colors, setColors] = useState(() => {
        // Validate and migrate colors on init
        const initialColors = { ...CONFIGURATION_DEFAULTS.colors };
        
        // ADAPTER: Convert old 'mint' to 'grey' (different material)
        if (initialColors.module === 'mint') {
            console.warn('[CONFIG][INIT] Migrating adapter color mint -> grey (material change)');
            initialColors.module = 'grey';
        }
        
        // ADAPTER: Validate allowed colors
        if (!ADAPTER_ALLOWED_COLORS.includes(initialColors.module)) {
            console.warn('[CONFIG][INIT] Invalid adapter color detected:', initialColors.module, '- using default:', ADAPTER_DEFAULT_COLOR);
            initialColors.module = ADAPTER_DEFAULT_COLOR;
        }
        
        // BASE/ARM/PATTERN: Block grey (wrong material)
        ['base', 'arm', 'pattern'].forEach(part => {
            if (initialColors[part] === 'grey') {
                console.warn('[CONFIG][INIT] Grey not allowed for', part, '- using black');
                initialColors[part] = 'black';
            }
            // Validate against standard colors
            if (!STANDARD_ALLOWED_COLORS.includes(initialColors[part])) {
                console.warn('[CONFIG][INIT] Invalid color for', part, ':', initialColors[part], '- using black');
                initialColors[part] = 'black';
            }
        });
        
        return initialColors;
    });
    const [finish, setFinish] = useState(CONFIGURATION_DEFAULTS.finish);
    const [quantity, setQuantity] = useState(CONFIGURATION_DEFAULTS.quantity);

    /**
     * Get current configuration (for GET_CONFIGURATION handler)
     * Uses current state values - should be consistent with buildConfig
     */
    const getCurrentConfig = useCallback(() => {
        return buildConfig({
            nextVariant: variant,
            nextColors: colors,
            nextFinish: finish,
            nextQty: quantity,
        });
    }, [colors, finish, quantity, variant]);

    /**
     * Update color and broadcast change to parent
     * NO setTimeout - uses explicit next state to prevent stale closures
     * VALIDATION: Part-specific color restrictions
     */
    const updateColor = useCallback((part, colorName) => {
        // Validate adapter color restrictions
        if (part === 'module') {
            if (!ADAPTER_ALLOWED_COLORS.includes(colorName)) {
                console.warn('[CONFIG][COLOR] Invalid adapter color blocked:', colorName, '- using default:', ADAPTER_DEFAULT_COLOR);
                colorName = ADAPTER_DEFAULT_COLOR;
            }
        } else {
            // Base, Arm, Pattern: Block grey (different material)
            if (colorName === 'grey') {
                console.warn('[CONFIG][COLOR] Grey not allowed for', part, '- using black');
                colorName = 'black';
            }
            // Validate against standard colors
            if (!STANDARD_ALLOWED_COLORS.includes(colorName)) {
                console.warn('[CONFIG][COLOR] Invalid color for', part, ':', colorName, '- using black');
                colorName = 'black';
            }
        }
        
        // Compute next colors state
        const nextColors = {
            ...colors,
            [part]: colorName,
        };
        
        // Update state
        setColors(nextColors);
        
        // Log color change
        console.info('[CONFIG][COLOR] changed', { part, color: colorName });
    }, [colors]);

    /**
     * Update variant and broadcast change to parent
     * NO setTimeout - uses explicit next state
     */
    const updateVariant = useCallback((newVariant) => {
        // Update state
        setVariant(newVariant);
    }, []);

    /**
     * Update finish and broadcast change to parent
     * NO setTimeout - uses explicit next state
     */
    const updateFinish = useCallback((newFinish) => {
        // Update state
        setFinish(newFinish);
    }, []);

    /**
     * Update quantity and broadcast change to parent
     * NO setTimeout - uses explicit next state
     */
    const updateQuantity = useCallback((newQuantity) => {
        // Update state
        setQuantity(newQuantity);
    }, []);

    return (
        <ConfiguratorContext.Provider
            value={{
                variant,
                setVariant: updateVariant,
                pattern,
                colors,
                updateColor,
                finish,
                setFinish: updateFinish,
                quantity,
                setQuantity: updateQuantity,
                palette: COLOR_PALETTE,
                getCurrentConfig,
            }}
        >
            {children}
        </ConfiguratorContext.Provider>
    );
};

export const useConfigurator = () => useContext(ConfiguratorContext);
