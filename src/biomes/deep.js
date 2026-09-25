// Isolated first Deep dive; all environment pools use numeric eligibility.
export default {
    biome: 100,
    fish: { schoolCount: 2, fishPerSchool: 5, color: '#0c1d2c', opacity: { min: 0.22, max: 0.35 } },
    diveCount: 1,
    intro: {
        title: 'DEEP OCEAN',
        label: 'BIOME 100',
        description: 'Almost no sunlight reaches this seabed. Faint silhouettes emerge beyond the headlights.',
        mission: 'Search within your light and recover debris from the depths.',
    },
    player: { x: 400, y: 300, heading: 'se' },
    pickups: { cleanup: { start: 4, end: 4 }, artifact: { start: 0, end: 0 } },
    density: { start: 0.4, end: 0.4, exponent: 1 },
    interactiveRarity: {
        common: { start: 1, end: 1 },
        uncommon: { start: 0.25, end: 0.25 },
        rare: { start: 0.06, end: 0.06 },
        veryRare: { start: 0.01, end: 0.01 },
    },
    referenceSize: { width: 1152, height: 648 },
    background: { texture: 'seabed-3', tileScale: 0.45 },
    lighting: {
        enabled: true,
        darknessAlpha: 0.96,
        color: '2, 6, 14',
        beamLength: 320,
        beamWidthStart: 70,
        beamWidthEnd: 290,
        softness: 0.75,
        ambientTint: 0x080f1d,
        bubbleLitAmount: 0.8,
        bubbleFadeDistance: 180,
        subRearTintStrength: 0.8,
        frontOffset: 0,
    },
    environment: {
        coralClusterCount: 2,
        // Uses the prepared 0.10 plant multiplier; empty pools safely skip.
        grassBeds: { count: { min: 6, max: 10 } },
        rockCount: { min: 6, max: 10 },
    },
};
