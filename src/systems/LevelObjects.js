import { BUBBLE_DEPTH, waterTint } from './waterTint.js';
import Phaser from 'phaser';

// Shared real/debug polygon dimensions, measured from the resting grab point.
const GRAB_FRONT_OFFSET = 48; // Forward distance from the resting grab point.
const GRAB_REAR_OFFSET = 0;
const GRAB_WIDTH = 92;
const DEBUG_GRAB_AREA = false;

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
const SUCCESS_FLASH_COLOR = 0xfff1bb;
const SUCCESS_CLOUD_COLOR = 0xc5efff;
const SUCCESS_RING_COLOR = 0xd9f8ff;

const LAST_ITEM_HINT_STAGES_MS = [9000, 18000, 27000, 36000]; // 1–4 bubbles
// Reuse the established 9/18/27-second search windows; no rapid multi-target hints.
const HINT_DELAY_MS = { one: 9000, few: 18000, many: 27000 };
const HINT_DELAY_JITTER_MS = 500;
const HINT_BUBBLES_BEFORE_GLOW = 3;
const HINT_GLOW_PADDING = 3;
const HINT_GLOW_ALPHA = 0.35;
const HINT_GLOW_HALF_CYCLE_MS = 450;
const LAST_ITEM_HINT_LIFETIME_MS = 4000;
const LAST_ITEM_HINT_RISE_SPEED = { min: -48, max: -30 };
const LAST_ITEM_HINT_SCALE = { start: 0.3, end: 0.5 };
const LAST_ITEM_HINT_SPREAD_X = 8;
const LAST_ITEM_HINT_SPREAD_Y = 5;

