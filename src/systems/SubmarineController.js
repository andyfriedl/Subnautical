import Phaser from 'phaser';

// Maximum player-generated speed for pickup (pixels/second), excluding current.
const PICKUP_RELATIVE_SPEED_THRESHOLD = 3;
const GRAB_FRAME_RATE = 24;
const GRAB_CHECK_FRAME = 12; // Zero-based sheet frame; claws closing near full extension.
// All eight new sheets shift the 118 x 89 idle body +4 X, +0 Y within a 126 x 92 frame.
const GRAB_ORIGIN = { x: 63 / 126, y: 44.5 / 92 };
const TURN_ACCELERATION = 720; // degrees/sec²
const MAX_TURN_SPEED = 240;    // degrees/sec
const TURN_DRAG = 900;         // degrees/sec² after releasing A/D

// Grab point offsets from sprite center, in pixels at the existing sprite scale.
// Per-facing offsets approximate the claw area of the eight directional images.
const GRAB_POINT_OFFSETS = {
    n:  { x: 0, y: -24 },
    ne: { x: 26, y: -18 },
    e:  { x: 38, y: 8 },
    se: { x: 24, y: 22 },
    s:  { x: 0, y: 26 },
    sw: { x: -24, y: 22 },
    w:  { x: -38, y: 8 },
    nw: { x: -26, y: -18 },
};

export default class SubmarineController {
    constructor(scene, onTurn, spawn) {
        this.scene = scene;
        this.onTurn = onTurn;
        this.interactionLocked = false;
        this.grabReachPending = false;
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

        this.facingIndex = this.directionOrder.indexOf(spawn.heading);

        this.turnTimer = 0;
        this.turnDelay = 140;

        this.player =
            this.scene.add.sprite(
                spawn.x,
                spawn.y,
                `sub-${spawn.heading}`
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

    }

    createSubShadow() {
        const textureKey =
            'sub-shadow';

        if (
            !this.scene.textures.exists(
                textureKey
            )
        ) {
            const canvas =
                this.scene.textures.createCanvas(
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
            this.scene.add.image(
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

        this.onTurn(
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
            this.scene.scale.width;

        const height =
            this.scene.scale.height;

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

    getFacingVector() {
        return this.directionVectors[this.directionOrder[this.facingIndex]].clone();
    }

    startGrab(onReach) {
        if (this.interactionLocked) return false;
        const heading = this.directionOrder[this.facingIndex];
        const key = `sub-grab-${heading}`;
        if (!this.scene.anims.exists(key)) {
            this.scene.anims.create({
                key,
                frames: this.scene.anims.generateFrameNumbers(key, { start: 0, end: 20 }),
                frameRate: GRAB_FRAME_RATE,
                repeat: 0,
            });
        }

        this.lockInteraction();
        this.grabReachPending = true;
        let checked = false;
        const checkReach = (animation, frame) => {
            if (animation.key === key && !checked && frame.index - 1 >= GRAB_CHECK_FRAME) {
                checked = true;
                this.grabReachPending = false;
                onReach();
            }
        };
        this.player.on('animationupdate', checkReach);
        this.player.once(`animationcomplete-${key}`, () => {
            this.grabReachPending = false;
            this.player.off('animationupdate', checkReach);
            this.player.setTexture(`sub-${heading}`).setOrigin(0.5);
            this.unlockInteraction();
        });
        this.player.setOrigin(GRAB_ORIGIN.x, GRAB_ORIGIN.y);
        this.player.play(key);
        return true;
    }

    getGrabPoint() {
        const heading = this.directionOrder[this.facingIndex];
        const offset = GRAB_POINT_OFFSETS[heading];
        return { x: this.player.x + offset.x, y: this.player.y + offset.y };
    }

    isSettled() {
        const activelyControlling = this.controls.W.isDown || this.controls.A.isDown ||
            this.controls.S.isDown || this.controls.D.isDown;
        // velocity already stores thrust/momentum separately from currentVelocity.
        return !this.interactionLocked && !activelyControlling &&
            this.velocity.length() <= PICKUP_RELATIVE_SPEED_THRESHOLD;
    }

    lockInteraction() {
        // Lock facing and additional grabs, without interrupting translation.
        this.interactionLocked = true;
    }

    unlockInteraction() {
        this.interactionLocked = false;
    }

    update(time, delta) {
        const dt =
            delta / 1000;

        this.turnTimer -= delta;

        if (
            !this.interactionLocked &&
            this.controls.A.isDown &&
            this.turnTimer <= 0
        ) {
            this.turnSub(-1);

            this.turnTimer =
                this.turnDelay;
        }

        if (
            !this.interactionLocked &&
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
                this.scene.scale.width -
                    this.boundaryPadding
            );

        this.player.y =
            Phaser.Math.Clamp(
                this.player.y,
                this.boundaryPadding,
                this.scene.scale.height -
                    this.boundaryPadding
            );

        this.subShadow.x =
            this.player.x + 6;

        this.subShadow.y =
            this.player.y + 30;

    }
}
