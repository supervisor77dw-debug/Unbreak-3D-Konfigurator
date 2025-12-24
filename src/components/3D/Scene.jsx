import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, ContactShadows } from '@react-three/drei';
import ErrorBoundary from '../ErrorBoundary';
import ConfiguratorModel from './ConfiguratorModel';

const Scene = () => {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ErrorBoundary>
                <Canvas
                    dpr={[1, 2]}
                    camera={{ fov: 45, position: [0, 0, 5] }}
                    shadows
                    gl={{
                        antialias: true,
                        logarithmicDepthBuffer: true,
                        powerPreference: 'high-performance',
                        alpha: true // Allow CSS background to show through
                    }}
                >
                    <Suspense fallback={null}>
                        <ConfiguratorModel />

                        {/* High-End Camera Controls */}
                        <OrbitControls
                            makeDefault
                            enableDamping={true}
                            dampingFactor={0.05}
                            rotateSpeed={0.8}
                            minPolarAngle={Math.PI / 4}
                            maxPolarAngle={Math.PI / 1.75}
                            minDistance={2}
                            maxDistance={10}
                        />

                        {/* Studio Lighting Setup */}
                        <Environment preset="studio" blur={0.8} />

                        {/* Key Light (Side Softbox) */}
                        <spotLight
                            position={[10, 10, 10]}
                            angle={0.15}
                            penumbra={1}
                            intensity={2}
                            castShadow
                            shadow-mapSize={[2048, 2048]}
                        />

                        {/* Rim Light (Backlight for Contours) */}
                        <pointLight position={[-10, 5, -10]} intensity={4} color="#ffffff" />

                        {/* Fill Light */}
                        <ambientLight intensity={0.4} />

                        {/* Ground Contact Shadows for 'Weight' feeling */}
                        <ContactShadows
                            position={[0, -1.5, 0]}
                            opacity={0.6}
                            scale={10}
                            blur={2.5}
                            far={4.5}
                        />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>
        </div>
    );
};

export default Scene;
