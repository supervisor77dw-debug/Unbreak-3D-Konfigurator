import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment } from '@react-three/drei';
import ErrorBoundary from '../ErrorBoundary';
import ConfiguratorModel from './ConfiguratorModel';

const Scene = () => {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ErrorBoundary>
                <Canvas
                    dpr={[1, 2]}
                    camera={{ fov: 50 }}
                    gl={{
                        antialias: true,
                        logarithmicDepthBuffer: true, // Better depth precision
                        powerPreference: 'high-performance'
                    }}
                >
                    <Suspense fallback={null}>
                        <ConfiguratorModel />
                        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
                        <Environment preset="studio" />
                        <ambientLight intensity={1.5} />
                        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>
        </div>
    );
};

export default Scene;
