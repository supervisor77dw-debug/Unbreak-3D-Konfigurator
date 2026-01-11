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

/**
 * Get language from localStorage
 * @returns {string} 'de' | 'en' | null
 */
const getLanguageFromStorage = () => {
    try {
        const stored = localStorage.getItem('lang');
        if (stored === 'de' || stored === 'en') {
            return stored;
        }
    } catch (e) {
        // localStorage not available
    }
    return null;
};

/**
 * Save language to localStorage
 * @param {string} lang - 'de' | 'en'
 */
const saveLanguageToStorage = (lang) => {
    try {
        localStorage.setItem('lang', lang);
    } catch (e) {
        // localStorage not available
    }
};

/**
 * Update URL query parameter (without reload)
 * @param {string} lang - 'de' | 'en'
 */
const updateURLLanguage = (lang) => {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());
};

export const LanguageProvider = ({ children }) => {
    // Initialize language from URL -> localStorage -> default 'de'
    const [language, setLanguageState] = useState(() => {
        // Priority 1: URL parameter
        const urlLang = getLanguageFromURL();
        if (urlLang) {
            saveLanguageToStorage(urlLang);
            console.info('[CONFIG] lang=', urlLang, '(from URL)');
            return urlLang;
        }
        
        // Priority 2: localStorage
        const storedLang = getLanguageFromStorage();
        if (storedLang) {
            console.info('[CONFIG] lang=', storedLang, '(from localStorage)');
            return storedLang;
        }
        
        // Priority 3: Default
        console.info('[CONFIG] lang= de (default)');
        return 'de';
    });

    /**
     * Set language and persist to localStorage + URL
     * @param {string} newLang - 'de' | 'en'
     */
    const setLanguage = (newLang) => {
        if (newLang === 'de' || newLang === 'en') {
            setLanguageState(newLang);
            saveLanguageToStorage(newLang);
            updateURLLanguage(newLang);
            console.info('[CONFIG] lang=', newLang);
        }
    };

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
