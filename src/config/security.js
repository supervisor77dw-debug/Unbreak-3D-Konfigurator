/**
 * UNBREAK1 Security Configuration
 * Controls various protection layers to prevent asset scraping and reverse engineering.
 */
export const SECURITY_CONFIG = {
    // Master toggle for all protection features
    PROTECTION_MODE: true,

    // Geometric Obfuscation
    GEOMETRY: {
        // Randomly scale the entire model (0.97 - 1.03) to break 1:1 dimension measurements
        SCALE_OBFUSCATION: true,

        // Add micro-noise to vertex positions to prevent clean CAD conversion
        // Value in meters (e.g., 0.0002 = 0.2mm)
        JITTER_OBFUSCATION: true,
        JITTER_STRENGTH: 0.0002,
    },

    // Asset Delivery Protection
    ASSETS: {
        // Require signed tokens for asset URLs (Simulated in prototype)
        TOKEN_GATED: true,

        // Time until token expires (in seconds), strictly for simulation logic
        TOKEN_TTL: 300,
    },

    // Runtime Protection
    RUNTIME: {
        // Disable debug logs in production
        DISABLE_LOGS: import.meta.env.PROD,

        // Prevent Context Menu (Right Click) on Canvas
        PREVENT_CONTEXT_MENU: true,
    },
};
