import React, { Suspense, useState, useEffect, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import ErrorBoundary from '../ErrorBoundary';

// Lazy load the ConfiguratorModel for better initial load time
const ConfiguratorModel = lazy(() => import('./ConfiguratorModel'));

// Loading skeleton for 3D canvas
const LoadingSkeleton = () => (
    <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        color: 'var(--text-secondary)',
    }}>
        <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(0, 212, 255, 0.2)',
            borderTopColor: 'var(--unbreak-cyan)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: '0.9rem' }}>Lade 3D-Modell...</span>
        <style>{`
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

// Inner canvas content with environment
const SceneContent = () => (
    <>
        <Suspense fallback={null}>
            <ConfiguratorModel />

            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.07}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.8}
                minDistance={0.5}
                maxDistance={50}
            />

            {/* Optimized Studio Lighting - reduced for performance */}
            <ambientLight intensity={0.6} color="#ffffff" />
            <spotLight 
                position={[10, 10, 10]} 
                angle={0.15} 
                penumbra={1} 
                intensity={1.2} 
                castShadow={false} /* Disabled shadow for performance */
            />
            <pointLight position={[-10, 5, -10]} intensity={0.8} color="#ffffff" />

            {/* Use lightweight preset instead of HDRI file */}
            <Environment preset="studio" background={false} />

            <ContactShadows
                position={[0, -0.01, 0]}
                opacity={0.35}
                scale={4}
                blur={2}
                far={0.4}
                frames={1} /* Static shadow - only render once */
            />
        </Suspense>
    </>
);

const Scene = () => {
    const [isReady, setIsReady] = useState(false);

    // Defer canvas initialization until after UI is interactive
    useEffect(() => {
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
            const id = window.requestIdleCallback(() => setIsReady(true), { timeout: 100 });
            return () => window.cancelIdleCallback(id);
        } else {
            const timer = setTimeout(() => setIsReady(true), 50);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
            background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)',
        }}>
            {!isReady && <LoadingSkeleton />}
            
            {isReady && (
                <ErrorBoundary>
                    <Canvas
                        dpr={[1, 1.5]} /* Reduced max DPR for performance */
                        camera={{ fov: 45, position: [0, 0, 5], near: 0.01, far: 1000 }}
                        shadows={false} /* Disabled for performance */
                        gl={{
                            antialias: true,
                            alpha: true,
                            powerPreference: "high-performance",
                            stencil: false, /* Disable unused features */
                            depth: true,
                        }}
                        frameloop="demand" /* Only render when needed */
                        performance={{ min: 0.5 }} /* Allow throttling on slow devices */
                    >
                        <SceneContent />
                    </Canvas>
                </ErrorBoundary>
            )}
        </div>
    );
};

export default Scene;
