// Shared shallow habitat rules; asset pools remain automatically discovered.
export default {
    biome: 's',
    diveCount: 5,
    player: { x: 400, y: 300, heading: 'se' },
    pickups: { cleanup: { start: 4, end: 7 }, artifact: { start: 1, end: 2 } },
    // Smooth power curve reaches approximately reference density at S5.
    density: { start: 0.68, end: 1.18, exponent: 0.65 },
    interactiveRarity: {
        common: { start: 1, end: 1 },
        uncommon: { start: 0.25, end: 0.45 },
        rare: { start: 0.06, end: 0.14 },
        veryRare: { start: 0.01, end: 0.03 },
    },
    referenceSize: { width: 1152, height: 648 },
    background: { texture: 'seabed', tileScale: 0.45 },
    environment: {
        decorativeOverscan: 100,
        coralClusterCount: 4,
        grassClusterCount: { min: 5, max: 8 },
        lonePlantCount: 1,
        loneCoralCount: 1,
        rockCount: { min: 1, max: 2 },
        rockTypes: [
            { key: 's-rock-1', minScale: 0.28, maxScale: 0.42 },
            { key: 's-rock-2', minScale: 0.28, maxScale: 0.42 },
        ],
        coralTypes: [
            { key: 's-coral-orange-1', weight: 0.35, minScale: 0.18, maxScale: 0.30 },
            {
                key: 's-coral-purple-1',
                weight: 0.65,
                minScale: 0.20,
                maxScale: 0.32
            },
            {
                key: 's-coral-pink-1',
                weight: 0.35,
                minScale: 0.18,
                maxScale: 0.28
            }
        ],

        grassTypes: [
            { key: 's-c-grass-3', minScale: 0.22, maxScale: 0.36 },
            {
                key: 's-c-grass-1',
                minScale: 0.22,
                maxScale: 0.36
            },
            {
                key: 's-c-grass-2',
                minScale: 0.22,
                maxScale: 0.36
            }
        ],
    },
};
