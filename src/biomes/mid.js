// Shared mid-depth habitat rules; asset pools remain automatically discovered.
export default {
    biome: 50,
    diveCount: 5,
    intro: {
        title: 'MID DEPTHS',
        label: 'BIOME 50',
        description: 'Less sunlight reaches these depths. Plants grow sparse and different seafloor organisms appear.',
        mission: 'Use your headlights to search for debris and recover lost objects.',
    },
    player: { x: 400, y: 300, heading: 'se' },

    pickups: {
        cleanup: { start: 4, end: 7 },
        artifact: { start: 1, end: 2 }
    },

    density: { start: 0.5, end: 1.5, exponent: 1 },

    interactiveRarity: {
        common: { start: 1, end: 1 },
        uncommon: { start: 0.25, end: 0.45 },
        rare: { start: 0.06, end: 0.14 },
        veryRare: { start: 0.01, end: 0.03 },
    },

    referenceSize: { width: 1152, height: 648 },

    background: {
        texture: 'seabed-2',
        tileScale: 0.45
    },

    lighting: {
        enabled: true,
        darknessAlpha: 0.750,
        color: '5, 18, 38',
        beamLength: 320, // Forward distance from the claw area, in world pixels.
        beamWidthStart: 70, // Full width near the claws.
        beamWidthEnd: 290, // Full width at the far end, before feathering.
        softness: 0.75, // Fraction of the beam edge feathered (0–1).
        ambientTint: 0x1a3250,
        bubbleLitAmount: 0.8, // Blend from ambient toward the water-tinted bubble color.
        bubbleFadeDistance: 180, // Smooth local light falloff from the sub, in pixels.
        subRearTintStrength: 0.8, // 0 = original colors, 1 = full ambient rear tint.
        frontOffset: 0, // Extra forward distance from the controller's grab point.
    },

    environment: {
        placement: { reservedFootprints: { enabled: false, padding: 4 } },
        coralClusterCount: 2,
        // Standalone grass beds default to disabled.

        loneCoralCount: 10,

        rockCount: { min: 3, max: 20 },
        rockClumps: {
            enabled: true,
            chance: 0.45, // Chance of one small clump per dive.
            minPerClump: 2,
            maxPerClump: 6,
            radius: 70,
            spacing: 2, // Minimum gap between rock sprite bounds.
        },

    },
};
