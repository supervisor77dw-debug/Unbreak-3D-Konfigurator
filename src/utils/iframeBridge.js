/**
 * UNBREAK ONE - iframe Communication Bridge
 * Handles postMessage communication between configurator (child) and parent window
 */

const TARGET_ORIGIN = '*'; // TODO: Whitelist specific origins in production via ENV

/**
 * Send a message to the parent window
 * @param {string} type - Event type (e.g., "UNBREAK_CONFIG_READY")
 * @param {object} payload - Event payload
 */
export const notifyParent = (type, payload = {}) => {
    if (window.parent && window.parent !== window) {
        const message = {
            type,
            payload: {
                ...payload,
                ts: Date.now(),
            },
            source: 'UNBREAK_CONFIGURATOR',
        };
        
        window.parent.postMessage(message, TARGET_ORIGIN);
        console.log(`[iframeBridge] Sent to parent:`, type, payload);
    }
};

/**
 * Notify parent that configurator is loading
 * @param {number} progress - Optional progress value 0-1
 */
export const notifyLoading = (progress = 0) => {
    notifyParent('UNBREAK_CONFIG_LOADING', { progress });
};

/**
 * Notify parent that configurator is ready (fully loaded + rendered)
 * @param {string} version - Optional version/git SHA
 */
export const notifyReady = (version = null) => {
    notifyParent('UNBREAK_CONFIG_READY', {
        ok: true,
        version: version || 'dev',
    });
};

/**
 * Notify parent of an error
 * @param {string} message - Error message
 * @param {string} stack - Optional stack trace
 */
export const notifyError = (message, stack = null) => {
    notifyParent('UNBREAK_CONFIG_ERROR', {
        message,
        stack,
    });
};

/**
 * Initialize timeout fallback: if READY is not sent within specified time, send ERROR
 * @param {number} timeoutMs - Timeout in milliseconds (default 12000ms = 12s)
 * @returns {function} Cleanup function to clear timeout
 */
export const initTimeoutFallback = (timeoutMs = 12000) => {
    let readySent = false;
    
    // Listen for our own READY event to cancel timeout
    const originalNotifyReady = notifyReady;
    window.__unbreakReadySent = false;
    
    const timeoutId = setTimeout(() => {
        if (!window.__unbreakReadySent) {
            console.warn('[iframeBridge] Timeout reached without READY event');
            notifyError('Configurator initialization timeout', 'timeout');
        }
    }, timeoutMs);
    
    // Override notifyReady to track when it's called
    const wrappedNotifyReady = (version) => {
        window.__unbreakReadySent = true;
        originalNotifyReady(version);
    };
    
    return () => {
        clearTimeout(timeoutId);
    };
};
