import React, { createContext, useContext, useState, useEffect } from 'react';
import { t as translate } from './translations';

const LanguageContext = createContext();

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
    // Start with URL parameter or wait for parent response
    const [language, setLanguage] = useState(() => {
        const urlLang = getLanguageFromURL();
        if (urlLang) {
            console.info(`[LANG][IFRAME][INIT] Language from URL: ${urlLang}`);
            return urlLang;
        }
        console.info('[LANG][IFRAME][INIT] Waiting for parent language...');
        return 'de'; // Temporary default, will be updated by parent
    });

    const [hasReceivedLanguage, setHasReceivedLanguage] = useState(false);
    const [rerenderTick, setRerenderTick] = useState(0);

    // ALLOWED ORIGINS for language control (same as iframeBridge)
    const ALLOWED_ORIGINS = [
        'https://unbreak-one.vercel.app',
        'https://www.unbreak-one.com',
        'https://unbreak-one.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
    ];

    // Check if origin matches allowed pattern
    const isOriginAllowed = (origin) => {
        // Static whitelist
        if (ALLOWED_ORIGINS.includes(origin)) return true;
        // Pattern: unbreak-*.vercel.app (Preview Deployments)
        return /^https:\/\/unbreak-[a-z0-9-]+\.vercel\.app$/i.test(origin);
    };

    // Request language from parent on init
    useEffect(() => {
        // Skip if we have URL parameter
        if (getLanguageFromURL()) {
            setHasReceivedLanguage(true);
            return;
        }

        // Request language from parent
        if (window.parent !== window) {
            console.info('[LANG][IFRAME->PARENT][GET_LANG] Requesting language from parent...');
            window.parent.postMessage(
                { type: 'UNBREAK_GET_LANG' },
                '*' // Will be validated on response
            );

            // Fallback: If no response after 500ms, use default 'de'
            const fallbackTimer = setTimeout(() => {
                if (!hasReceivedLanguage) {
                    console.info('[LANG][IFRAME][FALLBACK] No response from parent, using default: de');
                    setLanguage('de');
                    setHasReceivedLanguage(true);
                }
            }, 500);

            return () => clearTimeout(fallbackTimer);
        }
    }, [hasReceivedLanguage]);

    // Listen for UNBREAK_SET_LANG messages from parent window
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event?.data) return;
            
            const msg = event.data;
            
            // UNBREAK_SET_LANG: External language control
            if (msg.type === 'UNBREAK_SET_LANG' || msg.type === 'UNBREAK_SET_LOCALE') {
                const receivedVia = msg.type;
                const newLang = msg.lang;
                
                // Log incoming message
                console.info(`[IFRAME][LANG] received lang=${newLang} via ${receivedVia}`);
                
                // Origin validation
                if (!isOriginAllowed(event.origin)) {
                    console.warn(`[IFRAME][SECURITY] blocked origin=${event.origin}`);
                    return;
                }
                
                if (newLang === 'de' || newLang === 'en') {
                    // Log before/after
                    const i18nBefore = language;
                    console.info(`[IFRAME][LANG] i18n.before=${i18nBefore} i18n.after=${newLang}`);
                    
                    // Apply language
                    setLanguage(newLang);
                    setHasReceivedLanguage(true);
                    
                    // Force re-render
                    setRerenderTick(prev => {
                        const next = prev + 1;
                        console.info(`[IFRAME][LANG] rerenderTick=${next}`);
                        return next;
                    });
                    
                    // Send ACK to parent (ALWAYS) with validated targetOrigin
                    const ackPayload = {
                        type: 'UNBREAK_LANG_ACK',
                        lang: newLang,
                        ...(msg.correlationId && { correlationId: msg.correlationId })
                    };
                    event.source?.postMessage(ackPayload, event.origin);
                    console.info(`[IFRAME][ACK_OUT] sent lang=${newLang} targetOrigin=${event.origin}`);
                } else {
                    console.warn(`[IFRAME][LANG] invalid language=${newLang}`);
                }
            }
        };
        
        window.addEventListener('message', handleMessage);
        console.info('[LANG][IFRAME][LISTENER] UNBREAK_SET_LANG listener ready');
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [hasReceivedLanguage]);

    // Register global language setter for external control
    useEffect(() => {
        window.__UNBREAK_setLanguage = (lang) => {
            if (lang === 'de' || lang === 'en') {
                console.info(`[i18n] Language changed via global setter: ${lang}`);
                setLanguage(lang);
                return true;
            }
            console.warn(`[i18n] Invalid language for global setter: ${lang}`);
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
