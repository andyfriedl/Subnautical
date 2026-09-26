import { biomeBackgrounds } from '../assets/biomeBackgrounds.js';
import { diveDefaults, mergeDefaults } from './diveDefaults.js';

const modules = import.meta.glob(['./*.js', '!./index.js', '!./diveDefaults.js', '!./environmentDefaults.js'], { eager: true });
const overrides = new Map(Object.values(modules)
    .map(module => module.default).filter(config => Number.isInteger(config?.biome))
    .map(config => [config.biome, config]));
const biomes = new Map(biomeBackgrounds.map(background => {
    const config = mergeDefaults(diveDefaults, overrides.get(background.biome) ?? {});
    config.biome = background.biome;
    config.background.texture = background.key;
    config.intro ??= {
        title: 'OCEAN', label: 'OCEAN BIOME',
        description: 'Explore the seabed on your next dive.', mission: 'Collect debris and clean the sea.',
    };
    return [config.biome, config];
}));
export const biomeOrder = [...biomes.keys()];
export const availableBiomeIds = [...biomes.keys()];

export function getBiome(id) {
    const biome = biomes.get(id);
    if (!biome) throw new Error(`Unknown or disabled biome: ${id}`);
    return biome;
}
