import React from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './ModuleSelector.module.css';

const ModuleSelector = () => {
    const { module, setModule } = useConfigurator();
    const { t } = useLanguage();

    const modules = [
        { id: 'wine', label: t('modules.wine') },
        { id: 'champagne', label: t('modules.champagne') },
        { id: 'rubber', label: t('modules.rubber') },
    ];

    return (
        <div className={styles.container}>
            <h3>{t('ui.glassVariant')}</h3>
            <div className={styles.grid}>
                {modules.map((m) => (
                    <button
                        key={m.id}
                        className={`${styles.button} ${module === m.id ? styles.active : ''}`}
                        onClick={() => setModule(m.id)}
                    >
                        {m.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ModuleSelector;
