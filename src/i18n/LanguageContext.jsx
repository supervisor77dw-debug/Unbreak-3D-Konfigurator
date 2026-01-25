import React, { createContext, useContext, useState, useEffect } from 'react';
import { t as translate } from './translations';

const LanguageContext = createContext();

// ========================================
// SINGLE SOURCE OF TRUTH: localStorage key
// Must match the key used by unbreak-one.com Shop
// ========================================
const LANG_STORAGE_KEY = 'unbreak_lang';

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
 * Get language from localStorage (SINGLE SOURCE OF TRUTH)
 * @returns {string} 'de' | 'en' | null
 */
const getLanguageFromStorage = () => {
    try {
        const stored = localStorage.getItem(LANG_STORAGE_KEY);
        if (stored === 'de' || stored === 'en') {
            return stored;
        }
    } catch (e) {
        console.warn('[LANG] localStorage not available');
    }
    return null;
};

/**
 * Save language to localStorage (SINGLE SOURCE OF TRUTH)
 * This is the ONLY place where language persistence happens
 * @param {string} lang - 'de' | 'en'
 */
const saveLanguageToStorage = (lang) => {
    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
        console.log('[LANG] Configurator change → storage:', lang);
    } catch (e) {
        console.warn('[LANG] localStorage write failed');
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
    // ========================================
    // PRIORITY ORDER (per spec):
    // 1. localStorage (unbreak_lang) - SINGLE SOURCE OF TRUTH
    // 2. URL parameter (?lang=) - Fallback for deep links
    // 3. Default 'de'
    // ========================================
    const [language, setLanguageState] = useState(() => {
        // Priority 1: localStorage (SINGLE SOURCE OF TRUTH)
        const storedLang = getLanguageFromStorage();
        if (storedLang) {
            console.log('[LANG] Configurator init:', storedLang, '(from localStorage)');
            return storedLang;
        }
        
        // Priority 2: URL parameter (fallback for deep links)
        const urlLang = getLanguageFromURL();
        if (urlLang) {
            // Save to localStorage to establish single source of truth
            saveLanguageToStorage(urlLang);
            console.log('[LANG] Configurator init:', urlLang, '(from URL → saved to storage)');
            return urlLang;
        }
        
        // Priority 3: Default
        console.log('[LANG] Configurator init: de (default)');
        return 'de';
    });

    /**
     * Set language and persist to localStorage (SINGLE SOURCE OF TRUTH)
     * Also updates URL for bookmarkability
     * @param {string} newLang - 'de' | 'en'
     */
    const setLanguage = (newLang) => {
        if (newLang === 'de' || newLang === 'en') {
            setLanguageState(newLang);
            // CRITICAL: Write to localStorage FIRST (single source of truth)
            saveLanguageToStorage(newLang);
            // Also update URL for bookmarkability
            updateURLLanguage(newLang);
        }
    };

    // Listen for storage changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === LANG_STORAGE_KEY && (e.newValue === 'de' || e.newValue === 'en')) {
                console.log('[LANG] Storage changed externally:', e.newValue);
                setLanguageState(e.newValue);
                updateURLLanguage(e.newValue);
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
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
