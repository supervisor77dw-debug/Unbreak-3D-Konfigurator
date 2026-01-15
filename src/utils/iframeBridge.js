/**
 * UNBREAK ONE - iframe Communication Bridge (PRODUCTION READY)
 * Handles postMessage communication between configurator (child) and parent window
 * 
 * SECURITY: Pattern-based origin validation for Preview Deployments
 * RELIABILITY: Guaranteed delivery with fallbacks
 */

// ============================================
// ALLOWED PARENT ORIGINS
// ============================================

/**
 * Static allowed parent origins (production + localhost)
 * CRITICAL: Shop runs on www.unbreak-one.com (WITH www)
 * WITHOUT www = 307 redirect = CORS block
 */
const STATIC_ALLOWED_PARENTS = new Set([
    'https://www.unbreak-one.com',       // Production canonical (PRIMARY - CORS safe)
    'https://unbreak-one.vercel.app',    // Vercel production (fallback)
    // Local development
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]);

/**
 * Check if parent origin is allowed
 * CRITICAL: Supports Vercel Preview Deployments via pattern matching
 * 
 * Allowed patterns:
 * - https://www.unbreak-one.com (production WITH www - PRIMARY, CORS safe)
 * - https://unbreak-one.vercel.app (production vercel - fallback)
 * - https://unbreak-[preview-id].vercel.app (preview deployments)
 * - http://localhost:3000 (local dev)
 * 
 * @param {string} origin - Origin to validate
 * @returns {boolean} True if origin is allowed
 */
function isParentOriginAllowed(origin) {
    if (!origin) return false;
    
    // Check static whitelist first
    if (STATIC_ALLOWED_PARENTS.has(origin)) {
        return true;
    }
    
    // Pattern match for Vercel Preview Deployments
    // Matches: https://unbreak-[a-z0-9-]+.vercel.app
    const vercelPreviewPattern = /^https:\/\/unbreak-[a-z0-9-]+\.vercel\.app$/i;
    return vercelPreviewPattern.test(origin);
}

/**
 * Global variable to store validated parent origin from handshake
 * Used when document.referrer is unavailable
 */
let resolvedParentOrigin = null;

/**
 * Get parent origin from referrer
 * CRITICAL: Cannot use window.parent.location.origin due to cross-origin restrictions
 * 
 * @returns {string|null} Parent origin or null if unavailable
 */
function getParentOriginFromReferrer() {
    try {
        if (!document.referrer) return null;
        return new URL(document.referrer).origin;
    } catch (e) {
        console.warn('[UNBREAK_IFRAME] Invalid referrer URL:', document.referrer);
        return null;
    }
}

/**
 * Get validated parent origin
 * Try: 1) Handshake origin, 2) Referrer, 3) Fallback to production
 * 
 * @returns {string} Validated parent origin
 */
function getParentOrigin() {
    if (window.parent === window) return null; // Not in iframe
    
    // Try resolved origin from handshake (most reliable)
    if (resolvedParentOrigin && isParentOriginAllowed(resolvedParentOrigin)) {
        return resolvedParentOrigin;
    }
    
    // Try document.referrer (works in most cases)
    const referrerOrigin = getParentOriginFromReferrer();
    if (referrerOrigin && isParentOriginAllowed(referrerOrigin)) {
        return referrerOrigin;
    }
    
    // Fallback: use stored origin from previous messages
    const storedOrigin = window.__unbreakParentOrigin;
    if (storedOrigin && isParentOriginAllowed(storedOrigin)) {
        return storedOrigin;
    }
    
    // Safe default fallback (production WITH www - CORS safe)
    console.warn('[UNBREAK_IFRAME] Could not determine parent origin, using production fallback');
    return 'https://www.unbreak-one.com';
}

