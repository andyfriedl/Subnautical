import level01 from './level-01.js';
import level02 from './level-02.js';

export const defaultLevelId = 'level-01';
const levels = { [level01.id]: level01, [level02.id]: level02 };
const levelOrder = [level01.id, level02.id];

export function getLevel(id = defaultLevelId) {
    if (!Object.hasOwn(levels, id)) {
        throw new Error(`Unknown level: ${id}`);
    }
    return levels[id];
}

export function getNextLevelId(currentId) {
    const index = levelOrder.indexOf(currentId);
    return index < 0 ? null : levelOrder[index + 1] ?? null;
}
