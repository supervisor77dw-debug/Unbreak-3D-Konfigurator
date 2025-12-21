import React, { useRef, useMemo, useEffect } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import { useGLTF } from '@react-three/drei';
import { getObfuscatedScale, obfuscateGeometry } from '../../utils/obfuscation';
import * as THREE from 'three';

// Asset paths - Using U1_* GLB files
const ASSETS = {
    baseplate: '/assets/models/U1_Baseplate.glb',
    arm: '/assets/models/U1_Arm.glb',
    insert: '/assets/models/U1_Insert_Rubber.glb',
    pattern: '/assets/models/U1_Pattern_Windrose.glb',
};

// Component to load and secure a GLB part
const Part = ({ url, color, position = [0, 0, 0], rotation = [0, 0, 0] }) => {
    const { scene } = useGLTF(url);

    // Clone to avoid sharing mutation across instances
    const clone = useMemo(() => scene.clone(), [scene]);

    // Apply Security (Obfuscation) + Material Color
    useEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh) {
                // 1. Obfuscate Geometry (Vertex Jitter) - only once
                if (!child.userData.isObfuscated) {
                    obfuscateGeometry(child.geometry);
                    child.userData.isObfuscated = true;
                }

                // 2. Apply Material Color
                child.material = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.75,
                    metallic: 0.0,
                });
            }
        });
    }, [clone, color]);

    return <primitive object={clone} position={position} rotation={rotation} />;
};

const ConfiguratorModel = () => {
    const { variant, pattern, colors, palette } = useConfigurator();
    const group = useRef();

    // Map colors from palette
    const baseplateColor = palette[colors.base];
    const armColor = palette[colors.arm];
    const insertColor = palette[colors.module];
    const patternColor = palette[colors.pattern];

    // Global Scale Obfuscation (applied once per session)
    const scale = useMemo(() => getObfuscatedScale(), []);

    // If bottle holder variant selected, show nothing (coming soon)
    if (variant === 'bottle_holder') {
        return null;
    }

    return (
        <group ref={group} dispose={null} scale={scale}>
            {/* 
         ASSEMBLY:
         Baseplate -> Arm -> Rubber Insert -> Optional Pattern (Windrose)
         
         Using origins from GLB files. If alignment is off, add position/rotation here.
      */}

            {/* Baseplate */}
            <Part url={ASSETS.baseplate} color={baseplateColor} />

            {/* Arm */}
            <Part url={ASSETS.arm} color={armColor} />

            {/* Rubber Insert (used for both Wine and Champagne mode) */}
            <Part url={ASSETS.insert} color={insertColor} />

            {/* Optional Pattern (Windrose) */}
            {pattern.enabled && (
                <Part url={ASSETS.pattern} color={patternColor} />
            )}
        </group>
    );
};

// Preload all GLB assets to prevent suspense flicker
Object.values(ASSETS).forEach(url => useGLTF.preload(url));

export default ConfiguratorModel;
