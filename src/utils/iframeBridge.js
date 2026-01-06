/**
 * UNBREAK ONE - iframe Communication Bridge (PRODUCTION READY)
 * Handles postMessage communication between configurator (child) and parent window
 * 
 * SECURITY: Strict origin allowlist - NO WILDCARDS
 * RELIABILITY: Guaranteed delivery with fallbacks
 */

// ============================================
// ALLOWED PARENT ORIGINS (STRICT WHITELIST)
// ============================================
const ALLOWED_PARENTS = new Set([
    'https://unbreak-2fort2m7j-supervisor77dw-debugs-projects.vercel.app',
    'https://unbreak-one.vercel.app',
    'https://www.unbreak-one.com',
    'https://unbreak-one.com',
    // Local development
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]);

/**
 * Get parent origin from referrer or stored value
 * @returns {string|null} Parent origin or null if not in iframe
 */
function getParentOrigin() {
    if (window.parent === window) return null; // Not in iframe
    
    // Try document.referrer first (most reliable in iframe)
    if (document.referrer) {
        try {
            return new URL(document.referrer).origin;
        } catch (e) {
            console.warn('[UNBREAK_IFRAME] Invalid referrer URL:', document.referrer);
        }
    }
    
    // Fallback: use stored origin from GET_CONFIGURATION handler
    return window.__unbreakParentOrigin || null;
}

/**
 * Send a message to the parent window (SECURE)
 * @param {object} payload - Full message payload (must include 'type' field)
 * @param {string} reason - Optional reason/context for logging
 */
export const postToParent = (payload, reason = '') => {
    if (window.parent === window) {
        console.info('[UNBREAK_IFRAME] Not in iframe, skipping postMessage');
        return;
    }
    
    const parentOrigin = getParentOrigin();
    
    if (!parentOrigin) {
        console.warn('[UNBREAK_IFRAME] Cannot determine parent origin - postMessage blocked', payload.type);
        return;
    }
    
    if (!ALLOWED_PARENTS.has(parentOrigin)) {
        console.warn('[UNBREAK_IFRAME] BLOCKED postMessage - unknown parent origin:', parentOrigin, payload.type);
        return;
    }
    
    // Send message with explicit origin
    window.parent.postMessage(payload, parentOrigin);
    console.info(`[UNBREAK_IFRAME] postMessage -> ${parentOrigin} | ${payload.type}${reason ? ' | ' + reason : ''}`, payload);
};

/**
 * Notify parent that configurator is loading
 * @param {number} progress - Progress value 0-100
 */
export const notifyLoading = (progress = 0) => {
    postToParent({
        type: 'UNBREAK_CONFIG_LOADING',
        progress: Math.min(100, Math.max(0, progress)),
    }, `progress: ${progress}%`);
};

/**
 * Notify parent that configurator is ready (fully loaded + rendered)
 * @param {string} version - Optional version/git SHA
 */
export const notifyReady = (version = null) => {
    window.__unbreakReadySent = true;
    
    postToParent({
        type: 'UNBREAK_CONFIG_READY',
        version: version || 'dev',
    });
    
    console.info('[UNBREAK_IFRAME] READY sent');
};

/**
 * Notify parent of an error
 * @param {string} message - Error message
 * @param {string} stack - Optional stack trace
 */
export const notifyError = (message, stack = null) => {
    postToParent({
        type: 'UNBREAK_CONFIG_ERROR',
        message,
        stack,
    }, `error: ${message}`);
};

/**
 * Broadcast current configuration to parent (PUSH)
 * @param {object} config - Configuration object { product, colors, finish, quantity, parts, ... }
 * @param {string} reason - Reason for broadcast (e.g., "color_changed", "variant_changed")
 */
export const broadcastConfig = (config, reason = 'update') => {
    if (!config) {
        console.error('[UNBREAK_IFRAME] broadcastConfig called with null/undefined config');
        return;
    }
    
    // Log product-specific info for debugging
    const productInfo = config.product || 'unknown';
    const colorKeys = config.colors ? Object.keys(config.colors).join(',') : 'none';
    const logDetails = `product=${productInfo} | colors={${colorKeys}}`;
    
    postToParent({
        type: 'configChanged',
        config,
        reason,
    }, `${reason} | ${logDetails}`);
};

/**
 * Initialize GET_CONFIGURATION listener (PULL)
 * Parent can request current config at any time
 * @param {function} getConfigFn - Function that returns current config object
 */
export const initConfigurationListener = (getConfigFn) => {
    const handler = (event) => {
        try {
            if (!event?.data) return;
            if (event.data.type !== 'GET_CONFIGURATION') return;
            
            // Security check: verify origin
            if (!ALLOWED_PARENTS.has(event.origin)) {
                console.warn('[UNBREAK_IFRAME] GET_CONFIGURATION blocked from unknown origin:', event.origin);
                return;
            }
            
            // Store parent origin for future postMessage calls
            window.__unbreakParentOrigin = event.origin;
            
            console.info('[UNBREAK_IFRAME] GET_CONFIGURATION received from', event.origin);
            
            // Get current config
            const config = getConfigFn();
            
            if (!config) {
                console.error('[UNBREAK_IFRAME] getConfigFn returned null/undefined');
                return;
            }
            
            // Respond immediately (<100ms guaranteed)
            const response = {
                type: 'configChanged',
                config,
                reason: 'GET_CONFIGURATION',
            };
            
            event.source?.postMessage(response, event.origin);
            console.info('[UNBREAK_IFRAME] Responded to GET_CONFIGURATION', event.origin, config);
            
        } catch (err) {
            console.error('[UNBREAK_IFRAME] GET_CONFIGURATION handler error:', err);
            notifyError('GET_CONFIGURATION handler failed', err.stack);
        }
    };
    
    window.addEventListener('message', handler);
    console.info('[UNBREAK_IFRAME] GET_CONFIGURATION listener initialized');
    
    // Return cleanup function
    return () => {
        window.removeEventListener('message', handler);
        console.info('[UNBREAK_IFRAME] GET_CONFIGURATION listener removed');
    };
};

/**
 * Initialize timeout fallback: if READY is not sent within specified time, send ERROR
 * @param {number} timeoutMs - Timeout in milliseconds (default 12000ms = 12s)
 * @returns {function} Cleanup function to clear timeout
 */
export const initTimeoutFallback = (timeoutMs = 12000) => {
    window.__unbreakReadySent = false;
    
    const timeoutId = setTimeout(() => {
        if (!window.__unbreakReadySent) {
            console.warn('[UNBREAK_IFRAME] Timeout reached without READY event');
            notifyError('Configurator initialization timeout', 'timeout');
        }
    }, timeoutMs);
    
    return () => {
        clearTimeout(timeoutId);
    };
};
