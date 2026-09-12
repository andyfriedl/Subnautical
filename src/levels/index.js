import level01 from './level-01.js';

export const defaultLevelId = 'level-01';
const levels = { [level01.id]: level01 };

export function getLevel(id = defaultLevelId) {
    if (!Object.hasOwn(levels, id)) {
        throw new Error(`Unknown level: ${id}`);
    }
    return levels[id];
}
