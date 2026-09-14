// Discover available textures, never objectives. Debris is intentionally excluded.
const files = import.meta.glob('./environment/{coral,plants,rocks,cleanup,artifacts}/*.png', {
    eager: true, query: '?url', import: 'default',
});
export const environmentAssets = Object.entries(files).map(([path, url]) => {
    const category = path.split('/').at(-2);
    const stem = path.split('/').at(-1).replace(/\.png$/i, '');
    // Preserve the existing public key for this unusually named source file.
    const key = stem === 'blue-shoe-1png' ? 'blue-shoe-1' : stem;
    return { key, category, url };
});

export function decorativePool(category, overrides = []) {
    const defaults = category === 'coral' ? { minScale: 0.18, maxScale: 0.30 }
        : category === 'plants' ? { minScale: 0.22, maxScale: 0.36 }
        : { minScale: 0.28, maxScale: 0.42 };
    return environmentAssets.filter(asset => asset.category === category).map(({ key }) => ({
        key, ...defaults, ...overrides.find(type => type.key === key),
        // Strip the category prefix and numeric variant suffix, without a fixed color list.
        group: key.replace(/^coral-/, '').replace(/-\d+$/, ''),
    }));
}
