import React, { useRef, useMemo, useEffect } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import { useGLTF } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { getObfuscatedScale, obfuscateGeometry } from '../../utils/obfuscation';
import * as THREE from 'three';

// Asset paths - Using U1_* GLB files
const ASSETS = {
    baseplate: '/assets/models/U1_Baseplate.glb',
    arm: '/assets/models/U1_Arm.glb',
    insert: '/assets/models/U1_Insert_Rubber.glb',
    pattern: '/assets/models/U1_Pattern_Windrose.glb',
};

// Part loader with optional smooth normals for specific parts
const Part = ({ url, color, renderOrder = 0, smoothNormals = false }) => {
    const { scene } = useGLTF(url);
    const clone = useMemo(() => scene.clone(), [scene]);

    useEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh) {
                // Security: Vertex jitter only
                if (!child.userData.isObfuscated) {
                    obfuscateGeometry(child.geometry);
                    child.userData.isObfuscated = true;
                }

                // Smooth normals only for specified parts (U1_Arm)
                // Vereinheitlicht Vertex-Normalen für durchgehend glatte Oberfläche
                if (smoothNormals && !child.userData.normalsSmoothed) {
                    child.geometry.computeVertexNormals();
                    child.userData.normalsSmoothed = true;
                }

                // Apply color with smooth shading
                child.material = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.75,
                    metallic: 0.0,
                    flatShading: false,
                    side: THREE.FrontSide,
                });

                child.renderOrder = renderOrder;
            }
        });
    }, [clone, color, renderOrder, smoothNormals]);

    return <primitive object={clone} />;
};

const ConfiguratorModel = () => {
    const { variant, pattern, colors, palette } = useConfigurator();
    const group = useRef();
    const { camera, controls } = useThree();
    const hasFittedCamera = useRef(false);

    // Map colors from palette
    const baseplateColor = palette[colors.base];
    const armColor = palette[colors.arm];
    const insertColor = palette[colors.module];
    const patternColor = palette[colors.pattern];

    // Global Scale Obfuscation
    const scale = useMemo(() => getObfuscatedScale(), []);

    // Auto-fit camera on initial load
    useFrame(() => {
        if (!hasFittedCamera.current && group.current) {
            const box = new THREE.Box3().setFromObject(group.current);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;

            camera.position.set(
                center.x + cameraDistance * 0.5,
                center.y + cameraDistance * 0.5,
                center.z + cameraDistance
            );

            if (controls) {
                controls.target.copy(center);
                controls.update();
            }

            camera.lookAt(center);
            camera.updateProjectionMatrix();
            hasFittedCamera.current = true;
        }
    });

    if (variant === 'bottle_holder') {
        return null;
    }

    return (
        <group ref={group} dispose={null} scale={scale}>
            {/* 
             Assembly: Baseplate (unten) -> Arm -> Insert -> Pattern
             Modelle sind visuell final - keine Depth-Tricks nötig
            */}

            {/* Baseplate - renderOrder 0 (zuerst, liegt darunter) */}
            <Part url={ASSETS.baseplate} color={baseplateColor} renderOrder={0} />

            {/* Arm - renderOrder 1, smoothNormals für glatte Oberfläche */}
            <Part url={ASSETS.arm} color={armColor} renderOrder={1} smoothNormals={true} />

            {/* Rubber Insert */}
            <Part url={ASSETS.insert} color={insertColor} renderOrder={2} />

            {/* Optional Pattern (Windrose) */}
            {pattern.enabled && (
                <Part url={ASSETS.pattern} color={patternColor} renderOrder={3} />
            )}
        </group>
    );
};

// Preload all GLB assets
Object.values(ASSETS).forEach(url => useGLTF.preload(url));

export default ConfiguratorModel;
