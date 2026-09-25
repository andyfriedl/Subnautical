import { resolveEnvironment } from '../biomes/environmentDefaults.js';
import { getBiome } from '../biomes/index.js';
import { assetsForBiome } from '../assets/environmentAssets.js';
import { plantProgression } from '../biomes/plantProgression.js';

const INTERACTIVE_SCALE = 0.35;

// Choose what exists once per dive. placeInteractiveObjects owns all placement.
export function generateDive({ biome, diveNumber }, random = Math.random) {
    const config = getBiome(biome);
    if (!Number.isInteger(diveNumber) || diveNumber < 1 || diveNumber > config.diveCount) {
        throw new Error(`Invalid dive number: ${diveNumber}`);
    }
    const id = `${biome}-${String(diveNumber).padStart(2, '0')}`;
    const progress = (diveNumber - 1) / Math.max(1, config.diveCount - 1);
    const interpolate = ({ start, end }, t = progress) => start + (end - start) * t;
    const density = interpolate(config.density, progress ** config.density.exponent);
    const environment = resolveEnvironment(config.environment);
    environment.coralClusterCount = Math.max(0, Math.round(environment.coralClusterCount * density));
    const plantCurve = config.plantDensity ?? plantProgression[biome];
    const plantDensity = plantCurve
        ? interpolate(plantCurve, progress ** plantCurve.exponent) : density;
    environment.grassBedDensity = plantDensity;
    if (plantCurve) {
        // Reefs already scale with density. Adjust their plant population only,
        // so the independent plant curve doesn't also change coral counts.
        const plantRatio = density > 0 ? plantDensity / density : 0;
        for (const key of ['count', 'largeCount']) {
            const range = environment.coral.plants[key];
            environment.coral.plants[key] = {
                min: Math.round(range.min * plantRatio),
                max: Math.round(range.max * plantRatio),
            };
        }
        environment.lonePlantCount = Math.round(environment.lonePlantCount * plantDensity);
    }
    environment.referenceArea = config.referenceSize.width * config.referenceSize.height;
    const rarityWeights = Object.fromEntries(Object.entries(config.interactiveRarity)
        .map(([rarity, curve]) => [rarity, interpolate(curve)]));
    const objects = [];
    const objectives = [];
    for (const [kind, category, count] of [
        ['cleanup', 'cleanup', Math.round(interpolate(config.pickups.cleanup))],
        ['artifact', 'artifacts', Math.round(interpolate(config.pickups.artifact))],
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
            objects.push({ id: objectId, kind, texture: selected.key, flipX: selected.flipX ? random() < 0.5 : false, origin: [0.5, 1], scale: INTERACTIVE_SCALE });
            objectIds.push(objectId);
        }
        objectives.push({ id: `${id}-${kind}`, kind, objectIds });
    }
    return {
        id,
        diveNumber,
        biome: biome,
        referenceSize: structuredClone(config.referenceSize),
        background: structuredClone(config.background),
        lighting: config.lighting ? structuredClone(config.lighting) : undefined,
        fish: config.fish ? structuredClone(config.fish) : undefined,
        player: structuredClone(config.player),
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
