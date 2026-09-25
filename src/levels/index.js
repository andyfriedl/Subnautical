import { biomeOrder, getBiome } from '../biomes/index.js';

export const defaultLevelId = '1-01';

export function getLevel(id = defaultLevelId) {
    const match = /^(\d+)-(\d{2})$/.exec(id);
    if (!match) throw new Error(`Unknown level: ${id}`);
    const config = getBiome(Number(match[1]));
    const diveNumber = Number(match[2]);
    if (diveNumber < 1 || diveNumber > config.diveCount) throw new Error(`Unknown level: ${id}`);
    return { biome: config.biome, diveNumber, diveCount: config.diveCount };
}

export function getNextLevelId(currentId) {
    let current;
    try { current = getLevel(currentId ?? ''); } catch { return null; }
    if (current.diveNumber < current.diveCount) {
        return `${current.biome}-${String(current.diveNumber + 1).padStart(2, '0')}`;
    }
    const biomeIndex = biomeOrder.indexOf(current.biome);
    if (biomeIndex < 0) return null; // Isolated biomes have no automatic successor.
    const nextBiome = biomeOrder[biomeIndex + 1];
    return nextBiome === undefined ? null : `${nextBiome}-01`;
}

export function getInitialLevelId(search = '') {
    const params = new URLSearchParams(search);
    const biome = params.get('biome');
    const dive = params.get('dive');
    if (!/^\d+$/.test(biome ?? '') || !/^\d+$/.test(dive ?? '')) return defaultLevelId;
    const id = `${Number(biome)}-${String(Number(dive)).padStart(2, '0')}`;
    try { getLevel(id); return id; } catch { return defaultLevelId; }
}
