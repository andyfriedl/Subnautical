import Phaser from 'phaser';
import subN from './assets/sub/sub-idle-n.png';
import subNE from './assets/sub/sub-idle-ne.png';
import subE from './assets/sub/sub-idle-e.png';
import subSE from './assets/sub/sub-idle-se.png';
import subS from './assets/sub/sub-idle-s.png';
import subSW from './assets/sub/sub-idle-sw.png';
import subW from './assets/sub/sub-idle-w.png';
import subNW from './assets/sub/sub-idle-nw.png';

import BubbleSystem from './BubbleSystem.js';
import FishSchool from './FishSchool.js';
import EnvironmentSpawner from './EnvironmentSpawner.js';

import barrelGrey1 from './assets/environment/debris/barrel-grey-1.png';
import coralPink1 from './assets/environment/coral/coral-pink-1.png';
import coralPurple1 from './assets/environment/coral/coral-purple-1.png';
import grass1 from './assets/environment/plants/grass-1.png';
import grass2 from './assets/environment/plants/grass-2.png';
import rock1 from './assets/environment/rocks/rock-1.png';
import can1 from './assets/environment/cleanup/can-1.png';

import seabed1 from './assets/backgrounds/seabed-1.png';

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('sub-n', subN);
        this.load.image('sub-ne', subNE);
        this.load.image('sub-e', subE);
        this.load.image('sub-se', subSE);
        this.load.image('sub-s', subS);
        this.load.image('sub-sw', subSW);
        this.load.image('sub-w', subW);
        this.load.image('sub-nw', subNW);

        this.load.image(
            'seabed',
            seabed1
        );

        this.load.image(
            'barrel-grey-1',
            barrelGrey1
        );

        this.load.image(
            'coral-pink-1',
            coralPink1
        );

        this.load.image(
            'coral-purple-1',
            coralPurple1
        );

        this.load.image('grass-1', grass1);
        this.load.image('grass-2', grass2);
        this.load.image('rock-1', rock1);
        this.load.image('can-1', can1);
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        const gradientTexture =
            this.textures.createCanvas(
                'oceanBackground',
                width,
                height
            );

        const ctx =
            gradientTexture.context;

        const gradient =
            ctx.createLinearGradient(
                width * 0.5,
                0,
                width * 0.75,
                height
            );

        gradient.addColorStop(
            0,
            '#06263f'
        );

        gradient.addColorStop(
            1,
            '#1981b4'
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            0,
            0,
            width,
            height
        );

        gradientTexture.refresh();

        this.add
            .image(
                0,
                0,
                'oceanBackground'
            )
            .setOrigin(0)
            .setDepth(-1000);

        this.seabed =
            this.add.tileSprite(
                0,
                0,
                width,
                height,
                'seabed'
            );

        this.seabed
            .setOrigin(0)
            .setDepth(-900);
        
        this.seabed.setTileScale(
            0.45,
            0.45
        );

        this.environmentSpawner =
            new EnvironmentSpawner(this);

        this.environmentSpawner.create();

        this.fishSchool =
            new FishSchool(this);

        this.fishSchool.create();

        this.directionOrder = [
            'n',
            'ne',
            'e',
            'se',
            's',
            'sw',
            'w',
            'nw'
        ];

        this.directionVectors = {
            n:
                new Phaser.Math.Vector2(
                    0,
                    -1
                ),

            ne:
                new Phaser.Math.Vector2(
                    1,
                    -0.5
                ).normalize(),

            e:
                new Phaser.Math.Vector2(
                    1,
                    0
                ),

            se:
                new Phaser.Math.Vector2(
                    1,
                    0.5
                ).normalize(),

            s:
                new Phaser.Math.Vector2(
                    0,
                    1
                ),

            sw:
                new Phaser.Math.Vector2(
                    -1,
                    0.5
                ).normalize(),

            w:
                new Phaser.Math.Vector2(
                    -1,
                    0
                ),

            nw:
                new Phaser.Math.Vector2(
                    -1,
                    -0.5
                ).normalize()
        };

        this.facingIndex = 3;

        this.turnTimer = 0;
        this.turnDelay = 140;

        this.player =
            this.add.image(
                400,
                300,
                'sub-se'
            );

        this.player.setScale(1);
        this.player.setDepth(1000);

        this.createSubShadow();

        this.velocity =
            new Phaser.Math.Vector2(
                0,
                0
            );

        this.maxSpeed = 95;
        this.reverseMaxSpeed = 30;

        this.acceleration = 95;
        this.reverseAcceleration = 70;

        this.thrustDirection =
            this.directionVectors[
                this.directionOrder[
                    this.facingIndex
                ]
            ].clone();

        this.thrustTurnResponse = 2;

        this.drag = 20;

        this.currentVelocity =
            new Phaser.Math.Vector2(
                0,
                0
            );

        this.currentAngle =
            Phaser.Math.FloatBetween(
                -Math.PI,
                Math.PI
            );

        this.currentTargetAngle =
            this.currentAngle;

        this.currentMinSpeed = 0.5;
        this.currentMaxSpeed = 6;

        this.currentDirectionTimer = 0;

        this.currentDirectionMinTime =
            4000;

        this.currentDirectionMaxTime =
            8000;

        this.currentTurnRate = 0.3;
        this.currentResponse = 0.8;

        this.currentTime = 0;

        this.currentPhase =
            Phaser.Math.FloatBetween(
                0,
                Math.PI * 2
            );

        this.boundaryPadding = 55;
        this.boundaryZone = 90;
        this.boundaryStrength = 90;

        this.bubbleSystem =
            new BubbleSystem(
                this,
                this.player
            );

        this.bubbleSystem.createMist();

        this.controls =
            this.input.keyboard.addKeys(
                'W,A,S,D'
            );
    }

    createSubShadow() {
        const textureKey =
            'sub-shadow';

        if (
            !this.textures.exists(
                textureKey
            )
        ) {
            const canvas =
                this.textures.createCanvas(
                    textureKey,
                    128,
                    64
                );

            const ctx =
                canvas.context;

            ctx.save();

            ctx.translate(
                64,
                32
            );

            ctx.scale(
                1,
                0.38
            );

            const gradient =
                ctx.createRadialGradient(
                    0,
                    0,
                    4,
                    0,
                    0,
                    50
                );

            gradient.addColorStop(
                0,
                'rgba(2, 20, 32, 0.42)'
            );

            gradient.addColorStop(
                0.45,
                'rgba(2, 20, 32, 0.22)'
            );

            gradient.addColorStop(
                1,
                'rgba(2, 20, 32, 0)'
            );

            ctx.fillStyle =
                gradient;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                50,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();

            canvas.refresh();
        }

        this.subShadow =
            this.add.image(
                this.player.x + 6,
                this.player.y + 30,
                textureKey
            );

        this.subShadow.setDepth(
            900
        );

        this.subShadow.setScale(
            0.9
        );
    }

    turnSub(direction) {
        this.facingIndex =
            (
                this.facingIndex +
                direction +
                8
            ) % 8;

        const heading =
            this.directionOrder[
                this.facingIndex
            ];

        this.player.setTexture(
            `sub-${heading}`
        );

        this.bubbleSystem.setDirection(
            heading
        );
    }

    updateCurrent(delta) {
        const dt =
            delta / 1000;

        this.currentTime += delta;

        this.currentDirectionTimer -=
            delta;

        if (
            this.currentDirectionTimer <=
            0
        ) {
            this.currentTargetAngle =
                this.currentAngle +
                Phaser.Math.FloatBetween(
                    -0.9,
                    0.9
                );

            this.currentDirectionTimer =
                Phaser.Math.Between(
                    this.currentDirectionMinTime,
                    this.currentDirectionMaxTime
                );
        }

        const angleDifference =
            Phaser.Math.Angle.Wrap(
                this.currentTargetAngle -
                this.currentAngle
            );

        this.currentAngle +=
            angleDifference *
            this.currentTurnRate *
            dt;

        const ebb =
            (
                Math.sin(
                    this.currentTime *
                        0.00075 +
                    this.currentPhase
                ) +
                1
            ) / 2;

        const currentSpeed =
            Phaser.Math.Linear(
                this.currentMinSpeed,
                this.currentMaxSpeed,
                ebb
            );

        const targetX =
            Math.cos(
                this.currentAngle
            ) *
            currentSpeed;

        const targetY =
            Math.sin(
                this.currentAngle
            ) *
            currentSpeed;

        const response =
            Math.min(
                1,
                this.currentResponse *
                    dt
            );

        this.currentVelocity.x =
            Phaser.Math.Linear(
                this.currentVelocity.x,
                targetX,
                response
            );

        this.currentVelocity.y =
            Phaser.Math.Linear(
                this.currentVelocity.y,
                targetY,
                response
            );
    }

    getBoundaryPush() {
        const width =
            this.scale.width;

        const height =
            this.scale.height;

        const minX =
            this.boundaryPadding;

        const maxX =
            width -
            this.boundaryPadding;

        const minY =
            this.boundaryPadding;

        const maxY =
            height -
            this.boundaryPadding;

        const push =
            new Phaser.Math.Vector2(
                0,
                0
            );

        if (
            this.player.x <
            minX +
                this.boundaryZone
        ) {
            const amount =
                1 -
                Phaser.Math.Clamp(
                    (
                        this.player.x -
                        minX
                    ) /
                    this.boundaryZone,
                    0,
                    1
                );

            push.x +=
                amount *
                this.boundaryStrength;
        }

        if (
            this.player.x >
            maxX -
                this.boundaryZone
        ) {
            const amount =
                1 -
                Phaser.Math.Clamp(
                    (
                        maxX -
                        this.player.x
                    ) /
                    this.boundaryZone,
                    0,
                    1
                );

            push.x -=
                amount *
                this.boundaryStrength;
        }

        if (
            this.player.y <
            minY +
                this.boundaryZone
        ) {
            const amount =
                1 -
                Phaser.Math.Clamp(
                    (
                        this.player.y -
                        minY
                    ) /
                    this.boundaryZone,
                    0,
                    1
                );

            push.y +=
                amount *
                this.boundaryStrength;
        }

        if (
            this.player.y >
            maxY -
                this.boundaryZone
        ) {
            const amount =
                1 -
                Phaser.Math.Clamp(
                    (
                        maxY -
                        this.player.y
                    ) /
                    this.boundaryZone,
                    0,
                    1
                );

            push.y -=
                amount *
                this.boundaryStrength;
        }

        return push;
    }

    update(time, delta) {
        const dt =
            delta / 1000;

        this.turnTimer -= delta;

        if (
            this.controls.A.isDown &&
            this.turnTimer <= 0
        ) {
            this.turnSub(-1);

            this.turnTimer =
                this.turnDelay;
        }

        if (
            this.controls.D.isDown &&
            this.turnTimer <= 0
        ) {
            this.turnSub(1);

            this.turnTimer =
                this.turnDelay;
        }

        if (
            this.controls.S.isDown
        ) {
            const heading =
                this.directionOrder[
                    this.facingIndex
                ];

            const forward =
                this.directionVectors[
                    heading
                ];

            this.velocity.x -=
                forward.x *
                this.reverseAcceleration *
                dt;

            this.velocity.y -=
                forward.y *
                this.reverseAcceleration *
                dt;

        } else if (
            this.controls.W.isDown
        ) {
            const heading =
                this.directionOrder[
                    this.facingIndex
                ];

            const forward =
                this.directionVectors[
                    heading
                ];

            this.velocity.x +=
                forward.x *
                this.acceleration *
                dt;

            this.velocity.y +=
                forward.y *
                this.acceleration *
                dt;

        } else {
            const speed =
                this.velocity.length();

            if (speed > 0) {
                const newSpeed =
                    Math.max(
                        0,
                        speed -
                            this.drag *
                            dt
                    );

                this.velocity.setLength(
                    newSpeed
                );
            }
        }

        const heading =
            this.directionOrder[
                this.facingIndex
            ];

        const forward =
            this.directionVectors[
                heading
            ];

        const movingInReverse =
            this.velocity.dot(
                forward
            ) < 0;

        const speedLimit =
            this.controls.S.isDown &&
            movingInReverse
                ? this.reverseMaxSpeed
                : this.maxSpeed;

        if (
            this.velocity.length() >
            speedLimit
        ) {
            this.velocity.setLength(
                speedLimit
            );
        }

        this.updateCurrent(
            delta
        );

        const boundaryPush =
            this.getBoundaryPush();

        this.player.x +=
            (
                this.velocity.x +
                this.currentVelocity.x +
                boundaryPush.x
            ) *
            dt;

        this.player.y +=
            (
                this.velocity.y +
                this.currentVelocity.y +
                boundaryPush.y
            ) *
            dt;

        this.player.x =
            Phaser.Math.Clamp(
                this.player.x,
                this.boundaryPadding,
                this.scale.width -
                    this.boundaryPadding
            );

        this.player.y =
            Phaser.Math.Clamp(
                this.player.y,
                this.boundaryPadding,
                this.scale.height -
                    this.boundaryPadding
            );

        this.subShadow.x =
            this.player.x + 6;

        this.subShadow.y =
            this.player.y + 30;

        this.bubbleSystem.update(
            delta
        );

        this.fishSchool.update(
            delta
        );
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    pixelArt: true,
    scene: GameScene
};

new Phaser.Game(config);