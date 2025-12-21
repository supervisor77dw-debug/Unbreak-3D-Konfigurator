import React from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import styles from './ModuleSelector.module.css';

const ModuleSelector = () => {
    const { module, setModule } = useConfigurator();

    const modules = [
        { id: 'wine', label: 'Wine Glass Holder' },
        { id: 'champagne', label: 'Champagne Holder' },
        { id: 'rubber', label: 'Rubber Insert' },
    ];

    return (
        <div className={styles.container}>
            <h3>Module Selection</h3>
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
