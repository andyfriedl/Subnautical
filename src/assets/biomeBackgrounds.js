const files = import.meta.glob('./backgrounds/*.png', { eager: true, query: '?url', import: 'default' });

// The filename number is the biome ID. Only backgrounds enable biomes.
export const biomeBackgrounds = Object.entries(files).flatMap(([path, url]) => {
    const filename = path.split('/').at(-1);
    const match = /^seabed-([1-9]\d*)\.png$/.exec(filename);
    const biome = match ? Number(match[1]) : NaN;
    if (!Number.isSafeInteger(biome) || biome < 1) {
        console.warn(`Ignoring invalid biome background: ${filename}`);
        return [];
    }
    return [{ biome, key: filename.slice(0, -4), url }];
}).sort((a, b) => a.biome - b.biome);
