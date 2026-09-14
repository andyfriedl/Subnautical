// Adapt authored positions and decorative quantities once, before scene creation.
const SAFE_OBJECT_MARGIN = 120;

export function fitLevel(level, size) {
    const fitted = structuredClone(level);
    const reference = level.referenceSize;
    const position = ({ x, y }) => ({
        x: Math.max(SAFE_OBJECT_MARGIN, Math.min(size.width - SAFE_OBJECT_MARGIN, x / reference.width * size.width)),
        y: Math.max(SAFE_OBJECT_MARGIN, Math.min(size.height - SAFE_OBJECT_MARGIN, y / reference.height * size.height)),
    });
    fitted.player = { ...fitted.player, ...position(level.player) };
    // Interactive positions are randomized after textures load, using real sprite bounds.
    const areaRatio = size.width * size.height / (reference.width * reference.height);
    const count = value => Math.max(value > 0 ? 1 : 0, Math.round(value * areaRatio));
    for (const key of ['coralClusterCount', 'loneCoralCount', 'lonePlantCount']) {
        fitted.environment[key] = count(level.environment[key]);
    }
    for (const key of ['grassClusterCount', 'rockCount']) {
        fitted.environment[key] = {
            min: count(level.environment[key].min),
            max: count(level.environment[key].max),
        };
    }
    return fitted;
}
