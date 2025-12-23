// [SYNC 2025-12-23] Final Clean Sync
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
    // New Bottle Holder Assets
    bottleBody: '/assets/models/U1_Flaschenhalter.glb',
    bottleBase: '/assets/models/U1_Base_Flaschenhalter.glb',
    bottleRose: '/assets/models/U1_Rose_Flaschenhalter.glb',
};

// Part loader with optional smooth normals for specific parts
const Part = ({ url, color, renderOrder = 0, smoothNormals = false, isFixedBlack = false }) => {
    const { scene } = useGLTF(url);
    const clone = useMemo(() => scene.clone(), [scene]);

    useEffect(() => {
        clone.traverse((child) => {
            // Apply single material to everything that can be rendered
            if (child.isMesh || child.isLine || child.isPoints || child.type.includes('Line') || child.type.includes('Points')) {
                // 1. Security: Vertex jitter
                if (!child.userData.isObfuscated && child.geometry) {
                    obfuscateGeometry(child.geometry);
                    child.userData.isObfuscated = true;
                }

                // 2. Smooth normals only for specified parts
                if (smoothNormals && child.isMesh && !child.userData.normalsSmoothed) {
                    child.geometry.computeVertexNormals();
                    child.userData.normalsSmoothed = true;
                }

                // 3. Robust Material Override
                // For fixed black parts (holder body/base), we use a steady matte black
                const finalColor = isFixedBlack ? '#1a1a1a' : color;

                const material = new THREE.MeshStandardMaterial({
                    color: finalColor,
                    roughness: 0.85, // Matt/Seidenmatt
                    metallic: 0.0,
                    flatShading: false,
                    side: THREE.DoubleSide,
                    vertexColors: false,
                });

                child.material = material;

                // 4. Clear any geometry groups or vertex colors
                if (child.geometry) {
                    if (child.geometry.groups && child.geometry.groups.length > 0) {
                        child.geometry.clearGroups();
                    }
                    if (child.geometry.attributes.color) {
                        child.geometry.deleteAttribute('color');
                    }
                }

                child.renderOrder = renderOrder;
            }
        });
    }, [clone, color, renderOrder, smoothNormals, isFixedBlack, url]);

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

    // ASSEMBLY LOGIC
    if (variant === 'bottle_holder') {
        return (
            <group ref={group} dispose={null} scale={scale}>
                {/* 
                  MANDATORY BINDING:
                  Bottle Holder uses a specific Windrose asset (U1_Rose_Flaschenhalter.glb)
                  that matches its internal geometry depth/height.
                */}
                <Part url={ASSETS.bottleBase} color={patternColor} renderOrder={0} isFixedBlack={true} />
                <Part url={ASSETS.bottleBody} color={patternColor} renderOrder={1} isFixedBlack={true} />
                <Part url={ASSETS.bottleRose} color={patternColor} renderOrder={2} isFixedBlack={false} />
            </group>
        );
    }

    return (
        <group ref={group} dispose={null} scale={scale}>
            {/* 
             GLASHALTER ASSEMBLY: 
             Baseplate -> Arm -> Insert -> Pattern
            */}
            <Part url={ASSETS.baseplate} color={baseplateColor} renderOrder={0} />
            <Part url={ASSETS.arm} color={armColor} renderOrder={1} smoothNormals={true} />
            <Part url={ASSETS.insert} color={insertColor} renderOrder={2} />
            {pattern.enabled && (
                <Part url={ASSETS.pattern} color={patternColor} renderOrder={3} />
            )}
        </group>
    );
};

// Preload all GLB assets
Object.values(ASSETS).forEach(url => useGLTF.preload(url));

export default ConfiguratorModel;
