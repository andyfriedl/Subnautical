import { BUBBLE_DEPTH, mixColor, waterTint } from './waterTint.js';
import Phaser from 'phaser';

class BubbleWobbleProcessor
    extends Phaser.GameObjects.Particles.ParticleProcessor {
    update(particle, delta) {
        if (!particle.wobbles) {
            particle.velocityX = 0;
            return;
        }

        particle.wobbleAge += delta;

        particle.velocityX =
            particle.wobbleAmount *
            particle.wobbleSpeed *
            1000 *
            Math.cos(
                particle.wobbleAge *
                particle.wobbleSpeed +
                particle.wobblePhase
            );
    }
}

export default class BubbleSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        this.maxOriginWidth = 45;
        this.originHeight = 10;

        this.ventOffsets = {
            n:  { x: 0,   y: -17 },
            ne: { x: -15, y: -23 },
            e:  { x: -10, y: -29 },
            se: { x: -15, y: -31 },
            s:  { x: 0,   y: -34 },
            sw: { x: 15,  y: -31 },
            w:  { x: 10,  y: -29 },
            nw: { x: 15,  y: -23 }
        };

        this.direction = 'se';

        this.burstInterval = 10000;
        this.burstDuration = 2200;

        this.trickleDuration =
            this.burstInterval -
            this.burstDuration;

        this.burstElapsed = 0;
        this.trickleElapsed = 0;
        this.timeUntilBurst = 0;

        this.spawnTimer = 0;
        this.spawnDelay = 35;

            this.trickleTimer = 0;
            this.trickleSpawnDelay = 180;

            this.maxTrickleBubbles = 32;
            this.trickleLifetime = 4800;

        this.minBubbleSize = 0.5;
        this.maxBubbleSize = 2.4;

        this.minRiseSpeed = 22;
        this.maxRiseSpeed = 52;

        this.wobbleChance = 0.3;
        this.minWobbleAmount = 1;
        this.maxWobbleAmount = 5;
        this.minWobbleSpeed = 0.002;
        this.maxWobbleSpeed = 0.005;

        this.burstEmitter = null;
        this.trickleEmitter = null;
    }

    initializeBubbleTint(particle, color = 0xffffff, y = this.player.y) {
        particle.waterColor = waterTint(color, y, this.scene.scale.height);
        particle.tint = this.updateBubbleTint(particle);
    }

    updateBubbleTint(particle) {
        const lighting = this.scene.biomeLighting;
        const color = particle.waterColor ?? 0xffffff;
        if (!lighting) return color;
        return mixColor(lighting.config.ambientTint, color,
            lighting.config.bubbleLitAmount * lighting.bubbleLightAt(particle.x, particle.y));
    }

    setDirection(direction) {
        this.direction = direction;
    }

    createMist() {
        this.createBubbleTexture();
        this.createEmitters();
        this.startBurst();
    }

    createBubbleTexture() {
        if (
            this.scene.textures.exists(
                'bubble-particle'
            )
        ) {
            return;
        }

        const graphics =
            this.scene.add.graphics();

        graphics.fillStyle(
            0xffffff,
            1
        );

        graphics.fillCircle(
            4,
            4,
            4
        );

        graphics.generateTexture(
            'bubble-particle',
            8,
            8
        );

        graphics.destroy();
    }

    createEmitters() {
        this.burstEmitter =
            this.scene.add.particles(
                0,
                0,
                'bubble-particle',
                {
                    tint: { onEmit: () => 0xffffff, onUpdate: particle => this.updateBubbleTint(particle) },
                    frequency: -1,
                    emitting: false,
                    lifespan: 30000,
                    speedX: 0,
                    speedY: 0,
                    scale: 1,
                    alpha: {
                        min: 0.3,
                        max: 0.55
                    },
                    maxParticles: 700,
                    maxAliveParticles: 700
                }
            );

        this.trickleEmitter =
            this.scene.add.particles(
                0,
                0,
                'bubble-particle',
                {
                    tint: { onEmit: () => 0xffffff, onUpdate: particle => this.updateBubbleTint(particle) },
                    frequency: -1,
                    emitting: false,
                    lifespan:
                        this.trickleLifetime,
                    speedX: 0,
                    speedY: 0,
                    scale: 1,
                    alpha: {
                        start: 0.4,
                        end: 0
                    },
                    maxParticles:
                        this.maxTrickleBubbles,
                    maxAliveParticles:
                        this.maxTrickleBubbles
                }
            );
        
        this.burstEmitter.setDepth(BUBBLE_DEPTH);
        this.trickleEmitter.setDepth(BUBBLE_DEPTH);
        
        this.burstEmitter
            .addParticleProcessor(
                new BubbleWobbleProcessor()
            );

        this.trickleEmitter
            .addParticleProcessor(
                new BubbleWobbleProcessor()
            );

        const bounds =
            new Phaser.Geom.Rectangle(
                -10,
                -10,
                this.scene.scale.width + 20,
                this.scene.scale.height + 20
            );

        this.burstEmitter.addDeathZone({
            type: 'onLeave',
            source: bounds
        });

        this.trickleEmitter.addDeathZone({
            type: 'onLeave',
            source: bounds
        });
    }

    startBurst() {
        this.burstElapsed = 0;
        this.trickleElapsed = 0;

        this.spawnTimer = 0;
        this.trickleTimer = 0;

        this.timeUntilBurst =
            this.burstInterval;
    }

    getBubbleColor(
        radius,
        minSize,
        maxSize
    ) {
        const amount =
            Phaser.Math.Clamp(
                (
                    radius -
                    minSize
                ) /
                (
                    maxSize -
                    minSize
                ),
                0,
                1
            );

        const red =
            Phaser.Math.Linear(
                210,
                255,
                amount
            );

        const green =
            Phaser.Math.Linear(
                235,
                255,
                amount
            );

        const blue =
            Phaser.Math.Linear(
                245,
                255,
                amount
            );

        return Phaser.Display.Color.GetColor(
            red,
            green,
            blue
        );
    }

    spawnMistClump(
        intensity,
        width
    ) {
        const minAmount = 2;
        const maxAmount = 12;

        const amount =
            Math.max(
                minAmount,
                Math.round(
                    Phaser.Math.Linear(
                        minAmount,
                        maxAmount,
                        intensity
                    )
                )
            );

        const offset =
            this.ventOffsets[
                this.direction
            ];

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            const x =
                this.player.x +
                offset.x +
                Phaser.Math.FloatBetween(
                    -width / 2,
                    width / 2
                );

            const y =
                this.player.y +
                offset.y +
                Phaser.Math.FloatBetween(
                    -this.originHeight / 2,
                    this.originHeight / 2
                );

            const radius =
                Phaser.Math.FloatBetween(
                    this.minBubbleSize,
                    this.maxBubbleSize
                );

            const color =
                this.getBubbleColor(
                    radius,
                    this.minBubbleSize,
                    this.maxBubbleSize
                );

            const particle =
                this.burstEmitter
                    .emitParticleAt(
                        x,
                        y,
                        1
                    );

            if (!particle) {
                continue;
            }

            const sizePercent =
                (
                    radius -
                    this.minBubbleSize
                ) /
                (
                    this.maxBubbleSize -
                    this.minBubbleSize
                );

            const riseSpeed =
                Phaser.Math.Linear(
                    this.minRiseSpeed,
                    this.maxRiseSpeed,
                    sizePercent
                );

            const scale =
                radius / 4;

            particle.scaleX = scale;
            particle.scaleY = scale;

            particle.velocityY =
                -riseSpeed;

            particle.wobbles =
                radius > 1 &&
                Math.random() <
                    this.wobbleChance;

            particle.wobbleAmount =
                Phaser.Math.FloatBetween(
                    this.minWobbleAmount,
                    this.maxWobbleAmount
                );

            particle.wobbleSpeed =
                Phaser.Math.FloatBetween(
                    this.minWobbleSpeed,
                    this.maxWobbleSpeed
                );

            particle.wobblePhase =
                Math.random() *
                Math.PI *
                2;

            particle.wobbleAge = 0;

            particle.velocityX = 0;
            this.initializeBubbleTint(particle, color);
        }
    }

    spawnTrickleBubble() {
        const offset =
            this.ventOffsets[
                this.direction
            ];

        const x =
            this.player.x +
            offset.x +
            Phaser.Math.FloatBetween(
                -5,
                5
            );

        const y =
            this.player.y +
            offset.y +
            Phaser.Math.FloatBetween(
                -4,
                4
            );

        const radius =
            Phaser.Math.FloatBetween(
                0.35,
                0.9
            );

        const color =
            this.getBubbleColor(
                radius,
                0.35,
                0.9
            );

        const particle =
            this.trickleEmitter
                .emitParticleAt(
                    x,
                    y,
                    1
                );

        if (!particle) {
            return;
        }

        const scale =
            radius / 4;

        particle.scaleX = scale;
        particle.scaleY = scale;

        particle.velocityY =
            -Phaser.Math.FloatBetween(
                16,
                26
            );

        particle.wobbles =
            Math.random() < 0.15;

        particle.wobbleAmount =
            Phaser.Math.FloatBetween(
                0.5,
                2
            );

        particle.wobbleSpeed =
            Phaser.Math.FloatBetween(
                0.002,
                0.004
            );

        particle.wobblePhase =
            Math.random() *
            Math.PI *
            2;

        particle.wobbleAge = 0;

        particle.velocityX = 0;
        this.initializeBubbleTint(particle, color);
    }

    update(delta) {
        this.timeUntilBurst -= delta;

        if (
            this.burstElapsed <
            this.burstDuration
        ) {
            this.burstElapsed += delta;
            this.spawnTimer -= delta;

            const progress =
                Phaser.Math.Clamp(
                    this.burstElapsed /
                    this.burstDuration,
                    0,
                    1
                );

            let intensity;

            if (progress < 0.2) {
                intensity =
                    progress / 0.2;
            } else {
                intensity =
                    1 -
                    (
                        (
                            progress -
                            0.2
                        ) /
                        0.8
                    );
            }

            intensity =
                Phaser.Math.Clamp(
                    intensity,
                    0,
                    1
                );

            const width =
                Phaser.Math.Linear(
                    3,
                    this.maxOriginWidth,
                    intensity
                );

            if (
                this.spawnTimer <= 0
            ) {
                this.spawnMistClump(
                    intensity,
                    width
                );

                this.spawnTimer =
                    this.spawnDelay;
            }
        } else {
            this.trickleTimer -= delta;

            if (this.trickleTimer <= 0) {
                this.spawnTrickleBubble();

                this.trickleTimer =
                    this.trickleSpawnDelay;
            }
        }

        if (
            this.timeUntilBurst <= 0
        ) {
            this.startBurst();
        }
    }
}