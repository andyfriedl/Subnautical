// Owns rendered objects by ID. Interaction rules can be added here later.
// Merely spawning a cleanup object does not record progress or enable input.
export default class LevelObjects {
    constructor(scene) {
        this.scene = scene;
        this.objects = new Map();
    }

    create(definitions) {
        for (const definition of definitions) {
            const { id, texture, x, y, origin, scale, depth } = definition;
            const image = this.scene.add.image(x, y, texture);
            image.setOrigin(...origin);
            image.setScale(scale);
            image.setDepth(depth ?? y);
            image.name = id;
            this.objects.set(id, { definition, image });
        }
    }
}
