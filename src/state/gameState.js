// Plain data only: no Phaser objects, React dependency, or per-frame updates.
// Objectives use { id, kind, objectIds }.
// completion.objectiveIds selects equally weighted objectives for progress;
// objectives omitted from that list are optional and do not affect the percentage.
// threshold is a fraction (0–1, default 1). mandatoryObjectiveIds must also be
// fully completed regardless of threshold; they do not add extra progress weight.
const progressFields = {
    cleanup: 'cleanedObjectIds',
    inspect: 'inspectedObjectIds',
    discovery: 'discoveries',
    artifact: 'artifacts',
};

function freeze(value) {
    if (value && typeof value === 'object') {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
    return value;
}

export function createGameState() {
    const listeners = new Set();
    let level = null;
    let snapshot = freeze({
        currentLevelId: null,
        objectives: [],
        cleanedObjectIds: [],
        inspectedObjectIds: [],
        discoveries: [],
        artifacts: [],
        cleanupCount: 0,
        cleanupRequired: 0,
        artifactCount: 0,
        artifactsRequired: 0,
        score: 0,
        resources: {},
        progressPercentage: 0,
        levelComplete: false,
    });

    function publish(next) {
        snapshot = freeze(next);
        for (const listener of [...listeners]) listener();
    }

    function derive(next) {
        next.cleanupCount = next.cleanedObjectIds.length;
        next.artifactCount = next.artifacts.length;
        next.objectives = level.objectives.map(objective => {
            const ids = objective.objectIds ?? [];
            const recorded = next[progressFields[objective.kind]] ?? [];
            const current = ids.filter(id => recorded.includes(id)).length;
            return {
                ...objective,
                current,
                target: ids.length,
                complete: ids.length > 0 && current === ids.length,
            };
        });
        const requiredIds = level.completion?.objectiveIds ?? [];
        const required = requiredIds.map(id => next.objectives.find(o => o.id === id));
        next.cleanupRequired = new Set(required
            .filter(objective => objective?.kind === 'cleanup')
            .flatMap(objective => objective.objectIds)).size;
        next.artifactsRequired = new Set(required
            .filter(objective => objective?.kind === 'artifact')
            .flatMap(objective => objective.objectIds)).size;
        next.progressPercentage = required.length === 0 ? 0 :
            100 * required.reduce((sum, objective) => sum +
                (objective?.target ? objective.current / objective.target : 0), 0) / required.length;
        const mandatoryIds = level.completion?.mandatoryObjectiveIds ?? [];
        const mandatoryComplete = mandatoryIds.every(id =>
            next.objectives.find(objective => objective.id === id)?.complete);
        const threshold = level.completion?.threshold ?? 1;
        next.levelComplete = required.length > 0 &&
            required.every(objective => objective?.target > 0) &&
            next.progressPercentage >= threshold * 100 && mandatoryComplete;
        return next;
    }

    function record(kind, id) {
        const field = progressFields[kind];
        const object = level?.objects.find(object => object.id === id);
        const allowed = kind === 'inspect' ? object?.inspectable : object?.kind === kind;
        if (!allowed || snapshot[field].includes(id)) return;
        publish(derive({ ...snapshot, [field]: [...snapshot[field], id] }));
    }

    return {
        // Same snapshot reference until an actual change; suitable for a future UI subscription.
        getSnapshot: () => snapshot,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        startLevel(config) {
            level = structuredClone(config);
            publish(derive({
                currentLevelId: level.id,
                objectives: [],
                cleanedObjectIds: [],
                inspectedObjectIds: [],
                discoveries: [],
                artifacts: [],
                cleanupCount: 0,
                score: 0,
                resources: {},
                progressPercentage: 0,
                levelComplete: false,
            }));
        },
        recordCleanup: id => record('cleanup', id),
        recordInspection: id => record('inspect', id),
        recordDiscovery: id => record('discovery', id),
        recordArtifact: id => record('artifact', id),
    };
}
