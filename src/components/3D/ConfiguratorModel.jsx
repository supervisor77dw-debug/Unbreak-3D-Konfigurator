// [SYNC 2025-12-24] Added Auto-Fit Camera to Model
// [FIX 2026-01-25] Added invalidate() for frameloop="demand" color updates
import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext';
import { useGLTF } from '@react-three/drei';
import { useThree, useFrame, invalidate } from '@react-three/fiber';
import { getObfuscatedScale, obfuscateGeometry } from '../../utils/obfuscation';
import { isDebugUIEnabled, isDebug3DEnabled } from '../../config/debug';
import * as THREE from 'three';

// Initialize debug3d global state
if (typeof window !== 'undefined') {
    window.__debug3d = window.__debug3d || {
        colors: {},
        invalidateCalls: 0,
        frameCount: 0,
        lastColorChange: null,
        rendererInfo: {},
        isAnimating: false,
    };
}

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
const fitCameraToObject = (camera, object, controls, margin = 1.6, animate = false, duration = 500, isInitialLoad = false) => {
    if (!object || !camera || !controls) return { distance: 0, center: new THREE.Vector3() };

    // CRITICAL: Force world matrix update BEFORE bounds calculation
    object.updateWorldMatrix(true, true);

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const radius = maxDim / 2;

    // Calculate camera distance based on FOV and object size
    const fov = camera.fov * (Math.PI / 180); // Convert to radians
    let distance = (radius * margin) / Math.tan(fov / 2);

    // Position camera at a nice angle (45° elevation, slight rotation)
    const theta = Math.PI / 4; // 45° horizontal
    const phi = Math.PI / 4;   // 45° elevation
    
    // UNIFIED DOLLY-OUT: Apply 1.45x distance for ALL devices (not just mobile)
    // This creates the perfect framing that was previously only on mobile
    const dollyFactor = 1.45;
    distance *= dollyFactor;
    
    let targetX = center.x + distance * Math.sin(phi) * Math.cos(theta);
    let targetY = center.y + distance * Math.cos(phi);
    let targetZ = center.z + distance * Math.sin(phi) * Math.sin(theta);

    // Adjust near/far clipping planes
    camera.near = distance / 100;
    camera.far = distance * 10;
    camera.updateProjectionMatrix();

    // Update controls limits (unified for all devices)
    controls.minDistance = distance * 0.6;
    controls.maxDistance = distance * 6.0;

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

    return { distance, center };
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
// FIX: Added invalidate() support for frameloop="demand" mode
const Part = ({ url, color, renderOrder = 0, smoothNormals = false, isFixedBlack = false, isAccent = false, onColorAnimating }) => {
    const { scene } = useGLTF(url);
    const clone = useMemo(() => scene.clone(), [scene]);
    const materialRef = useRef();
    const targetColor = useMemo(() => new THREE.Color(color), [color]);
    const currentColor = useRef(new THREE.Color(color));
    const isAnimating = useRef(false);

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

    // Smooth Color Animation with invalidate() for frameloop="demand"
    useFrame((state, delta) => {
        if (materialRef.current && !isFixedBlack && currentColor.current) {
            // Calculate color distance manually (THREE.Color has no distanceTo method)
            const dr = currentColor.current.r - targetColor.r;
            const dg = currentColor.current.g - targetColor.g;
            const db = currentColor.current.b - targetColor.b;
            const distance = Math.sqrt(dr * dr + dg * dg + db * db);
            
            if (distance > 0.001) {
                // Smoothly lerp to target color
                currentColor.current.lerp(targetColor, Math.min(delta * 6, 0.3)); // Slightly faster for snappier feel
                materialRef.current.color.copy(currentColor.current);
                
                // CRITICAL: Request next frame for frameloop="demand"
                // This ensures smooth animation even without camera movement
                invalidate();
                
                // Debug tracking
                if (window.__debug3d) {
                    window.__debug3d.invalidateCalls++;
                    window.__debug3d.frameCount++;
                    window.__debug3d.isAnimating = true;
                }
                
                if (!isAnimating.current) {
                    isAnimating.current = true;
                    onColorAnimating?.(true);
                }
            } else if (isAnimating.current) {
                // Animation complete - snap to exact color
                currentColor.current.copy(targetColor);
                materialRef.current.color.copy(targetColor);
                isAnimating.current = false;
                onColorAnimating?.(false);
                
                // Debug tracking
                if (window.__debug3d) {
                    window.__debug3d.isAnimating = false;
                }
                
                // One final render to ensure clean state
                invalidate();
            }
        }
    });

    // CRITICAL: Trigger initial render when color prop changes
    useEffect(() => {
        // Force immediate re-render when color changes
        invalidate();
    }, [color]);

    return <primitive object={clone} />;
};

const ConfiguratorModel = () => {
    const { variant, colors, palette } = useConfigurator();
    const group = useRef();
    const { camera, controls } = useThree();
    const hasFittedCamera = useRef(false);
    const hasNotifiedReady = useRef(false);
    const lastFitVariant = useRef('');
    const fitRunCount = useRef(0);

    // Initialize global settings (unified for all devices)
    useEffect(() => {
        // UNIFIED: Same camera framing for ALL devices
        const isMobile = window.matchMedia('(max-width: 820px)').matches;
        const fitMargin = 1.6; // UNIFIED: Always 1.6 (was mobile-only before)
        
        window.__u1_isMobile = isMobile;
        window.__u1_fitMargin = fitMargin;
        window.__u1_updateDebug = (dist, camDist) => {
            const overlay = document.getElementById('u1-debug-overlay');
            if (overlay) {
                overlay.innerHTML = `
                    <strong>U1 DEBUG</strong><br>
                    DEVICE: ${isMobile ? 'MOBILE' : 'DESKTOP'}<br>
                    SCALE: 0.60 (unified)<br>
                    FIT_MARGIN: ${fitMargin.toFixed(2)} (unified)<br>
                    DOLLY: 1.45x (unified)<br>
                    DIST: ${dist ? dist.toFixed(3) : 'N/A'}<br>
                    CAM: ${camDist ? camDist.toFixed(3) : 'N/A'}<br>
                    FIT_RUNS: ${window.__u1_fitRunCount || 0}<br>
                    VIEWPORT: ${window.innerWidth}x${window.innerHeight}
                `;
            }
        };
        
        // Debug overlay (only if debug UI is enabled)
        if (isDebugUIEnabled()) {
            const debugDiv = document.createElement('div');
            debugDiv.id = 'u1-debug-overlay';
            debugDiv.style.cssText = `
                position: fixed;
                top: 70px;
                left: 10px;
                background: rgba(0, 212, 255, 0.9);
                color: #000;
                padding: 8px 12px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 11px;
                z-index: 9999;
                line-height: 1.4;
                pointer-events: none;
            `;
            debugDiv.innerHTML = `
                <strong>U1 DEBUG</strong><br>
                DEVICE: ${isMobile ? 'MOBILE' : 'DESKTOP'}<br>
                SCALE: 0.60 (unified)<br>
                FIT_MARGIN: ${fitMargin.toFixed(2)} (unified)<br>
                DOLLY: 1.45x (unified)<br>
                DIST: N/A<br>
                CAM: N/A<br>
                FIT_RUNS: 0<br>
                VIEWPORT: ${window.innerWidth}x${window.innerHeight}
            `;
            document.body.appendChild(debugDiv);
        }
        
        // Unified framing configured: scale=0.6, fitMargin=1.6, dolly=1.45x
    }, []);

    // Auto-fit camera when variant changes or on initial load
    useEffect(() => {
        if (group.current && camera && controls) {
            // Prevent double-fits: only fit if variant changed
            if (lastFitVariant.current === variant && hasFittedCamera.current) {
                // Fit skipped - variant unchanged
                return;
            }
            
            // Small delay to ensure geometry is fully loaded AND scale is applied
            const timer = setTimeout(() => {
                const isFirstLoad = !hasFittedCamera.current;
                const duration = isFirstLoad ? 550 : 300; // 550ms intro, 300ms variant switch
                
                // Use unified fit margin for all devices
                const fitMargin = window.__u1_fitMargin || 1.6;
                
                // CRITICAL: Update world matrix before fit
                group.current.updateWorldMatrix(true, true);
                
                // Increment fit counter
                fitRunCount.current++;
                window.__u1_fitRunCount = fitRunCount.current;
                
                const result = fitCameraToObject(camera, group.current, controls, fitMargin, true, duration, isFirstLoad);
                
                // Update last fit variant
                lastFitVariant.current = variant;
                hasFittedCamera.current = true;
                
                // Calculate camera distance to center for debug
                const camDist = camera.position.distanceTo(result.center);
                
                // Update debug overlay
                if (window.__u1_updateDebug) {
                    window.__u1_updateDebug(result.distance, camDist);
                }

                // READY Signal: Send after first load + camera fit + 1 frame rendered
                // This ensures the 3D model is fully loaded, positioned, and at least 1 frame is rendered
                if (isFirstLoad && !hasNotifiedReady.current) {
                    requestAnimationFrame(() => {
                        // Wait for 1 additional frame to ensure rendering is complete
                        requestAnimationFrame(() => {
                            console.info('[CONFIG] 3D model ready');
                            hasNotifiedReady.current = true;
                        });
                    });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [variant, camera, controls]);

    // Expose resetView function globally for UI button
    useEffect(() => {
        window.resetCameraView = () => {
            if (group.current && camera && controls) {
                const fitMargin = window.__u1_fitMargin || 1.6;
                
                // Force reset: clear lastFitVariant to allow re-fit
                lastFitVariant.current = '';
                
                group.current.updateWorldMatrix(true, true);
                const result = fitCameraToObject(camera, group.current, controls, fitMargin, true, 400, false);
                
                fitRunCount.current++;
                window.__u1_fitRunCount = fitRunCount.current;
                
                const camDist = camera.position.distanceTo(result.center);
                // View reset
                
                if (window.__u1_updateDebug) {
                    window.__u1_updateDebug(result.distance, camDist);
                }
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
    // UNIFIED SCALE: 0.06 (60% = 0.6) für ALLE Devices (Desktop + Mobile)
    // Keine device-spezifische Skalierung mehr!
    const finalScale = useMemo(() => {
        const baseScale = 0.06; // 0.1 (ursprünglich) × 0.6 = 0.06 = 60%
        return [obfuscatedScale[0] * baseScale, obfuscatedScale[1] * baseScale, obfuscatedScale[2] * baseScale];
    }, [obfuscatedScale]);

    // CRITICAL: Force re-render when colors change (for frameloop="demand")
    useEffect(() => {
        // Update debug tracking
        if (window.__debug3d) {
            window.__debug3d.colors = {
                base: baseplateColor,
                arm: armColor,
                insert: insertColor,
                pattern: patternColor,
            };
            window.__debug3d.lastColorChange = Date.now();
            window.__debug3d.frameCount = 0; // Reset frame count on color change
        }
        
        // Trigger render burst when colors change
        invalidate();
        
        // Schedule additional frames to ensure smooth transition
        const frameIds = [];
        for (let i = 1; i <= 10; i++) {
            frameIds.push(setTimeout(() => invalidate(), i * 16)); // ~60fps for 160ms
        }
        
        return () => frameIds.forEach(id => clearTimeout(id));
    }, [baseplateColor, armColor, insertColor, patternColor]);

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
