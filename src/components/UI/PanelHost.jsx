import React, { useEffect, useState } from 'react';
import ColorPicker from './ColorPicker';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './PanelHost.module.css';

const PanelHost = ({ activePanel, onClose, variant, children }) => {
    const { t } = useLanguage();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 820);

    // Update mobile state on resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 820);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (activePanel) {
            document.addEventListener('keydown', handleEsc);
            return () => document.removeEventListener('keydown', handleEsc);
        }
    }, [activePanel, onClose]);

    if (!activePanel) return null;

    return (
        <>
            {/* Backdrop */}
            <div className={styles.backdrop} onClick={onClose} />

            {/* Panel Container */}
            <div className={`${styles.panel} ${isMobile ? styles.bottomSheet : styles.popover}`}>
                <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>
                        {activePanel === 'colors' && `🎨 ${t('ui.colorSelection')}`}
                        {activePanel === 'actions' && `⚙️ ${t('ui.actions')}`}
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose} aria-label={t('ui.close')}>
                        ✕
                    </button>
                </div>

                <div className={styles.panelContent}>
                    {activePanel === 'colors' && (
                        <div className={styles.colorsPanel}>
                            {variant === 'bottle_holder' && (
                                <p className={styles.info}>
                                    {t('ui.bottleHolderInfo')}
                                </p>
                            )}
                            <ColorPicker />
                        </div>
                    )}

                    {activePanel === 'actions' && (
                        <div className={styles.actionsPanel}>
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PanelHost;
