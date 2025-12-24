// [SYNC 2025-12-24] Added Auto-Fit Camera to Model
import React, { useRef, useMemo, useEffect } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import { useGLTF } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { getObfuscatedScale, obfuscateGeometry } from '../../utils/obfuscation';
import * as THREE from 'three';

/**
 * EaseOutCubic easing function for smooth animations
 */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Fits the camera to view the entire object based on its bounding box.
 * @param {THREE.Camera} camera - The camera to adjust
 * @param {THREE.Object3D} object - The object to fit
 * @param {OrbitControls} controls - The orbit controls
 * @param {number} margin - Safety margin multiplier (default 1.2 = 20% padding)
 * @param {boolean} animate - Whether to animate the transition
 * @param {number} duration - Animation duration in ms (default 500)
 * @param {boolean} isInitialLoad - Whether this is the first load (longer intro)
 */
const fitCameraToObject = (camera, object, controls, margin = 1.2, animate = false, duration = 500, isInitialLoad = false) => {
    if (!object || !camera || !controls) return;

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const radius = maxDim / 2;

    // Calculate camera distance based on FOV and object size
    const fov = camera.fov * (Math.PI / 180); // Convert to radians
    const distance = (radius * margin) / Math.tan(fov / 2);

    // Position camera at a nice angle (45° elevation, slight rotation)
    const theta = Math.PI / 4; // 45° horizontal
    const phi = Math.PI / 4;   // 45° elevation
    
    const targetX = center.x + distance * Math.sin(phi) * Math.cos(theta);
    const targetY = center.y + distance * Math.cos(phi);
    const targetZ = center.z + distance * Math.sin(phi) * Math.sin(theta);

    // Adjust near/far clipping planes
    camera.near = distance / 100;
    camera.far = distance * 10;
    camera.updateProjectionMatrix();

    // Update controls limits
    controls.minDistance = distance * 0.3;
    controls.maxDistance = distance * 3;

    if (animate) {
        // Store start position
        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        
        // For initial load: start further away (intro zoom)
        if (isInitialLoad) {
            const introDistanceMultiplier = 1.12; // 12% further away
            const introX = center.x + distance * introDistanceMultiplier * Math.sin(phi) * Math.cos(theta);
            const introY = center.y + distance * introDistanceMultiplier * Math.cos(phi);
            const introZ = center.z + distance * introDistanceMultiplier * Math.sin(phi) * Math.sin(theta);
            camera.position.set(introX, introY, introZ);
        }
        
        const startTime = Date.now();
        const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
        const actualStartPos = camera.position.clone();
        
        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            
            // Interpolate position
            camera.position.lerpVectors(actualStartPos, targetPos, eased);
            
            // Interpolate target
            controls.target.lerpVectors(startTarget, center, eased);
            controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };
        
        animateCamera();
    } else {
        // Instant positioning (no animation)
        camera.position.set(targetX, targetY, targetZ);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
    }

    // Debug logging (once)
    console.log('[FitCamera] Bbox size:', size);
    console.log('[FitCamera] Radius:', radius.toFixed(3));
    console.log('[FitCamera] Distance:', distance.toFixed(3));
    console.log('[FitCamera] Center:', center);
};

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
    const { variant, colors, palette } = useConfigurator();
    const group = useRef();
    const { camera, controls } = useThree();
    const hasFittedCamera = useRef(false);

    // Auto-fit camera when variant changes or on initial load
    useEffect(() => {
        if (group.current && camera && controls) {
            // Small delay to ensure geometry is fully loaded
            const timer = setTimeout(() => {
                const isFirstLoad = !hasFittedCamera.current;
                const duration = isFirstLoad ? 550 : 300; // 550ms intro, 300ms variant switch
                fitCameraToObject(camera, group.current, controls, 1.3, true, duration, isFirstLoad);
                hasFittedCamera.current = true;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [variant, camera, controls]);

    // Expose resetView function globally for UI button
    useEffect(() => {
        window.resetCameraView = () => {
            if (group.current && camera && controls) {
                fitCameraToObject(camera, group.current, controls, 1.3, true, 400, false);
            }
        };
        return () => {
            delete window.resetCameraView;
        };
    }, [variant, camera, controls]);

    // Map colors from palette
    const baseplateColor = palette[colors.base];
    const armColor = palette[colors.arm];
    const insertColor = palette[colors.module];
    const patternColor = palette[colors.pattern];

    // Global Scale Obfuscation
    const obfuscatedScale = useMemo(() => getObfuscatedScale(), []);

    // ASSEMBLY LOGIC
    // LITERALLY SCALE DOWN BY FACTOR 10 per request: 0.1 * scale
    // obfuscatedScale is an array [x, y, z], multiply each component
    const finalScale = useMemo(() => {
        return [obfuscatedScale[0] * 0.1, obfuscatedScale[1] * 0.1, obfuscatedScale[2] * 0.1];
    }, [obfuscatedScale]);

    if (variant === 'bottle_holder') {
        return (
            <group ref={group} dispose={null} scale={finalScale}>
                <Part url={ASSETS.bottleBase} color={patternColor} renderOrder={0} isFixedBlack={true} />
                <Part url={ASSETS.bottleBody} color={patternColor} renderOrder={1} isFixedBlack={true} />
                <Part url={ASSETS.bottleRose} color={patternColor} renderOrder={2} isFixedBlack={false} isAccent={true} />
            </group>
        );
    }

    return (
        <group ref={group} dispose={null} scale={finalScale}>
            {/* 
             GLASHALTER ASSEMBLY: 
             Baseplate -> Arm -> Insert -> Pattern
            */}
            <Part url={ASSETS.baseplate} color={baseplateColor} renderOrder={0} />
            <Part url={ASSETS.arm} color={armColor} renderOrder={1} smoothNormals={true} />
            <Part url={ASSETS.insert} color={insertColor} renderOrder={2} />
            {/* Windrose is now an integral part, always rendered */}
            <Part url={ASSETS.pattern} color={patternColor} renderOrder={3} isAccent={true} />
        </group>
    );
};

// Preload all GLB assets
Object.values(ASSETS).forEach(url => useGLTF.preload(url));

export default ConfiguratorModel;
