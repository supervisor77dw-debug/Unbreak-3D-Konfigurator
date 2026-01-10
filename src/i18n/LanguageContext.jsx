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
    // Try URL parameter first, fallback to 'de'
    const [language, setLanguage] = useState(() => {
        const urlLang = getLanguageFromURL();
        if (urlLang) {
            console.info(`[i18n] Language from URL: ${urlLang}`);
            return urlLang;
        }
        console.info('[i18n] Using default language: de');
        return 'de';
    });

    // ALLOWED ORIGINS for language control (same as iframeBridge)
    const ALLOWED_ORIGINS = [
        'https://unbreak-one.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
    ];

    // Check if origin matches allowed pattern
    const isOriginAllowed = (origin) => {
        // Static whitelist
        if (ALLOWED_ORIGINS.includes(origin)) return true;
        // Pattern: unbreak-*.vercel.app (Preview Deployments)
        return /^https:\/\/unbreak-[a-z0-9-]+\.vercel\.app$/i.test(origin);
    };

    // Listen for UNBREAK_SET_LANG messages from parent window
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event?.data) return;
            
            const msg = event.data;
            
            // UNBREAK_SET_LANG: External language control
            if (msg.type === 'UNBREAK_SET_LANG') {
                // Origin validation
                if (!isOriginAllowed(event.origin)) {
                    console.warn(`[i18n] BLOCKED language change from: ${event.origin}`);
                    return;
                }
                
                const newLang = msg.lang;
                
                if (newLang === 'de' || newLang === 'en') {
                    console.info(`[i18n] Language changed via UNBREAK_SET_LANG: ${newLang}`);
                    setLanguage(newLang);
                    
                    // Send ACK to parent
                    event.source?.postMessage(
                        { type: 'UNBREAK_LANG_ACK', lang: newLang },
                        event.origin
                    );
                } else {
                    console.warn(`[i18n] Invalid language received: ${newLang}`);
                }
            }
            
            // Fallback: Support old SET_LANGUAGE format (backward compatibility)
            if (msg.type === 'SET_LANGUAGE') {
                if (!isOriginAllowed(event.origin)) {
                    console.warn(`[i18n] BLOCKED language change from: ${event.origin}`);
                    return;
                }
                
                const newLang = msg.lang;
                if (newLang === 'de' || newLang === 'en') {
                    console.info(`[i18n] Language changed via SET_LANGUAGE (legacy): ${newLang}`);
                    setLanguage(newLang);
                }
            }
        };
        
        window.addEventListener('message', handleMessage);
        console.info('[i18n] UNBREAK_SET_LANG listener initialized');
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

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
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