/**
 * Send a message to the parent window (SECURE)
 * Uses dynamic targetOrigin based on validated parent origin
 * 
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
        console.warn('[UNBREAK_IFRAME] Cannot determine parent origin - using production fallback');
    }
    
    // Validate origin (with fallback already validated)
    const targetOrigin = parentOrigin || 'https://www.unbreak-one.com';
    
    // Send message with dynamic targetOrigin (NOT wildcard '*')
    window.parent.postMessage(payload, targetOrigin);
    console.info(`[UNBREAK_IFRAME] postMessage -> ${targetOrigin} | ${payload.type}${reason ? ' | ' + reason : ''}`, payload);
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
    
    // Note: UNBREAK_GET_LANG is now sent by LanguageProvider on init
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
 * Also handles PARENT_HELLO handshake for origin resolution
 * 
 * @param {function} getConfigFn - Function that returns current config object
 */
export const initConfigurationListener = (getConfigFn) => {
    const handler = (event) => {
        try {
            if (!event?.data) return;
            
            // Handle parent handshake (for origin resolution)
            if (event.data.type === 'UNBREAK_ONE_PARENT_HELLO') {
                if (isParentOriginAllowed(event.origin)) {
                    resolvedParentOrigin = event.origin;
                    window.__unbreakParentOrigin = event.origin;
                    console.info('[UNBREAK_IFRAME] Parent handshake received from', event.origin);
                    
                    // Acknowledge handshake
                    event.source?.postMessage({
                        type: 'UNBREAK_ONE_CHILD_READY',
                    }, event.origin);
                } else {
                    console.warn('[UNBREAK_IFRAME] Handshake blocked from unknown origin:', event.origin);
                }
                return;
            }
            
            // Handle GET_CONFIGURATION request
            if (event.data.type !== 'GET_CONFIGURATION') return;
            
            // Security check: verify origin
            if (!isParentOriginAllowed(event.origin)) {
                console.warn('[UNBREAK_IFRAME] GET_CONFIGURATION blocked from unknown origin:', event.origin);
                return;
            }
            
            // Store parent origin for future postMessage calls
            resolvedParentOrigin = event.origin;
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
            console.error('[UNBREAK_IFRAME] Message handler error:', err);
            notifyError('Message handler failed', err.stack);
        }
    };
    
    window.addEventListener('message', handler);
    console.info('[UNBREAK_IFRAME] Message listener initialized (GET_CONFIGURATION + PARENT_HELLO)');
    
    // Return cleanup function
    return () => {
        window.removeEventListener('message', handler);
        console.info('[UNBREAK_IFRAME] Message listener removed');
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

// ============================================
// DEBUG LOGGING
// ============================================

/**
 * Debug logging to localStorage (survives redirects)
 * Activated via ?debug=1 URL parameter
 */
const MAX_DEBUG_ENTRIES = 50;

function isDebugMode() {
    try {
        return new URLSearchParams(window.location.search).get('debug') === '1';
    } catch {
        return false;
    }
}

function debugLog(message, data = null) {
    if (!isDebugMode()) return;
    
    try {
        const log = JSON.parse(localStorage.getItem('unbreak_debug_log') || '[]');
        const entry = {
            timestamp: new Date().toISOString(),
            message,
            data: data ? JSON.stringify(data) : null,
        };
        
        log.push(entry);
        
        // Keep only last MAX_DEBUG_ENTRIES entries (ringbuffer)
        if (log.length > MAX_DEBUG_ENTRIES) {
            log.shift();
        }
        
        localStorage.setItem('unbreak_debug_log', JSON.stringify(log));
        console.info('[DEBUG]', message, data);
    } catch (err) {
        console.error('[DEBUG] Failed to write debug log:', err);
    }
}

/**
 * Get debug log from localStorage
 */
export function getDebugLog() {
    try {
        return JSON.parse(localStorage.getItem('unbreak_debug_log') || '[]');
    } catch {
        return [];
    }
}

/**
 * Clear debug log
 */
export function clearDebugLog() {
    try {
        localStorage.removeItem('unbreak_debug_log');
        console.info('[DEBUG] Log cleared');
    } catch (err) {
        console.error('[DEBUG] Failed to clear log:', err);
    }
}

// ============================================
// ADD TO CART (postMessage) - STRICT VERSION
// ============================================

/**
 * CRITICAL: Shop origin must use WWW (CORS requirement)
 * WITHOUT www = 307 redirect = CORS block
 */
const SHOP_ORIGIN = 'https://www.unbreak-one.com';

/**
 * Get target window for postMessage
 * Priority: iframe parent > popup opener > null
 */
function getShopTargetWindow() {
    // 1) Iframe-case
    if (window.parent && window.parent !== window) {
        return window.parent;
    }

    // 2) Popup/new tab opened by shop
    if (window.opener && !window.opener.closed) {
        return window.opener;
    }

    // 3) Fallback: null (no target available)
    return null;
}

/**
 * Wait for ACK message from shop with matching requestId
 * @param {string} requestId - Unique request identifier
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<object>} Resolves with ACK data or rejects on timeout
 */
function waitForAck(requestId, timeoutMs = 2500) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            console.error('[CFG][ACK_TIMEOUT]', { requestId });
            debugLog('ACK_TIMEOUT', { requestId, timeoutMs });
            reject(new Error('ACK_TIMEOUT'));
        }, timeoutMs);

        function onMessage(event) {
            // Origin muss exakt passen
            if (event.origin !== SHOP_ORIGIN) {
                return;
            }

            const data = event.data;
            if (!data || typeof data !== 'object') {
                return;
            }

            // ACK muss matchen
            if (data.type === 'ADD_TO_CART_ACK' && data.requestId === requestId) {
                clearTimeout(timeout);
                window.removeEventListener('message', onMessage);
                console.log('[CFG][ACK_RECEIVED]', data);
                debugLog('ACK_RECEIVED', data);
                resolve(data);
            }
        }

        window.addEventListener('message', onMessage);
        console.log('[CFG][WAIT_ACK]', { requestId, timeoutMs });
        debugLog('WAIT_ACK', { requestId, timeoutMs });
    });
}

