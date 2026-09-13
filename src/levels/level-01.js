// Counts and ranges reproduce the original prototype's random spawning.
export default {
    id: 'level-01',
    player: { x: 400, y: 300, heading: 'se' },
    background: { texture: 'seabed', tileScale: 0.45 },
    environment: {
        decorativeOverscan: 100,
        interactivePadding: 70,
        coralClusterCount: 4,
        grassClusterCount: { min: 3, max: 5 },
        loneCoralCount: 4,
        rockCount: { min: 1, max: 2 },
        debrisCount: 3,
        coralTypes: [
            {
                key: 'coral-purple-1',
                weight: 0.65,
                minScale: 0.20,
                maxScale: 0.32
            },
            {
                key: 'coral-pink-1',
                weight: 0.35,
                minScale: 0.18,
                maxScale: 0.28
            }
        ],

        grassTypes: [
            {
                key: 'grass-1',
                minScale: 0.22,
                maxScale: 0.36
            },
            {
                key: 'grass-2',
                minScale: 0.22,
                maxScale: 0.36
            }
        ],
    },
    objects: [
        {
            id: 'cleanup-can-1',
            kind: 'cleanup',
            texture: 'can-1',
            x: 520,
            y: 360,
            origin: [0.5, 1],
            scale: 0.35,
            depth: 360,
        },
        {
            id: 'cleanup-can-2',
            kind: 'cleanup',
            texture: 'can-1',
            x: 230,
            y: 180,
            origin: [0.5, 1],
            scale: 0.35,
            depth: 180,
        },
        {
            id: 'cleanup-can-3',
            kind: 'cleanup',
            texture: 'can-1',
            x: 890,
            y: 190,
            origin: [0.5, 1],
            scale: 0.35,
            depth: 190,
        },
        {
            id: 'cleanup-can-4',
            kind: 'cleanup',
            texture: 'can-1',
            x: 260,
            y: 490,
            origin: [0.5, 1],
            scale: 0.35,
            depth: 490,
        },
        {
            id: 'cleanup-can-5',
            kind: 'cleanup',
            texture: 'can-1',
            x: 910,
            y: 490,
            origin: [0.5, 1],
            scale: 0.35,
            depth: 490,
        },
    ],
    objectives: [
        {
            id: 'clean-up-level-01',
            kind: 'cleanup',
            objectIds: [
                'cleanup-can-1',
                'cleanup-can-2',
                'cleanup-can-3',
                'cleanup-can-4',
                'cleanup-can-5',
            ],
        },
    ],
    completion: {
        threshold: 1,
        objectiveIds: ['clean-up-level-01'],
        mandatoryObjectiveIds: [],
    },
};
