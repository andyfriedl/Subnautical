// Shared mid-depth habitat rules; asset pools remain automatically discovered.
export default {
    biome: 50,
    plantDensity: { start: 0.25, end: 0.75, exponent: 1 },
    fish: { schoolCount: 1, fishPerSchool: 13, color: '#183a4b', opacity: { min: 0.35, max: 0.55 } },
    intro: {
        title: 'MID DEPTHS',
        label: 'BIOME 50',
        description: 'Less sunlight reaches these depths. Plants grow sparse and different seafloor organisms appear.',
        mission: 'Use your headlights to search for debris and recover lost objects.',
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
        coral: {
            plants: {
                count: { min: 5, max: 10 },
                largeCount: { min: 10, max: 16 },
            },
        },
        // Shallow's base bed range, with lower plant-only progression.
        grassBeds: { count: { min: 6, max: 10 } },

        loneCoralCount: 10,

        rockCount: { min: 12, max: 26 },
        rockClumps: {
            enabled: true,
            chance: 0.95, // Chance to use the clustered layout.
            clusteredShare: 0.8, // Target share; reserve at least one isolated rock.
            minPerClump: 2,
            maxPerClump: 4,
            radius: 60,
            spacing: 2, // Minimum gap between rock sprite bounds.
        },

    },
};
