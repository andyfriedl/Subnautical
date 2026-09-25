// Discover available textures, never objectives.
const files = import.meta.glob('./environment/{coral,plants,rocks,cleanup,scatter}/*.png', {
    eager: true, query: '?url', import: 'default',
});
const RARITY_CODES = { c: 'common', u: 'uncommon', r: 'rare', vr: 'veryRare' };

function parseAssetStem(key) {
    const match = /^(\d+)-(\d+)-(c|u|r|vr)-(.+)$/.exec(key);
    if (!match) throw new Error(`Invalid environment filename: ${key}`);
    const rangeStart = Number(match[1]);
    const rangeEnd = Number(match[2]);
    if (!Number.isSafeInteger(rangeStart) || !Number.isSafeInteger(rangeEnd) || rangeStart < 1 || rangeEnd < rangeStart) {
        throw new Error(`Invalid biome range: ${key}`);
    }
    const parts = match[4].split('-');
    let flipX = false;
    let sway = false;
    while (parts[0] === 'f' || parts[0] === 'sw') {
        if (parts.shift() === 'f') flipX = true;
        else sway = true;
    }
    const name = parts.join('-');
    if (!name) throw new Error(`Missing asset name: ${key}`);
    const group = name.replace(/^coral-/, '').replace(/-\d+$/, '');
    return { rangeStart, rangeEnd, rarity: RARITY_CODES[match[3]], flipX, sway, name, group };
}

export const environmentAssets = Object.entries(files).flatMap(([path, url]) => {
    const category = path.split('/').at(-2);
    const key = path.split('/').at(-1).replace(/\.png$/i, '');
    try {
        return [{ key, category, ...parseAssetStem(key), url }];
    } catch (error) {
        console.warn(`Ignoring environment asset ${path}: ${error.message}`);
        return [];
    }
});

export function assetsForBiome(biome, category) {
    return environmentAssets.filter(asset => asset.rangeStart <= biome && biome <= asset.rangeEnd && asset.category === category);
}

export function decorativePool(category, overrides = [], biome = 1) {
    const defaults = category === 'coral' ? { minScale: 0.18, maxScale: 0.30 }
        : category === 'plants' ? { minScale: 0.22, maxScale: 0.36 }
        : { minScale: 0.28, maxScale: 0.42 };
    return assetsForBiome(biome, category).map(asset => ({
        ...defaults, ...overrides.find(type => type.key === asset.key),
        ...asset,
    }));
}