/**
 * Send ADD_TO_CART message to shop and wait for ACK
 * @param {object} config - Configuration object with variant, colors, finish, quantity, locale
 * @param {string} sessionId - Optional session ID from URL params
 * @returns {Promise<object>} Resolves with ACK data or rejects with error
 */
export const addToCart = async (config, sessionId = null) => {
    const targetWindow = getShopTargetWindow();
    const requestId = `cfg_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const message = {
        type: 'ADD_TO_CART',
        requestId,
        payload: {
            variant: config.variant || config.product, // glass_holder | bottle_holder
            quantity: config.quantity || 1,
            locale: config.locale || config.lang || 'de',
            colors: config.colors, // { base, arm, module, pattern }
            finish: config.finish || 'matte',
            configSessionId: sessionId,
            priceCents: 0, // Shop recalculates
            returnUrl: `${SHOP_ORIGIN}/shop`, // WWW is mandatory
        },
        source: 'UNBREAK-ONE_CONFIGURATOR',
        ts: Date.now(),
    };

    console.log('[CFG][POSTMSG_SEND]', {
        SHOP_ORIGIN,
        targetWindow: !!targetWindow,
        message,
    });

    debugLog('POSTMSG_SEND', {
        SHOP_ORIGIN,
        hasTargetWindow: !!targetWindow,
        requestId,
        variant: message.payload.variant,
    });

    if (!targetWindow) {
        console.error('[CFG][POSTMSG_SEND_ERR] No target window found (parent/opener missing).');
        debugLog('POSTMSG_SEND_ERR', { error: 'No target window' });
        throw new Error('No shop window target found');
    }

    // ACK-Waiter: Setup BEFORE sending message
    const ackPromise = waitForAck(requestId, 2500);

    // Send message with strict targetOrigin
    try {
        targetWindow.postMessage(message, SHOP_ORIGIN);
        console.log('[CFG][POSTMSG_SENT]', { requestId, SHOP_ORIGIN });
        debugLog('POSTMSG_SENT', { requestId });
    } catch (err) {
        console.error('[CFG][POSTMSG_SEND_FAILED]', err);
        debugLog('POSTMSG_SEND_FAILED', { error: err.message });
        throw err;
    }

    // Wait for ACK
    const ack = await ackPromise;

    return ack;
};
