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
            grey: 'Grau',
        },
        
        // Parts
        parts: {
            base: 'Grundplatte',
            arm: 'Arm',
            module: 'Adapter',
            pattern: 'Muster',
        },
        
        // Products
        products: {
            glass_holder: 'Glashalter',
            bottle_holder: 'Flaschenhalter',
            glass_short: 'Glas',
            bottle_short: 'Flasche',
        },
        
        // UI Elements
        ui: {
            configure: 'Konfigurieren',
            configurator: 'Konfigurator',
            productVariant: 'Produktvariante',
            colorSelection: 'Farbauswahl',
            glassVariant: 'Glasvariante',
            bottleHolderInfo: 'Der Flaschenhalter wird in edlem Matt-Schwarz geliefert. Die integrierte Windrose kann farblich angepasst werden.',
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
            menu: 'Menü öffnen',
            loading: 'Lädt...',
            saveConfig: 'Konfiguration speichern',
            exportTitle: 'Konfiguration',
            copyToClipboard: 'Kopieren',
            backToShop: 'Zurück zum Shop',
            backShort: 'Zurück',
        },
        
        // Modules
        modules: {
            wine: 'Weinglas-Halter',
            champagne: 'Champagner-Halter',
            rubber: 'Gummi-Aufsatz',
        },
        
        // Messages
        messages: {
            configSaved: 'Konfiguration gespeichert',
            exportCopied: 'Konfiguration kopiert!',
            errorLoading: 'Fehler beim Laden',
            pleaseWait: 'Bitte warten...',
            errorAddToCart: 'Ups – bitte erneut versuchen',
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
            grey: 'Grey',
        },
        
        // Parts
        parts: {
            base: 'Base Plate',
            arm: 'Arm',
            module: 'Adapter',
            pattern: 'Pattern',
        },
        
        // Products
        products: {
            glass_holder: 'Glass Holder',
            bottle_holder: 'Bottle Holder',
            glass_short: 'Glass',
            bottle_short: 'Bottle',
        },
        
        // UI Elements
        ui: {
            configure: 'Configure',
            configurator: 'Configurator',
            productVariant: 'Product Variant',
            colorSelection: 'Color Selection',
            glassVariant: 'Glass Variant',
            bottleHolderInfo: 'The bottle holder comes in elegant matte black. The integrated wind rose can be customized in color.',
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
            menu: 'Open Menu',
            loading: 'Loading...',
            saveConfig: 'Save Configuration',
            exportTitle: 'Configuration',
            copyToClipboard: 'Copy',
            backToShop: 'Back to Shop',
            backShort: 'Back',
        },
        
        // Modules
        modules: {
            wine: 'Wine Glass Holder',
            champagne: 'Champagne Holder',
            rubber: 'Rubber Insert',
        },
        
        // Messages
        messages: {
            configSaved: 'Configuration saved',
            errorLoading: 'Error loading',
            pleaseWait: 'Please wait...',
            errorAddToCart: 'Oops – please try again',
            exportCopied: 'Configuration copied!',
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
