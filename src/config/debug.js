/**
 * UNBREAK ONE - Debug Configuration
 * 
 * Controls visibility of debug UI elements (overlays, alerts, badges)
 * Production: Always OFF
 * Preview/Local: Optional via localStorage or URL parameter
 */

/**
 * Check if debug UI should be enabled
 * @returns {boolean} True if debug UI is allowed
 */
export const isDebugUIEnabled = () => {
    // Production: ALWAYS disabled
    if (import.meta.env.MODE === 'production') {
        return false;
    }
    
    // Preview/Local: Check explicit flags
    const debugFromLocalStorage = typeof window !== 'undefined' && 
        window.localStorage?.getItem('UNBREAK_DEBUG') === '1';
    
    const debugFromURL = typeof window !== 'undefined' && 
        new URLSearchParams(window.location.search).get('debug') === '1';
    
    return debugFromLocalStorage || debugFromURL;
};

/**
 * Check if 3D debug mode is enabled (?debug3d=1)
 * Shows detailed color/material/render information
 * @returns {boolean} True if 3D debug is enabled
 */
export const isDebug3DEnabled = () => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug3d') === '1';
};

/**
 * Log debug message (always allowed, only controls UI)
 * @param {string} message - Debug message
 * @param {*} data - Optional data to log
 */
export const debugLog = (message, data = null) => {
    if (data !== null) {
        console.info(`[DEBUG] ${message}`, data);
    } else {
        console.info(`[DEBUG] ${message}`);
    }
};
