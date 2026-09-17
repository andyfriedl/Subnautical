import shallow from '../biomes/shallow.js';

export const defaultLevelId = '1-01';

// Registry of the currently playable dive range; no authored mission files.
export function getLevel(id = defaultLevelId) {
    const match = /^1-(\d{2})$/.exec(id);
    const diveNumber = match ? Number(match[1]) : 0;
    if (diveNumber < 1 || diveNumber > shallow.diveCount) {
        throw new Error(`Unknown level: ${id}`);
    }
    return { biome: shallow.biome, diveNumber, diveCount: shallow.diveCount };
}

export function getNextLevelId(currentId) {
    if (typeof currentId !== 'string' || !/^1-\d{2}$/.test(currentId)) return null;
    const diveNumber = Number(currentId.slice(2));
    return diveNumber >= 1 && diveNumber < shallow.diveCount
        ? `1-${String(diveNumber + 1).padStart(2, '0')}` : null;
}