// Owns rendered objects and translates pickup input into progress-store updates.
export default class LevelObjects {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.objects = new Map();
        this.hintEmitter = null;
        this.lastPickupAt = scene.time.now;
        this.hintGlow = null;
        this.hintGlowTween = null;
        this.hintsSincePickup = 0;
        this.hintPausedAt = null;
        this.nextHintAt = scene.time.now + this.hintDelay(this.remainingRequiredIds().length);
        let remaining = new Set(this.remainingRequiredIds());
        this.unsubscribeHint = gameState.subscribe(() => {
            const next = new Set(this.remainingRequiredIds());
            if ([...remaining].some(id => !next.has(id))) this.resetHints(next.size);
            remaining = next;
            if (gameState.getSnapshot().levelComplete) this.clearHintEffects();
        });
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
            image.setFlipX(definition.flipX ?? false);
            image.setDepth(depth ?? y);
            image.name = id;
            this.objects.set(id, { definition, image });
        }

        this.pickupKey = this.scene.input?.keyboard?.addKey('SPACE');
        if (DEBUG_GRAB_AREA) {
            this.grabDebug = this.scene.add.graphics().setDepth(1201);
        }
    }

    update(submarine) {
        this.updatePickupHint();
        if (this.grabDebug) {
            this.grabDebug.clear().lineStyle(1, 0xffffff, 0.8);
            this.grabDebug.strokePoints(this.getGrabPolygon(submarine), true);
        }
        // Consume every Space press; the controller rejects repeats during a grab.
        if (this.pickupKey && Phaser.Input.Keyboard.JustDown(this.pickupKey)) {
            submarine.startGrab(() => this.collectReachedObject(submarine));
        }
        this.setTarget(submarine.grabReachPending ? this.findCollectibleTarget(submarine) : null);
    }

    remainingRequiredIds() {
        const snapshot = this.gameState.getSnapshot();
        const requiredObjectives = new Set([
            ...(this.scene.level.completion.objectiveIds ?? []),
            ...(this.scene.level.completion.mandatoryObjectiveIds ?? []),
        ]);
        const requiredIds = new Set(snapshot.objectives
            .filter(objective => requiredObjectives.has(objective.id) &&
                (objective.kind === 'cleanup' || objective.kind === 'artifact'))
            .flatMap(objective => objective.objectIds));
        const collected = new Set([...snapshot.cleanedObjectIds, ...snapshot.artifacts]);
        return [...requiredIds].filter(id => !collected.has(id));
    }

    hintDelay(count) {
        return count <= 1 ? HINT_DELAY_MS.one : count <= 3 ? HINT_DELAY_MS.few : HINT_DELAY_MS.many;
    }

    clearHintGlow() {
        this.hintGlowTween?.remove();
        this.hintGlowTween = null;
        this.hintGlow?.destroy();
        this.hintGlow = null;
    }

    clearHintEffects() {
        this.hintEmitter?.killAll();
        this.clearHintGlow();
    }

    resetHints(remainingCount) {
        this.lastPickupAt = this.scene.time.now;
        this.nextHintAt = this.lastPickupAt + this.hintDelay(remainingCount);
        this.hintsSincePickup = 0;
        this.hintPausedAt = null;
        this.clearHintEffects();
    }

    showHintGlow(image) {
        this.clearHintGlow();
        const bounds = image.getBounds();
        const glow = this.scene.add.graphics().setPosition(bounds.centerX, bounds.centerY)
            .setDepth(BUBBLE_DEPTH).setAlpha(0);
        this.softDisk(glow, 0, 0, 1, 0xc5efff);
        glow.setScale(bounds.width / 2 + HINT_GLOW_PADDING, bounds.height / 2 + HINT_GLOW_PADDING);
        this.hintGlow = glow;
        this.hintGlowTween = this.scene.tweens.add({
            targets: glow, alpha: HINT_GLOW_ALPHA, duration: HINT_GLOW_HALF_CYCLE_MS,
            ease: 'Sine.InOut', yoyo: true, onComplete: () => this.clearHintGlow(),
        });
    }

    updatePickupHint() {
        const remaining = this.remainingRequiredIds();
        if (this.gameState.getSnapshot().levelComplete || !remaining.length) {
            this.clearHintEffects();
            return;
        }
        const now = this.scene.time.now;
        // Briefing/Help time does not consume the player's fresh search period.
        if (!this.scene.input?.keyboard?.enabled) {
            this.hintPausedAt ??= now;
            return;
        }
        if (this.hintPausedAt !== null) {
            const paused = now - this.hintPausedAt;
            this.nextHintAt += paused;
            this.lastPickupAt += paused;
            this.hintPausedAt = null;
        }
        if (now < this.nextHintAt) return;
        const cameraView = this.scene.cameras.main.worldView;

        const candidates = remaining
            .map(id => this.objects.get(id))
            .filter(target =>
                target?.image.active &&
                Phaser.Geom.Intersects.RectangleToRectangle(
                    cameraView,
                    target.image.getBounds()
                )
            );

        if (!candidates.length || !this.scene.textures.exists('bubble-particle')) return;
        const target = Phaser.Utils.Array.GetRandom(candidates);
        if (!this.hintEmitter) {
            this.hintEmitter = this.scene.add.particles(0, 0, 'bubble-particle', {
                tint: {
                    onEmit: particle => {
                        // Hints must stay readable away from the submarine's beam.
                        particle.waterColor = waterTint(0xffffff, particle.y, this.scene.scale.height);
                        return particle.waterColor;
                    },
                    onUpdate: particle => particle.waterColor,
                },
                emitting: false,
                lifespan: LAST_ITEM_HINT_LIFETIME_MS,
                speedX: { min: -5, max: 5 },
                speedY: LAST_ITEM_HINT_RISE_SPEED,
                scale: LAST_ITEM_HINT_SCALE,
                alpha: { start: 0.5, end: 0 },
            }).setDepth(BUBBLE_DEPTH);
        }
        // killAll() pools particles without resetting their old coordinates.
        // Reused particles must start at this event's selected object.
        for (const particle of this.hintEmitter.dead) particle.setPosition();
        const bounds = target.image.getBounds();
        const stuckFor = this.scene.time.now - this.lastPickupAt;
        const bubbleCount = Math.min(4, LAST_ITEM_HINT_STAGES_MS.filter(time => stuckFor >= time).length);
        for (let i = 0; i < bubbleCount; i++) {
            this.hintEmitter.explode(1,
                bounds.centerX + Phaser.Math.FloatBetween(-LAST_ITEM_HINT_SPREAD_X, LAST_ITEM_HINT_SPREAD_X),
                bounds.centerY + Phaser.Math.FloatBetween(-LAST_ITEM_HINT_SPREAD_Y, LAST_ITEM_HINT_SPREAD_Y));
        }
        if (this.hintsSincePickup >= HINT_BUBBLES_BEFORE_GLOW) this.showHintGlow(target.image);
        this.hintsSincePickup++;
        this.nextHintAt = now + this.hintDelay(remaining.length) + Phaser.Math.FloatBetween(
            -HINT_DELAY_JITTER_MS, HINT_DELAY_JITTER_MS);

    }

    getGrabPolygon(submarine) {
        const point = submarine.getGrabPoint();
        const forward = submarine.getFacingVector();
        const diagonal = forward.x !== 0 && forward.y !== 0;
        // Two projected isometric axes for diagonals, orthogonal axes for cardinals.
        const side = diagonal
            ? { x: -forward.x, y: forward.y }
            : { x: -forward.y, y: forward.x };
        const corner = (distance, width) => ({
            x: point.x + forward.x * distance + side.x * width,
            y: point.y + forward.y * distance + side.y * width,
        });
        return [
            corner(GRAB_REAR_OFFSET, -GRAB_WIDTH / 2),
            corner(GRAB_FRONT_OFFSET, -GRAB_WIDTH / 2),
            corner(GRAB_FRONT_OFFSET, GRAB_WIDTH / 2),
            corner(GRAB_REAR_OFFSET, GRAB_WIDTH / 2),
        ];
    }

    overlapsGrabPolygon(polygon, bounds) {
        // Separating-axis test handles edge overlap, crossing and full containment.
        // Require positive overlap: merely touching a boundary is not a hit.
        const rectangle = [
            { x: bounds.left, y: bounds.top },
            { x: bounds.right, y: bounds.top },
            { x: bounds.right, y: bounds.bottom },
            { x: bounds.left, y: bounds.bottom },
        ];
        const axes = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
        for (let i = 0; i < polygon.length; i++) {
            const a = polygon[i];
            const b = polygon[(i + 1) % polygon.length];
            axes.push({ x: -(b.y - a.y), y: b.x - a.x });
        }
        return axes.every(axis => {
            const projected = polygon.map(p => p.x * axis.x + p.y * axis.y);
            const item = rectangle.map(p => p.x * axis.x + p.y * axis.y);
            return Math.max(...projected) > Math.min(...item) &&
                Math.max(...item) > Math.min(...projected);
        });
    }

    findCollectibleTarget(submarine) {
        // Re-evaluate the current world-space polygon for feedback and at the hit frame.
        const start = submarine.getGrabPoint();
        const polygon = this.getGrabPolygon(submarine);
        const snapshot = this.gameState.getSnapshot();
        let target = null;
        let nearestDistance = Infinity;

        for (const object of this.objects.values()) {
            const { definition, image } = object;
            const collected = definition.kind === 'cleanup' ? snapshot.cleanedObjectIds
                : definition.kind === 'artifact' ? snapshot.artifacts : null;
            if (!collected || collected.includes(definition.id)) continue;

            const bounds = image.getBounds();
            if (!this.overlapsGrabPolygon(polygon, bounds)) continue;
            // Preserve single-target selection; choose the overlapping item nearest the claws.
            const distance = Math.hypot(image.x - start.x, image.y - start.y);
            if (distance < nearestDistance) {
                target = object;
                nearestDistance = distance;
            }
        }

        return target;
    }

    collectReachedObject(submarine) {
        const target = this.findCollectibleTarget(submarine);
        this.setTarget(null);
        if (target) {
            const isArtifact = target.definition.kind === 'artifact';
            if (isArtifact) this.gameState.recordArtifact(target.definition.id);
            else this.gameState.recordCleanup(target.definition.id);
            const snapshot = this.gameState.getSnapshot();
            const collected = isArtifact ? snapshot.artifacts : snapshot.cleanedObjectIds;
            if (collected.includes(target.definition.id)) {
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

        this.scene.bubbleSystem.emitPickupBurst(x, y);

    }

    destroy() {
        this.unsubscribeHint();
        this.clearHintGlow();
        this.hintEmitter?.destroy();
        this.grabDebug?.destroy();
        this.grabDebug = null;
        this.setTarget(null);
        for (const tween of this.effectTweens) tween.remove();
        this.effectTweens.clear();
        for (const burst of this.bursts) burst.destroy();
        this.bursts.clear();
    }
}
