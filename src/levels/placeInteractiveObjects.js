// Boot/level-load placement only. Dimensions are rendered sprite sizes, not hitbox limits.
export const INTERACTIVE_EDGE_PADDING = 80;
export const INTERACTIVE_MIN_SPACING = 32;
export const PLAYER_SPAWN_CLEARANCE = 70;

export function placeInteractiveObjects(definitions, size, player, dimensions, random = Math.random, reservedFootprints = null) {
    const shuffle = values => {
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]];
        }
        return values;
    };
    const bounds = (object, x, y) => {
        const { width, height } = dimensions(object);
        const [ox, oy] = object.origin;
        return { left: x - width * ox, right: x + width * (1 - ox),
            top: y - height * oy, bottom: y + height * (1 - oy) };
    };
    const separated = (a, b, gap) => Math.hypot(
        Math.max(0, a.left - b.right, b.left - a.right),
        Math.max(0, a.top - b.bottom, b.top - a.bottom)
    ) >= gap;
    const playerBounds = bounds(player, player.x, player.y);
    const columns = Math.ceil(Math.sqrt(definitions.length * size.width / size.height));
    const rows = Math.ceil(definitions.length / columns);
    const cellWidth = (size.width - 2 * INTERACTIVE_EDGE_PADDING) / columns;
    const cellHeight = (size.height - 2 * INTERACTIVE_EDGE_PADDING) / rows;
    for (let layout = 0; layout < 100; layout++) {
        const cells = shuffle(Array.from({ length: columns * rows }, (_, i) => i));
        const placed = [];
        for (const object of shuffle([...definitions])) {
            let candidate = null;
            for (const cell of cells) {
                for (let attempt = 0; attempt < 40; attempt++) {
                    const x = INTERACTIVE_EDGE_PADDING + (cell % columns + random()) * cellWidth;
                    const y = INTERACTIVE_EDGE_PADDING + (Math.floor(cell / columns) + random()) * cellHeight;
                    const box = bounds(object, x, y);
                    if (box.left < INTERACTIVE_EDGE_PADDING || box.right > size.width - INTERACTIVE_EDGE_PADDING ||
                        box.top < INTERACTIVE_EDGE_PADDING || box.bottom > size.height - INTERACTIVE_EDGE_PADDING) continue;
                    if (reservedFootprints?.isPlacementBlocked(box)) continue;
                    if (!separated(box, playerBounds, PLAYER_SPAWN_CLEARANCE) ||
                        placed.some(p => !separated(box, p.box, INTERACTIVE_MIN_SPACING))) continue;
                    candidate = { object: { ...object, x, y, depth: y }, box };
                    cells.splice(cells.indexOf(cell), 1);
                    break;
                }
                if (candidate) break;
            }
            if (!candidate) break;
            placed.push(candidate);
        }
        if (placed.length === definitions.length) {
            return definitions.map(object => placed.find(p => p.object.id === object.id).object);
        }
    }
    throw new Error('Cannot safely place interactive objects within this level. Check asset scales and placement margins.');
}
