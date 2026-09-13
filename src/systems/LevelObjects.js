import Phaser from 'phaser';

// Capsule from the resting claw point forward, in world pixels.
const GRAB_REACH = 30;
const GRAB_RADIUS = 27;

// Target glow: scale is relative to the item's largest visible dimension.
const TARGET_GLOW_SCALE = 2.4;
const TARGET_GLOW_MIN_ALPHA = 0.55;
const TARGET_GLOW_MAX_ALPHA = 1;
const TARGET_GLOW_PULSE_MS = 300; // Half-cycle; size pulses from 80% to 100%.
const TARGET_TINT = 0xffd05a;
const TARGET_GLOW_COLOR = 0xffb632;

const SUCCESS_FLASH_DURATION_MS = 100;
const SUCCESS_CLOUD_START_RADIUS = 8;
const SUCCESS_CLOUD_END_RADIUS = 38;
const SUCCESS_CLOUD_DURATION_MS = 250; // Expansion, then a separate fade.
const SUCCESS_CLOUD_FADE_MS = 220;
const SUCCESS_RING_END_RADIUS = 48;
const SUCCESS_RING_DURATION_MS = 350;
const SUCCESS_PARTICLE_COUNT = 13;
const SUCCESS_PARTICLE_SPEED = 75; // Pixels/second; extra upward drift below.
const SUCCESS_PARTICLE_DURATION_MS = 500;
const SUCCESS_FLASH_COLOR = 0xfff1bb;
const SUCCESS_CLOUD_COLOR = 0xc5efff;
const SUCCESS_RING_COLOR = 0xd9f8ff;

