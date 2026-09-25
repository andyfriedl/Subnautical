import shallow from './shallow.js';
import mid from './mid.js';
import deep from './deep.js';

export const biomeOrder = [shallow.biome, mid.biome];
// Deep is selectable directly, but is not part of the progression chain yet.
const biomes = new Map([[shallow.biome, shallow], [mid.biome, mid], [deep.biome, deep]]);

export function getBiome(id) {
    const biome = biomes.get(id);
    if (!biome) throw new Error(`Unknown biome: ${id}`);
    return biome;
}
