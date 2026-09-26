// Isolated Deep dives; all environment pools use numeric eligibility.
export default {
    biome: 100,
    isolated: true,
    plantDensity: { start: 0.1, end: 0.35, exponent: 1 },
    fish: { schoolCount: 2, fishPerSchool: 5, color: '#0c1d2c', opacity: { min: 0.22, max: 0.35 } },
    intro: {
        title: 'DEEP OCEAN',
        label: 'DEEP BIOME',
        description: 'Almost no sunlight reaches this seabed. Faint silhouettes emerge beyond the headlights.',
        mission: 'Search within your light and recover debris from the depths.',
    },
    pickups: { cleanup: { start: 4, end: 6 } },
    density: { start: 0.4, end: 0.75, exponent: 1 },
    interactiveRarity: {
        common: { start: 1, end: 1 },
        uncommon: { start: 0.25, end: 0.25 },
        rare: { start: 0.06, end: 0.06 },
        veryRare: { start: 0.01, end: 0.01 },
    },
    lighting: {
        enabled: true,
        darknessAlpha: 0.985,
        color: '2, 6, 14',
        beamLength: 320,
        beamWidthStart: 70,
        beamWidthEnd: 290,
        softness: 0.92,
        ambientTint: 0x080f1d,
        bubbleLitAmount: 0.8,
        bubbleFadeDistance: 180,
        subRearTintStrength: 0.8,
        frontOffset: 0,
    },
    environment: {
        coralClusterCount: 2,
        // Plant multiplier progresses from 0.10 to 0.35 across five dives.
        grassBeds: { count: { min: 6, max: 10 } },
        rockCount: { min: 6, max: 10 },
    },
};
