/**
 * UNBREAK ONE - Internationalization (i18n)
 * SINGLE SOURCE OF TRUTH for all translations
 * 
 * RULES:
 * - Technical keys ALWAYS in snake_case (mint, ice_blue, dark_blue, etc.)
 * - Labels are for UI display ONLY
 * - Backend receives technical keys, NOT translated labels
 */

export const translations = {
    de: {
        // Colors (7 canonical)
        colors: {
            mint: 'Mint',
            green: 'Grün',
            purple: 'Lila',
            ice_blue: 'Eisblau',
            dark_blue: 'Dunkelblau',
            red: 'Rot',
            black: 'Schwarz',
        },
        
        // Parts
        parts: {
            base: 'Grundplatte',
            arm: 'Arm',
            module: 'Gummilippe',
            pattern: 'Muster',
        },
        
        // Products
        products: {
            glass_holder: 'Glashalter',
            bottle_holder: 'Flaschenhalter',
        },
        
        // UI Elements
        ui: {
            configure: 'Konfigurieren',
            configurator: 'Konfigurator',
            selectColor: 'Farbe auswählen',
            next: 'Weiter',
            back: 'Zurück',
            buyNow: 'Jetzt kaufen',
            addToCart: 'In den Warenkorb',
            reset: 'Zurücksetzen',
            resetView: 'Ansicht zurücksetzen',
            close: 'Schließen',
            finish: 'Oberfläche',
            quantity: 'Anzahl',
            matte: 'Matt',
            glossy: 'Glänzend',
            price: 'Preis',
            total: 'Gesamt',
            language: 'Sprache',
            colors: 'Farben',
            actions: 'Aktionen',
        },
        
        // Messages
        messages: {
            configSaved: 'Konfiguration gespeichert',
            errorLoading: 'Fehler beim Laden',
            pleaseWait: 'Bitte warten...',
        },
    },
    
    en: {
        // Colors (7 canonical)
        colors: {
            mint: 'Mint',
            green: 'Green',
            purple: 'Purple',
            ice_blue: 'Ice Blue',
            dark_blue: 'Dark Blue',
            red: 'Red',
            black: 'Black',
        },
        
        // Parts
        parts: {
            base: 'Base Plate',
            arm: 'Arm',
            module: 'Rubber Lip',
            pattern: 'Pattern',
        },
        
        // Products
        products: {
            glass_holder: 'Glass Holder',
            bottle_holder: 'Bottle Holder',
        },
        
        // UI Elements
        ui: {
            configure: 'Configure',
            configurator: 'Configurator',
            selectColor: 'Select Color',
            next: 'Next',
            back: 'Back',
            buyNow: 'Buy Now',
            addToCart: 'Add to Cart',
            reset: 'Reset',
            resetView: 'Reset View',
            close: 'Close',
            finish: 'Finish',
            quantity: 'Quantity',
            matte: 'Matte',
            glossy: 'Glossy',
            price: 'Price',
            total: 'Total',
            language: 'Language',
            colors: 'Colors',
            actions: 'Actions',
        },
        
        // Messages
        messages: {
            configSaved: 'Configuration saved',
            errorLoading: 'Error loading',
            pleaseWait: 'Please wait...',
        },
    },
};

/**
 * Get translation for a key path
 * @param {string} lang - Language code ('de' | 'en')
 * @param {string} path - Dot-notation path (e.g., 'colors.ice_blue', 'ui.buyNow')
 * @returns {string} Translated text or key if not found
 */
export const t = (lang, path) => {
    const keys = path.split('.');
    let value = translations[lang];
    
    for (const key of keys) {
        if (value && typeof value === 'object') {
            value = value[key];
        } else {
            console.warn(`[i18n] Translation not found: ${lang}.${path}`);
            return path; // Return key as fallback
        }
    }
    
    return value || path;
};

/**
 * Canonical color IDs (MUST match backend schema)
 * snake_case format
 */
export const CANONICAL_COLOR_IDS = [
    'mint',
    'green',
    'purple',
    'ice_blue',
    'dark_blue',
    'red',
    'black',
];

/**
 * Canonical part IDs
 */
export const CANONICAL_PART_IDS = [
    'base',
    'arm',
    'module',
    'pattern',
];
