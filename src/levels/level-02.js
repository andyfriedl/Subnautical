export default {
    id: 'level-02',
    referenceSize: { width: 1152, height: 648 },
    player: { x: 370, y: 330, heading: 'se' },
    background: { texture: 'seabed', tileScale: 0.45 },
    environment: {
        decorativeOverscan: 100,
        interactivePadding: 70,
        coralClusterCount: 5,
        grassClusterCount: { min: 4, max: 6 },
        loneCoralCount: 3,
        rockCount: { min: 2, max: 3 },
        debrisCount: 4,
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
        { id: 'level-02-cleanup-can-1-1', kind: 'cleanup', texture: 'can-1', x: 210, y: 250, origin: [0.5, 1], scale: 0.35, depth: 250 },
        { id: 'level-02-cleanup-can-1-2', kind: 'cleanup', texture: 'can-1', x: 850, y: 460, origin: [0.5, 1], scale: 0.35, depth: 460 },
        { id: 'level-02-cleanup-fishing-line-1-3', kind: 'cleanup', texture: 'fishing-line-1', x: 440, y: 165, origin: [0.5, 1], scale: 0.35, depth: 165 },
        { id: 'level-02-cleanup-fishing-line-1-4', kind: 'cleanup', texture: 'fishing-line-1', x: 590, y: 470, origin: [0.5, 1], scale: 0.35, depth: 470 },
        { id: 'level-02-cleanup-tire-1-5', kind: 'cleanup', texture: 'tire-1', x: 920, y: 300, origin: [0.5, 1], scale: 0.35, depth: 300 },
        { id: 'level-02-cleanup-blue-shoe-1-6', kind: 'cleanup', texture: 'blue-shoe-1', x: 270, y: 470, origin: [0.5, 1], scale: 0.35, depth: 470 },
        { id: 'level-02-cleanup-blue-shoe-1-7', kind: 'cleanup', texture: 'blue-shoe-1', x: 750, y: 160, origin: [0.5, 1], scale: 0.35, depth: 160 },
        { id: 'level-02-artifact-blue-ball-1-8', kind: 'artifact', texture: 'blue-ball-1', x: 570, y: 310, origin: [0.5, 1], scale: 0.35, depth: 310 },
        { id: 'level-02-artifact-skull-1-9', kind: 'artifact', texture: 'skull-1', x: 980, y: 510, origin: [0.5, 1], scale: 0.35, depth: 510 },
    ],
    objectives: [
        { id: 'cleanup-level-02', kind: 'cleanup', objectIds: ['level-02-cleanup-can-1-1', 'level-02-cleanup-can-1-2', 'level-02-cleanup-fishing-line-1-3', 'level-02-cleanup-fishing-line-1-4', 'level-02-cleanup-tire-1-5', 'level-02-cleanup-blue-shoe-1-6', 'level-02-cleanup-blue-shoe-1-7'] },
        { id: 'artifact-level-02', kind: 'artifact', objectIds: ['level-02-artifact-blue-ball-1-8', 'level-02-artifact-skull-1-9'] },
    ],
    completion: { threshold: 1, objectiveIds: ['cleanup-level-02', 'artifact-level-02'], mandatoryObjectiveIds: [] },
};
