// Shared by the existing water overlay and bubbles rendered above it.
export const WATER_TOP_RGB = '6, 38, 78';
export const WATER_BOTTOM_RGB = '40, 140, 190';
export const WATER_TOP_OPACITY = 0.60;
export const WATER_BOTTOM_OPACITY = 0.05;
export const WATER_OVERLAY_DEPTH = 10000;
export const BUBBLE_DEPTH = WATER_OVERLAY_DEPTH + 100;

export function mixColor(from, to, amount) {
    const channel = shift => Math.round(((from >> shift) & 255) * (1 - amount) + ((to >> shift) & 255) * amount);
    return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

export function waterTint(color, y, height) {
    const t = Math.max(0, Math.min(1, y / height));
    const top = WATER_TOP_RGB.split(',').map(Number);
    const bottom = WATER_BOTTOM_RGB.split(',').map(Number);
    const alpha = WATER_TOP_OPACITY * (1 - t) + WATER_BOTTOM_OPACITY * t;
    // Canvas gradients interpolate premultiplied color/alpha.
    const rgb = top.map((v, i) => Math.round((v * WATER_TOP_OPACITY * (1 - t) + bottom[i] * WATER_BOTTOM_OPACITY * t) / alpha));
    return mixColor(color, (rgb[0] << 16) | (rgb[1] << 8) | rgb[2], alpha);
}