// Owns rendered objects and translates pickup input into progress-store updates.
export default class LevelObjects {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.objects = new Map();
        this.target = null;
        this.targetTween = null;
        this.effectTweens = new Set();
        this.bursts = new Set();
        this.scene.events.once('shutdown', this.destroy, this);
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
    }

    update(submarine) {
        // Consume every E press; the controller rejects repeats during a grab.
        if (Phaser.Input.Keyboard.JustDown(this.pickupKey)) {
            submarine.startGrab(() => this.collectReachedCleanup(submarine));
        }
        this.setTarget(submarine.grabReachPending ? this.findCleanupTarget(submarine) : null);
    }

    findCleanupTarget(submarine) {
        // Sample at the animation's hit frame, not when E was pressed.
        const start = submarine.getGrabPoint();
        const forward = submarine.getFacingVector();
        const cleanedIds = this.gameState.getSnapshot().cleanedObjectIds;
        let target = null;
        let nearestDistance = Infinity;

        for (const object of this.objects.values()) {
            const { definition, image } = object;
            if (definition.kind !== 'cleanup' || cleanedIds.includes(definition.id)) continue;

            const dx = image.x - start.x;
            const dy = image.y - start.y;
            const along = Phaser.Math.Clamp(dx * forward.x + dy * forward.y, 0, GRAB_REACH);
            const distance = Math.hypot(dx - forward.x * along, dy - forward.y * along);
            if (distance <= GRAB_RADIUS && distance < nearestDistance) {
                target = object;
                nearestDistance = distance;
            }
        }

        return target;
    }

    collectReachedCleanup(submarine) {
        const target = this.findCleanupTarget(submarine);
        this.setTarget(null);
        if (target) {
            this.gameState.recordCleanup(target.definition.id);
            if (this.gameState.getSnapshot().cleanedObjectIds.includes(target.definition.id)) {
                this.showSuccess(target.image);
            }
        }
    }

    // Layer translucent disks to give generated graphics a soft, feathered edge.
    softDisk(graphics, x, y, radius, color) {
        for (let i = 16; i > 0; i--) {
            graphics.fillStyle(color, 0.07);
            graphics.fillCircle(x, y, radius * i / 16);
        }
    }

    setTarget(target) {
        if (this.target === target) return;
        this.targetTween?.remove();
        this.targetTween = null;
        this.targetGlow?.destroy();
        this.targetGlow = null;
        if (this.target?.image.scene) {
            this.target.image.clearTint().setScale(this.target.definition.scale);
        }
        this.target = target;
        if (target) {
            const image = target.image;
            image.setTint(TARGET_TINT);
            const glow = this.scene.add.graphics();
            glow.setPosition(image.x, image.y - image.displayHeight / 2);
            glow.setDepth(image.depth - 0.1).setBlendMode(Phaser.BlendModes.ADD);
            const radius = Math.max(image.displayWidth, image.displayHeight) * TARGET_GLOW_SCALE / 2;
            this.softDisk(glow, 0, 0, radius, TARGET_GLOW_COLOR);
            glow.setAlpha(TARGET_GLOW_MIN_ALPHA).setScale(0.8);
            this.targetGlow = glow;
            this.targetTween = this.scene.tweens.add({
                targets: glow,
                alpha: TARGET_GLOW_MAX_ALPHA,
                scaleX: 1,
                scaleY: 1,
                duration: TARGET_GLOW_PULSE_MS,
                ease: 'Sine.InOut',
                yoyo: true,
                repeat: -1,
            });
        }
    }

    effectGraphic(x, y) {
        const graphic = this.scene.add.graphics().setPosition(x, y).setDepth(1200);
        this.bursts.add(graphic);
        return graphic;
    }

    effectTween(config, onComplete) {
        const tween = this.scene.tweens.add({
            ...config,
            onComplete: () => {
                this.effectTweens.delete(tween);
                onComplete();
            },
        });
        this.effectTweens.add(tween);
    }

    removeEffect(graphic) {
        this.bursts.delete(graphic);
        graphic.destroy();
    }

    showSuccess(image) {
        // State still records at the hit frame; the item vanishes at cloud peak.
        const x = image.x;
        const y = image.y - image.displayHeight / 2;
        const scale = image.scaleX;
        image.setTintFill(SUCCESS_FLASH_COLOR);
        this.effectTween({
            targets: image,
            alpha: 0,
            scaleX: scale * 0.15,
            scaleY: scale * 0.15,
            delay: SUCCESS_FLASH_DURATION_MS,
            duration: SUCCESS_CLOUD_DURATION_MS - SUCCESS_FLASH_DURATION_MS,
        }, () => image.setVisible(false).clearTint().setAlpha(1).setScale(scale));

        const cloud = this.effectGraphic(x, y);
        this.softDisk(cloud, 0, 0, SUCCESS_CLOUD_END_RADIUS * 0.8, SUCCESS_CLOUD_COLOR);
        for (let i = 0; i < 5; i++) {
            const angle = i * Math.PI * 2 / 5;
            this.softDisk(cloud,
                Math.cos(angle) * SUCCESS_CLOUD_END_RADIUS * 0.4,
                Math.sin(angle) * SUCCESS_CLOUD_END_RADIUS * 0.3,
                SUCCESS_CLOUD_END_RADIUS * 0.6, SUCCESS_CLOUD_COLOR);
        }
        cloud.setScale(SUCCESS_CLOUD_START_RADIUS / SUCCESS_CLOUD_END_RADIUS);
        this.effectTween({
            targets: cloud, scaleX: 1, scaleY: 1,
            duration: SUCCESS_CLOUD_DURATION_MS, ease: 'Cubic.Out',
        }, () => this.effectTween({
            targets: cloud, alpha: 0, scaleX: 1.15, scaleY: 1.15,
            duration: SUCCESS_CLOUD_FADE_MS,
        }, () => this.removeEffect(cloud)));

        const ring = this.effectGraphic(x, y);
        ring.lineStyle(1.5, SUCCESS_RING_COLOR, 0.45);
        ring.strokeCircle(0, 0, SUCCESS_RING_END_RADIUS);
        ring.setScale(0.15);
        this.effectTween({
            targets: ring, scaleX: 1, scaleY: 1, alpha: 0,
            duration: SUCCESS_RING_DURATION_MS, ease: 'Sine.Out',
        }, () => this.removeEffect(ring));

        // Deterministic spread avoids consuming randomness used by gameplay systems.
        for (let i = 0; i < SUCCESS_PARTICLE_COUNT; i++) {
            const angle = i * Math.PI * 2 / SUCCESS_PARTICLE_COUNT;
            const bubble = this.effectGraphic(x, y);
            const radius = 2 + i % 3;
            bubble.fillStyle(SUCCESS_CLOUD_COLOR, 0.45);
            bubble.fillCircle(0, 0, radius);
            bubble.lineStyle(1, SUCCESS_RING_COLOR, 0.8);
            bubble.strokeCircle(0, 0, radius);
            bubble.fillStyle(0xfffbea, 0.9);
            bubble.fillCircle(-radius * 0.3, -radius * 0.3, 0.8);
            const distance = SUCCESS_PARTICLE_SPEED * SUCCESS_PARTICLE_DURATION_MS / 1000 * (0.7 + (i % 4) * 0.1);
            this.effectTween({
                targets: bubble,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 12,
                alpha: 0,
                duration: SUCCESS_PARTICLE_DURATION_MS,
                ease: 'Sine.Out',
            }, () => this.removeEffect(bubble));
        }
    }

    destroy() {
        this.setTarget(null);
        for (const tween of this.effectTweens) tween.remove();
        this.effectTweens.clear();
        for (const burst of this.bursts) burst.destroy();
        this.bursts.clear();
    }
}
