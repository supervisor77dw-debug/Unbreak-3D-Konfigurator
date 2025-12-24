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
                    camera={{ fov: 45, position: [0, 0, 5], near: 0.01, far: 1000 }}
                    shadows
                    gl={{
                        antialias: true,
                        alpha: true,
                        powerPreference: "high-performance",
                    }}
                >
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

                        {/* Studio Lighting Setup */}
                        <ambientLight intensity={0.5} color="#ffffff" />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
                        <pointLight position={[-10, 5, -10]} intensity={1} color="#ffffff" />

                        <Environment preset="studio" blur={0.8} />

                        <ContactShadows
                            position={[0, -0.01, 0]}
                            opacity={0.4}
                            scale={5}
                            blur={2}
                            far={0.5}
                        />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>
        </div>
    );
};

export default Scene;
