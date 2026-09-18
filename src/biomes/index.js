import shallow from './shallow.js';
import mid from './mid.js';

export const biomeOrder = [shallow.biome, mid.biome];
const biomes = new Map([[shallow.biome, shallow], [mid.biome, mid]]);

export function getBiome(id) {
    const biome = biomes.get(id);
    if (!biome) throw new Error(`Unknown biome: ${id}`);
    return biome;
}
