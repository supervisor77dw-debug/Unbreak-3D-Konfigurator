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

// Part loader with premium material refinement and smooth color transitions
const Part = ({ url, color, renderOrder = 0, smoothNormals = false, isFixedBlack = false, isAccent = false }) => {
    const { scene } = useGLTF(url);
    const clone = useMemo(() => scene.clone(), [scene]);
    const materialRef = useRef();
    const targetColor = useMemo(() => new THREE.Color(color), [color]);
    const currentColor = useMemo(() => new THREE.Color(color), []);

    // Create a shared premium material
    const premiumMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: isFixedBlack ? '#121212' : color,
            roughness: isAccent ? 0.4 : 0.65, // Accents (Windrose) are slightly smoother/more satin
            metalness: isAccent ? 0.2 : 0.15, // Subtle metallic feel
            envMapIntensity: 1.2,
            flatShading: false,
            side: THREE.DoubleSide,
            vertexColors: false,
        });
    }, [isFixedBlack, isAccent, color]);

    useEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh || child.isLine || child.isPoints || child.type.includes('Line') || child.type.includes('Points')) {
                // 1. Security: Vertex jitter
                if (!child.userData.isObfuscated && child.geometry) {
                    obfuscateGeometry(child.geometry);
                    child.userData.isObfuscated = true;
                }

                // 2. Smooth normals
                if (smoothNormals && child.isMesh && !child.userData.normalsSmoothed) {
                    child.geometry.computeVertexNormals();
                    child.userData.normalsSmoothed = true;
                }

                // 3. Material Assignment
                child.material = premiumMaterial;
                materialRef.current = premiumMaterial;

                // 4. Geometry Cleanup
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
    }, [clone, premiumMaterial, renderOrder, smoothNormals]);

    // Smooth Color Animation
    useFrame((state, delta) => {
        if (materialRef.current && !isFixedBlack) {
            // Smoothly lerp to target color
            currentColor.lerp(targetColor, delta * 4); // delta * 4 for smooth but snappy feel
            materialRef.current.color.copy(currentColor);
        }
    });

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

    // Hero Camera Positioning on initial load
    useFrame(() => {
        if (!hasFittedCamera.current && group.current) {
            const box = new THREE.Box3().setFromObject(group.current);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            // Slightly tighter distance for more presence
            let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.25;

            // Product slightly elevated in frame
            camera.position.set(
                center.x + cameraDistance * 0.7,
                center.y + cameraDistance * 0.4,
                center.z + cameraDistance * 0.8
            );

            if (controls) {
                // Focus slightly above the bottom for better presence
                controls.target.set(center.x, center.y - 0.2, center.z);
                controls.update();
            }

            camera.lookAt(center.x, center.y - 0.2, center.z);
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
                <Part url={ASSETS.bottleRose} color={patternColor} renderOrder={2} isFixedBlack={false} isAccent={true} />
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
                <Part url={ASSETS.pattern} color={patternColor} renderOrder={3} isAccent={true} />
            )}
        </group>
    );
};

// Preload all GLB assets
Object.values(ASSETS).forEach(url => useGLTF.preload(url));

export default ConfiguratorModel;
