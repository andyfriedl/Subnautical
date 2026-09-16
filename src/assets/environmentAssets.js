// Discover available textures, never objectives.
const files = import.meta.glob('./environment/{coral,plants,rocks,cleanup,artifacts}/*.png', {
    eager: true, query: '?url', import: 'default',
});
const RARITY_CODES = { c: 'common', u: 'uncommon', r: 'rare', vr: 'veryRare' };

function parseAssetStem(key) {
    const parts = key.split('-');
    const biome = /^(s|sm|m|md|d)$/.test(parts[0]) ? parts.shift() : 's';
    const rarity = Object.hasOwn(RARITY_CODES, parts[0])
        ? RARITY_CODES[parts.shift()] : 'common';
    return { biome, rarity, name: parts.join('-') };
}

export const environmentAssets = Object.entries(files).map(([path, url]) => {
    const category = path.split('/').at(-2);
    const key = path.split('/').at(-1).replace(/\.png$/i, '');
    const { biome, rarity } = parseAssetStem(key);
    return { key, category, biome, rarity, url };
});

export function assetsForBiome(biome, category) {
    return environmentAssets.filter(asset => asset.biome === biome && asset.category === category);
}

export function decorativePool(category, overrides = [], biome = 's') {
    const defaults = category === 'coral' ? { minScale: 0.18, maxScale: 0.30 }
        : category === 'plants' ? { minScale: 0.22, maxScale: 0.36 }
        : { minScale: 0.28, maxScale: 0.42 };
    return assetsForBiome(biome, category).map(({ key, category: assetCategory, rarity }) => ({
        key, ...defaults, ...overrides.find(type => type.key === key),
        category: assetCategory, rarity,
        // Strip biome/category prefixes and numeric variant, preserving color grouping.
        group: parseAssetStem(key).name.replace(/^coral-/, '').replace(/-\d+$/, ''),
    }));
}
