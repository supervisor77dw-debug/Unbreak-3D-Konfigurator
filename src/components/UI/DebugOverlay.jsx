/**
 * Debug Overlay - Shows postMessage communication status
 * Activated via ?debug=1 URL parameter
 */
import React, { useState, useEffect } from 'react';
import { getDebugLog, clearDebugLog } from '../../utils/iframeBridge';

const DebugOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [debugLog, setDebugLog] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // Check if debug mode is active
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const debugMode = params.get('debug') === '1';
        setIsVisible(debugMode);

        if (debugMode) {
            console.info('[DEBUG] Debug overlay activated');
            
            // Update log every 500ms
            const interval = setInterval(() => {
                const log = getDebugLog();
                setDebugLog(log);
            }, 500);

            return () => clearInterval(interval);
        }
    }, []);

    if (!isVisible) return null;

    const handleClear = () => {
        clearDebugLog();
        setDebugLog([]);
    };

    const lastEntry = debugLog[debugLog.length - 1];

    return (
        <div className="debug-overlay">
            {/* Compact status indicator */}
            {!isExpanded && (
                <div 
                    className="debug-compact"
                    onClick={() => setIsExpanded(true)}
                    title="Click to expand debug log"
                >
                    <div className="debug-indicator">
                        DEBUG
                    </div>
                    {lastEntry && (
                        <div className="debug-last-message">
                            {lastEntry.message}
                        </div>
                    )}
                    <div className="debug-count">
                        {debugLog.length} entries
                    </div>
                </div>
            )}

            {/* Expanded log viewer */}
            {isExpanded && (
                <div className="debug-expanded">
                    <div className="debug-header">
                        <h3>Debug Log</h3>
                        <div className="debug-actions">
                            <button onClick={handleClear}>Clear</button>
                            <button onClick={() => setIsExpanded(false)}>Minimize</button>
                        </div>
                    </div>
                    <div className="debug-log-container">
                        {debugLog.length === 0 && (
                            <div className="debug-empty">No debug entries yet</div>
                        )}
                        {debugLog.map((entry, idx) => (
                            <div key={idx} className="debug-entry">
                                <div className="debug-timestamp">
                                    {new Date(entry.timestamp).toLocaleTimeString('de-DE', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        fractionalSecondDigits: 3,
                                    })}
                                </div>
                                <div className="debug-message">{entry.message}</div>
                                {entry.data && (
                                    <div className="debug-data">
                                        <pre>{entry.data}</pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .debug-overlay {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 999999;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                }

                .debug-compact {
                    background: rgba(0, 0, 0, 0.9);
                    color: #0f0;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid #0f0;
                    box-shadow: 0 2px 8px rgba(0, 255, 0, 0.3);
                    max-width: 400px;
                }

                .debug-compact:hover {
                    background: rgba(0, 255, 0, 0.1);
                }

                .debug-indicator {
                    background: #0f0;
                    color: #000;
                    padding: 2px 6px;
                    border-radius: 2px;
                    font-weight: bold;
                    font-size: 10px;
                }

                .debug-last-message {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .debug-count {
                    background: rgba(0, 255, 0, 0.2);
                    padding: 2px 6px;
                    border-radius: 2px;
                    font-size: 10px;
                }

                .debug-expanded {
                    background: rgba(0, 0, 0, 0.95);
                    color: #0f0;
                    border: 2px solid #0f0;
                    border-radius: 8px;
                    width: 600px;
                    max-height: 500px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 16px rgba(0, 255, 0, 0.4);
                }

                .debug-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    border-bottom: 1px solid #0f0;
                }

                .debug-header h3 {
                    margin: 0;
                    font-size: 14px;
                }

                .debug-actions {
                    display: flex;
                    gap: 8px;
                }

                .debug-actions button {
                    background: #0f0;
                    color: #000;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                    font-family: 'Courier New', monospace;
                }

                .debug-actions button:hover {
                    background: #0c0;
                }

                .debug-log-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                }

                .debug-empty {
                    color: #666;
                    text-align: center;
                    padding: 20px;
                }

                .debug-entry {
                    margin-bottom: 12px;
                    padding: 8px;
                    background: rgba(0, 255, 0, 0.05);
                    border-left: 3px solid #0f0;
                }

                .debug-timestamp {
                    color: #0a0;
                    font-size: 10px;
                    margin-bottom: 4px;
                }

                .debug-message {
                    color: #0f0;
                    margin-bottom: 4px;
                }

                .debug-data {
                    margin-top: 4px;
                    padding: 8px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 3px;
                }

                .debug-data pre {
                    margin: 0;
                    color: #0c0;
                    font-size: 11px;
                    white-space: pre-wrap;
                    word-break: break-all;
                }

                .debug-log-container::-webkit-scrollbar {
                    width: 8px;
                }

                .debug-log-container::-webkit-scrollbar-track {
                    background: rgba(0, 255, 0, 0.1);
                }

                .debug-log-container::-webkit-scrollbar-thumb {
                    background: #0f0;
                    border-radius: 4px;
                }

                .debug-log-container::-webkit-scrollbar-thumb:hover {
                    background: #0c0;
                }
            `}</style>
        </div>
    );
};

export default DebugOverlay;
