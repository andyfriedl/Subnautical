// Shared shallow habitat rules; asset pools remain automatically discovered.
export default {
    biome: 1,
    diveCount: 5,
    intro: {
        title: 'SHALLOW WATERS',
        label: 'BIOME 1',
        description: 'Sunlight reaches the seafloor, supporting abundant plants and coral. Debris can harm these habitats and marine life.',
        mission: 'Clean up debris and recover lost objects.',
    },
    player: { x: 400, y: 300, heading: 'se' },
    pickups: { cleanup: { start: 4, end: 7 } },
    // Scale habitat counts only: light at Level 1, reference at Level 3, fuller at Level 5.
    density: { start: 0.5, end: 1.5, exponent: 1 },
    interactiveRarity: {
        common: { start: 1, end: 1 },
        uncommon: { start: 0.25, end: 0.45 },
        rare: { start: 0.06, end: 0.14 },
        veryRare: { start: 0.01, end: 0.03 },
    },
    referenceSize: { width: 1152, height: 648 },
    background: { texture: 'seabed', tileScale: 0.45 },
    environment: {
        coralClusterCount: 4,
        grassBeds: { count: { min: 6, max: 10 } },
        lonePlantCount: 1,
        loneCoralCount: 1,
        rockCount: { min: 1, max: 2 },
        rockTypes: [
            { key: '1-49-c-rock-1', minScale: 0.28, maxScale: 0.42 },
            { key: '1-49-c-rock-2', minScale: 0.28, maxScale: 0.42 },
        ],
        coralTypes: [
            { key: '1-49-c-coral-orange-1', weight: 0.35, minScale: 0.18, maxScale: 0.30 },
            {
                key: '1-49-c-coral-purple-1',
                weight: 0.65,
                minScale: 0.20,
                maxScale: 0.32
            },
            {
                key: '1-49-c-coral-pink-1',
                weight: 0.35,
                minScale: 0.18,
                maxScale: 0.28
            }
        ],

        grassTypes: [
            { key: '1-49-c-grass-3', minScale: 0.22, maxScale: 0.36 },
            {
                key: '1-49-c-grass-1',
                minScale: 0.22,
                maxScale: 0.36
            },
            {
                key: '1-49-c-sw-grass-2',
                minScale: 0.22,
                maxScale: 0.36
            }
        ],
    },
};
