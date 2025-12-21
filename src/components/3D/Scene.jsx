import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment } from '@react-three/drei';
import ErrorBoundary from '../ErrorBoundary';
import ConfiguratorModel from './ConfiguratorModel';

const Scene = () => {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ErrorBoundary>
                <Canvas dpr={[1, 2]} camera={{ fov: 50 }}>
                    <Suspense fallback={null}>
                        <Stage environment="city" intensity={0.6} adjustCamera={false}>
                            <ConfiguratorModel />
                        </Stage>
                        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
                        <Environment preset="studio" />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>
        </div>
    );
};

export default Scene;
