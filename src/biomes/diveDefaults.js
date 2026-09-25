// Generic procedural dive settings. Biome files only override differences.
export const diveDefaults = {
    diveCount: 5,
    player: { x: 400, y: 300, heading: 'se' },
    pickups: { cleanup: { start: 4, end: 7 } },
    density: { start: 0.5, end: 1.5, exponent: 1 },
    interactiveRarity: {
        common: { start: 1, end: 1 },
        uncommon: { start: 0.25, end: 0.45 },
        rare: { start: 0.06, end: 0.14 },
        veryRare: { start: 0.01, end: 0.03 },
    },
    referenceSize: { width: 1152, height: 648 },
    background: { tileScale: 0.45 },
    fish: { schoolCount: 0 },
    environment: {},
};

export function mergeDefaults(base, overrides) {
    const result = structuredClone(base);
    for (const [key, value] of Object.entries(overrides)) {
        result[key] = value && typeof value === 'object' && !Array.isArray(value)
            ? mergeDefaults(base[key] ?? {}, value) : structuredClone(value);
    }
    return result;
}
