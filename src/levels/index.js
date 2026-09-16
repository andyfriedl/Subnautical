import shallow from '../biomes/shallow.js';

export const defaultLevelId = 's-01';

// Registry of the currently playable dive range; no authored mission files.
export function getLevel(id = defaultLevelId) {
    const match = /^s-(\d{2})$/.exec(id);
    const diveNumber = match ? Number(match[1]) : 0;
    if (diveNumber < 1 || diveNumber > shallow.diveCount) {
        throw new Error(`Unknown level: ${id}`);
    }
    return { biome: shallow.biome, diveNumber };
}

export function getNextLevelId(currentId) {
    if (typeof currentId !== 'string' || !/^s-\d{2}$/.test(currentId)) return null;
    const diveNumber = Number(currentId.slice(2));
    return diveNumber >= 1 && diveNumber < shallow.diveCount
        ? `s-${String(diveNumber + 1).padStart(2, '0')}` : null;
}
