export const DEFAULT_GAME_WIDTH = 1152;
export const DEFAULT_GAME_HEIGHT = 648;
export const MIN_GAME_WIDTH = 800;
export const MIN_GAME_HEIGHT = 600;
export const MAX_GAME_WIDTH = 1440;
export const MAX_GAME_HEIGHT = 810;
export const MIN_ASPECT_RATIO = 4 / 3;
export const MAX_ASPECT_RATIO = 16 / 9;

// Match shell.css: rails, grid gaps, chassis borders/padding, bezel, page margin.
export const CONSOLE_WIDTH_OVERHEAD = 184 + 36 + 16 + 20 + 28 + 16;
export const CONSOLE_HEIGHT_OVERHEAD = 42 + 40 + 16 + 20 + 28 + 16;

export function selectSessionSize(browserWidth, browserHeight) {
    let width = Math.max(MIN_GAME_WIDTH, Math.min(MAX_GAME_WIDTH,
        browserWidth - CONSOLE_WIDTH_OVERHEAD));
    let height = Math.max(MIN_GAME_HEIGHT, Math.min(MAX_GAME_HEIGHT,
        browserHeight - CONSOLE_HEIGHT_OVERHEAD));
    if (width / height < MIN_ASPECT_RATIO) height = width / MIN_ASPECT_RATIO;
    if (width / height > MAX_ASPECT_RATIO) width = height * MAX_ASPECT_RATIO;
    // Round inward while preserving the aspect limits at integer pixel dimensions.
    height = Math.floor(height);
    width = Math.max(Math.ceil(height * MIN_ASPECT_RATIO),
        Math.min(Math.floor(width), Math.floor(height * MAX_ASPECT_RATIO)));
    return Object.freeze({ width, height });
}
