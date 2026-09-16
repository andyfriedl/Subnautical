import shallow from '../biomes/shallow.js';
import { assetsForBiome } from '../assets/environmentAssets.js';

const INTERACTIVE_SCALE = 0.35;

// Choose what exists once per dive. placeInteractiveObjects owns all placement.
export function generateDive({ biome, diveNumber }, random = Math.random) {
    if (biome !== shallow.biome) {
        throw new Error(`Unsupported dive biome: ${biome}`);
    }
    if (!Number.isInteger(diveNumber) || diveNumber < 1 || diveNumber > shallow.diveCount) {
        throw new Error(`Invalid shallow dive number: ${diveNumber}`);
    }
    const id = `${biome}-${String(diveNumber).padStart(2, '0')}`;
    const progress = (diveNumber - 1) / (shallow.diveCount - 1);
    const interpolate = ({ start, end }, t = progress) => start + (end - start) * t;
    const density = interpolate(shallow.density, progress ** shallow.density.exponent);
    const environment = structuredClone(shallow.environment);
    environment.coralClusterCount = Math.max(1, Math.round(environment.coralClusterCount * density));
    environment.grassBedDensity = density;
    const rarityWeights = Object.fromEntries(Object.entries(shallow.interactiveRarity)
        .map(([rarity, curve]) => [rarity, interpolate(curve)]));
    const objects = [];
    const objectives = [];
    for (const [kind, category, count] of [
        ['cleanup', 'cleanup', Math.round(interpolate(shallow.pickups.cleanup))],
        ['artifact', 'artifacts', Math.round(interpolate(shallow.pickups.artifact))],
    ]) {
        if (!Number.isInteger(count) || count < 0) throw new Error(`Invalid ${kind} requirement: ${count}`);
        if (!count) continue;
        const pool = assetsForBiome(biome, category);
        if (!pool.length) throw new Error(`No ${category} assets for biome ${biome}`);
        let previousKey;
        const objectIds = [];
        for (let i = 0; i < count; i++) {
            // Avoid adjacent repeats when another eligible texture exists.
            const alternatives = pool.filter(asset => asset.key !== previousKey);
            const candidates = alternatives.length ? alternatives : pool;
            const totalWeight = candidates.reduce((sum, asset) => sum + rarityWeights[asset.rarity], 0);
            let roll = random() * totalWeight;
            const selected = candidates.find(asset => {
                roll -= rarityWeights[asset.rarity];
                return roll < 0;
            }) ?? candidates[candidates.length - 1];
            previousKey = selected.key;
            const objectId = `${id}-${kind}-${i + 1}`;
            objects.push({ id: objectId, kind, texture: selected.key, origin: [0.5, 1], scale: INTERACTIVE_SCALE });
            objectIds.push(objectId);
        }
        objectives.push({ id: `${id}-${kind}`, kind, objectIds });
    }
    return {
        id,
        diveNumber,
        biome: biome,
        referenceSize: structuredClone(shallow.referenceSize),
        background: structuredClone(shallow.background),
        player: structuredClone(shallow.player),
        environment,
        objects,
        objectives,
        completion: {
            threshold: 1,
            objectiveIds: objectives.map(objective => objective.id),
            mandatoryObjectiveIds: [],
        },
    };
}
