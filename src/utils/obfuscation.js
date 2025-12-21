import { SECURITY_CONFIG } from '../config/security';
import * as THREE from 'three';

/**
 * Generates a deterministic random scale factor relative to a session ID.
 * In a real app, this might come from the server session.
 * Range: [1 - offset, 1 + offset]
 */
export const getObfuscatedScale = () => {
    if (!SECURITY_CONFIG.PROTECTION_MODE || !SECURITY_CONFIG.GEOMETRY.SCALE_OBFUSCATION) {
        return [1, 1, 1];
    }

    // Deterministic "session" simulation (using current hour to keep it stable for a bit)
    // or purely random for this demo:
    const offset = 0.03; // +/- 3%
    const randomFactor = 1 + (Math.random() * offset * 2 - offset);

    // Non-uniform scaling is even harder to reverse, but keep uniform for visual consistency if needed.
    // We'll use uniform here to keep it simple visually.
    return [randomFactor, randomFactor, randomFactor];
};

/**
 * Applies micro-jitter to a geometry's vertices.
 * WARNING: heavy operation, do only once per geometry load.
 */
export const obfuscateGeometry = (geometry) => {
    if (!SECURITY_CONFIG.PROTECTION_MODE || !SECURITY_CONFIG.GEOMETRY.JITTER_OBFUSCATION) {
        return geometry;
    }

    const positionAttribute = geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    const strength = SECURITY_CONFIG.GEOMETRY.JITTER_STRENGTH;

    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);

        // Add noise
        vertex.x += (Math.random() - 0.5) * strength;
        vertex.y += (Math.random() - 0.5) * strength;
        vertex.z += (Math.random() - 0.5) * strength;

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    // Update geometry
    geometry.computeVertexNormals(); // Recompute so lighting looks okay-ish (or don't, to make it even uglier for CAD!)
    // Recomputing normals makes it look "smooth" again visually, which is good for UX.
    // The underlying mesh is still noisy.

    positionAttribute.needsUpdate = true;
    return geometry;
};
