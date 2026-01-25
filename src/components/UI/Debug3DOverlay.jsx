/**
 * Debug3DOverlay - Shows 3D render/color debugging info
 * Activated via ?debug3d=1 URL parameter
 * 
 * Displays:
 * - Current color values per part (HEX/RGB)
 * - invalidate() call status
 * - material.needsUpdate status
 * - Renderer settings (colorSpace, toneMapping)
 * - Frame count after color change
 */
import React, { useState, useEffect, useRef } from 'react';
import { isDebug3DEnabled } from '../../config/debug';

// Global debug state (set from ConfiguratorModel)
window.__debug3d = {
    colors: {},
    invalidateCalls: 0,
    frameCount: 0,
    lastColorChange: null,
    rendererInfo: {},
    isAnimating: false,
};

const Debug3DOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [debugData, setDebugData] = useState({});
    const frameCountRef = useRef(0);

    useEffect(() => {
        const enabled = isDebug3DEnabled();
        setIsVisible(enabled);

        if (enabled) {
            console.info('[DEBUG3D] 3D Debug overlay activated - URL param ?debug3d=1');
            
            // Update state every 100ms
            const interval = setInterval(() => {
                setDebugData({ ...window.__debug3d });
            }, 100);

            return () => clearInterval(interval);
        }
    }, []);

    if (!isVisible) return null;

    const { colors, invalidateCalls, frameCount, lastColorChange, rendererInfo, isAnimating } = debugData;

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#00ff00',
            padding: '12px 16px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '11px',
            zIndex: 999998,
            maxWidth: '320px',
            border: '1px solid #00ff00',
            boxShadow: '0 4px 12px rgba(0, 255, 0, 0.3)',
        }}>
            <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '8px',
                color: '#00ff00',
                borderBottom: '1px solid #00ff00',
                paddingBottom: '4px',
            }}>
                🔧 3D DEBUG OVERLAY
            </div>

            {/* Color Values */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#ffff00', fontWeight: 'bold' }}>COLORS:</div>
                {colors && Object.entries(colors).map(([part, color]) => (
                    <div key={part} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            background: color || '#000',
                            border: '1px solid #fff',
                            borderRadius: '2px',
                        }} />
                        <span>{part}: {color || 'N/A'}</span>
                    </div>
                ))}
            </div>

            {/* Render Status */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#ffff00', fontWeight: 'bold' }}>RENDER:</div>
                <div style={{ marginLeft: '8px' }}>
                    <div>invalidate() calls: {invalidateCalls || 0}</div>
                    <div>Frame count: {frameCount || 0}</div>
                    <div>Animating: {isAnimating ? '✅ YES' : '❌ NO'}</div>
                    <div>Last change: {lastColorChange ? `${Date.now() - lastColorChange}ms ago` : 'N/A'}</div>
                </div>
            </div>

            {/* Renderer Info */}
            <div>
                <div style={{ color: '#ffff00', fontWeight: 'bold' }}>RENDERER:</div>
                <div style={{ marginLeft: '8px', fontSize: '10px' }}>
                    <div>colorSpace: {rendererInfo?.outputColorSpace || 'N/A'}</div>
                    <div>toneMapping: {rendererInfo?.toneMapping || 'N/A'}</div>
                    <div>frameloop: demand</div>
                </div>
            </div>

            <div style={{ 
                marginTop: '8px', 
                fontSize: '9px', 
                color: '#888',
                borderTop: '1px solid #333',
                paddingTop: '4px',
            }}>
                ?debug3d=1 to toggle
            </div>
        </div>
    );
};

export default Debug3DOverlay;
