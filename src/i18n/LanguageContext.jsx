import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { t as translate } from './translations';

const LanguageContext = createContext();

/**
 * PRODUCTION PARENT ORIGIN (Strict Whitelist)
 */
const PARENT_ORIGIN = 'https://unbreak-one.vercel.app';

/**
 * Check if origin is allowed (strict production mode)
 */
const isOriginAllowed = (origin) => {
    // Production whitelist
    if (origin === PARENT_ORIGIN) return true;
    
    // Local development
    if (origin === 'http://localhost:3000') return true;
    if (origin === 'http://localhost:5173') return true;
    if (origin === 'http://127.0.0.1:3000') return true;
    if (origin === 'http://127.0.0.1:5173') return true;
    
    // Vercel Preview Deployments pattern
    if (/^https:\/\/unbreak-[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
    
    return false;
};

/**
 * Get language from URL query parameter
 * @returns {string} 'de' | 'en' | null
 */
const getLanguageFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    
    if (lang === 'en' || lang === 'de') {
        return lang;
    }
    
    return null;
};

export const LanguageProvider = ({ children }) => {
    // Start with URL parameter or default 'de'
    const [language, setLanguage] = useState(() => {
        const urlLang = getLanguageFromURL();
        if (urlLang) {
            console.info(`[IFRAME][LANG][INIT] from URL: ${urlLang}`);
            return urlLang;
        }
        console.info('[IFRAME][LANG][INIT] default: de, waiting for parent...');
        return 'de';
    });

    const [hasReceivedLanguage, setHasReceivedLanguage] = useState(false);
    const [rerenderTick, setRerenderTick] = useState(0);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef(null);
    const maxRetries = 10;

    // GET_LANG request with retries
    useEffect(() => {
        // Skip if we have URL parameter
        if (getLanguageFromURL()) {
            setHasReceivedLanguage(true);
            return;
        }

        // Only in iframe
        if (window.parent === window) return;

        const correlationId = `lang-init-${Date.now()}`;
        
        const sendGetLang = () => {
            if (hasReceivedLanguage) {
                // Stop retries if we received language
                if (retryTimerRef.current) {
                    clearTimeout(retryTimerRef.current);
                    retryTimerRef.current = null;
                }
                return;
            }

            retryCountRef.current += 1;
            const attempt = retryCountRef.current;

            if (attempt > maxRetries) {
                console.warn('[IFRAME][LANG][RETRY] max retries reached, using default: de');
                setLanguage('de');
                setHasReceivedLanguage(true);
                return;
            }

            // Log retry
            if (attempt > 1) {
                console.warn('[IFRAME][LANG][RETRY]', attempt, correlationId);
            } else {
                console.info('[IFRAME][LANG] sent GET_LANG', correlationId);
            }

            // Send GET_LANG
            window.parent.postMessage(
                { type: 'UNBREAK_GET_LANG', correlationId },
                '*' // Validated on response
            );

            // Schedule next retry
            const delay = attempt === 1 ? 500 : 1000; // First retry after 500ms, then 1s
            retryTimerRef.current = setTimeout(sendGetLang, delay);
        };

        // Start initial request
        sendGetLang();

        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
            }
        };
    }, [hasReceivedLanguage]);

    // Listen for UNBREAK_SET_LANG messages from parent window
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event?.data) return;
            
            const msg = event.data;
            const msgType = msg.type || msg.event;
            
            // UNBREAK_SET_LANG: External language control
            if (msgType === 'UNBREAK_SET_LANG' || msgType === 'UNBREAK_SET_LOCALE') {
                const newLang = msg.lang;
                
                // Origin validation (STRICT)
                if (!isOriginAllowed(event.origin)) {
                    console.warn(`[IFRAME][SECURITY] blocked origin=${event.origin}`);
                    return;
                }
                
                console.info(`[IFRAME][LANG] received lang=${newLang} via ${msgType}`);
                
                if (newLang === 'de' || newLang === 'en') {
                    // Log before/after
                    const i18nBefore = language;
                    console.info(`[IFRAME][LANG] i18n.before=${i18nBefore} i18n.after=${newLang}`);
                    
                    // Apply language (this triggers React re-render)
                    setLanguage(newLang);
                    setHasReceivedLanguage(true);
                    
                    // Force re-render via tick
                    setRerenderTick(prev => {
                        const next = prev + 1;
                        console.info(`[IFRAME][LANG] rerenderTick=${next}`);
                        return next;
                    });
                    
                    console.info(`[IFRAME][LANG] applied lang=${newLang}`);
                    
                    // Send ACK to parent (ALWAYS) - use event.origin as targetOrigin
                    const ackPayload = {
                        type: 'UNBREAK_LANG_ACK',
                        lang: newLang,
                        ...(msg.correlationId && { correlationId: msg.correlationId })
                    };
                    
                    // Send ACK with exact origin (no wildcard)
                    event.source?.postMessage(ackPayload, event.origin);
                    console.info(`[IFRAME][ACK_OUT] sent lang=${newLang} targetOrigin=${event.origin}`);
                } else {
                    console.warn(`[IFRAME][LANG] invalid language=${newLang}`);
                }
            }
        };
        
        window.addEventListener('message', handleMessage);
        console.info('[IFRAME][LANG][LISTENER] ready for UNBREAK_SET_LANG');
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [language]); // Include language in deps to avoid stale closure

    // Register global language setter for external control
    useEffect(() => {
        window.__UNBREAK_setLanguage = (lang) => {
            if (lang === 'de' || lang === 'en') {
                console.info(`[IFRAME][LANG] changed via global setter: ${lang}`);
                setLanguage(lang);
                setRerenderTick(prev => prev + 1);
                return true;
            }
            console.warn(`[IFRAME][LANG] invalid language for global setter: ${lang}`);
            return false;
        };
        
        return () => {
            delete window.__UNBREAK_setLanguage;
        };
    }, []);

    // Translation helper bound to current language
    const t = (path) => translate(language, path);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }} key={`lang-${language}-${rerenderTick}`}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    
    return context;
};
