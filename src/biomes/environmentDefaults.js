// Habitat systems are opt-in. Shape defaults reproduce the established Shallow
// algorithms; nested overrides are merged without mutating the biome or defaults.
const defaults = {
    decorativeOverscan: 100,
    placement: { reservedFootprints: { enabled: false, padding: 4 } },
    coralClusterCount: 0,
    loneCoralCount: 0,
    lonePlantCount: 0,
    rockCount: { min: 0, max: 0 },
    scatterCount: { min: 6, max: 10 },
    scatterTypes: [],
    coralTypes: [], grassTypes: [], rockTypes: [],
    rarityLimits: { common: Infinity, uncommon: 8, rare: 3, veryRare: 1 },
    coral: {
        dominantShare: 0.8, edgeMargin: 120,
        miniClusters: { min: 2, max: 4 },
        miniDistance: { min: 20, max: 85 }, verticalSpread: 0.55,
        pieces: { min: 3, max: 6 }, spread: { x: 35, y: 18 },
        plants: {
            clumps: { min: 2, max: 4 }, anchorSpread: { x: 45, y: 24 },
            largeChance: 0.2, count: { min: 4, max: 8 }, largeCount: { min: 8, max: 12 },
            spread: { x: 20, y: 10 },
        },
    },
    grassBeds: {
        count: { min: 0, max: 0 }, edgeMargin: 20,
        largeChance: 0.2, plants: { min: 12, max: 24 }, largePlants: { min: 24, max: 32 },
        spreadX: { min: 95, max: 130, largeMin: 130, largeMax: 165 },
        spreadY: { min: 35, max: 50, largeMin: 45, largeMax: 65 },
        skew: 0.2, bend: 0.5,
    },
    rockClumps: {
        enabled: false, chance: 0.45, minPerClump: 2, maxPerClump: 3,
        radius: 70, spacing: 12, centerMargin: 100, edgeMargin: 12,
        playerClearance: { x: 80, y: 65 }, scatterSeparation: 1.6,
    },
};

export function resolveEnvironment(overrides = {}) {
    const merge = (base, patch) => {
        const result = structuredClone(base);
        for (const [key, value] of Object.entries(patch)) {
            result[key] = value && typeof value === 'object' && !Array.isArray(value)
                ? merge(base[key] ?? {}, value) : structuredClone(value);
        }
        return result;
    };
    return merge(defaults, overrides);
}
