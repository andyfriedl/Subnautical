import Phaser from 'phaser';

// Distance in world pixels from the submarine to the object's placement point.
const CLEANUP_INTERACTION_DISTANCE = 70;

// Owns rendered objects and translates pickup input into progress-store updates.
export default class LevelObjects {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
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

        this.pickupKey = this.scene.input.keyboard.addKey('E');
        this.prompt = this.scene.add.text(0, 0, 'E  Pick Up', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#e5f4f7',
            backgroundColor: '#06263f',
            padding: { x: 5, y: 3 },
        }).setOrigin(0.5, 1).setDepth(1200).setVisible(false);
    }

    update(player) {
        // Consume the press even out of range: holding E while approaching
        // must not turn an earlier press into a pickup.
        const pressed = Phaser.Input.Keyboard.JustDown(this.pickupKey);
        const cleanedIds = this.gameState.getSnapshot().cleanedObjectIds;
        let target = null;
        let nearestDistance = CLEANUP_INTERACTION_DISTANCE;

        for (const object of this.objects.values()) {
            const { definition, image } = object;
            if (definition.kind !== 'cleanup') continue;
            if (cleanedIds.includes(definition.id)) {
                image.setVisible(false);
                continue;
            }

            const distance = Phaser.Math.Distance.Between(player.x, player.y, image.x, image.y);
            if (distance <= nearestDistance) {
                target = object;
                nearestDistance = distance;
            }
        }

        this.prompt.setVisible(Boolean(target));
        if (!target) return;

        const { definition, image } = target;
        this.prompt.setPosition(image.x, image.y - image.displayHeight - 8);

        if (pressed) {
            this.gameState.recordCleanup(definition.id);
            if (this.gameState.getSnapshot().cleanedObjectIds.includes(definition.id)) {
                image.setVisible(false);
                this.prompt.setVisible(false);
            }
        }
    }
}
