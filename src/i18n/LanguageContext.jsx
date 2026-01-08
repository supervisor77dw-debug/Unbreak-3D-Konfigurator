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

    // Listen for SET_LANGUAGE messages from parent window
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event.data) return;
            
            if (event.data.type === 'SET_LANGUAGE') {
                const newLang = event.data.lang;
                
                if (newLang === 'de' || newLang === 'en') {
                    console.info(`[i18n] Language changed via postMessage: ${newLang}`);
                    setLanguage(newLang);
                } else {
                    console.warn(`[i18n] Invalid language received: ${newLang}`);
                }
            }
        };
        
        window.addEventListener('message', handleMessage);
        console.info('[i18n] SET_LANGUAGE listener initialized');
        
        return () => {
            window.removeEventListener('message', handleMessage);
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
