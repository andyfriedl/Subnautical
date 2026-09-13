import Phaser from 'phaser';

export default class FishSchool {
    constructor(scene) {
        this.scene = scene;
        // Spatial layout follows session bounds; speeds and schooling forces stay fixed.
        this.layoutX = scene.scale.width / 1152;
        this.layoutY = scene.scale.height / 648;
        this.fish = [];

        this.count = 26;
        this.fishColor = '#2c7082';

        this.minY = 390 * this.layoutY;
        this.maxY = 550 * this.layoutY;

        this.goalX = 650 * this.layoutX;
        this.goalY = 475 * this.layoutY;
        this.goalTimer = 0;

        this.viewDistance = 90;
        this.separationDistance = 18;

        this.cohesionStrength = 18;
        this.alignmentStrength = 22;
        this.separationStrength = 45;
        this.goalStrength = 16;
        this.wanderStrength = 5;

        this.minSpeed = 22;
        this.maxSpeed = 42;

        this.playerAvoidRadius = 100;
        this.playerAvoidStrength = 55;
        this.playerMovementBoost = 2;

        this.lastPlayerX = null;
        this.lastPlayerY = null;

        this.time = 0;
    }

    create() {
        const color = Phaser.Display.Color.HexStringToColor(
            this.fishColor
        ).color;

        for (let i = 0; i < this.count; i++) {
            const x = Phaser.Math.FloatBetween(90 * this.layoutX, 220 * this.layoutX);
            const y = Phaser.Math.FloatBetween(430 * this.layoutY, 520 * this.layoutY);

            const size = Phaser.Math.FloatBetween(2, 4);

            const fish = this.scene.add.rectangle(
                x,
                y,
                size,
                size,
                color,
                Phaser.Math.FloatBetween(0.55, 0.85)
            );

            fish.setRotation(Math.PI / 4);

            fish.vx = Phaser.Math.FloatBetween(18, 28);
            fish.vy = Phaser.Math.FloatBetween(-5, 5);

            fish.baseSpeed = Phaser.Math.FloatBetween(
                this.minSpeed,
                this.maxSpeed
            );

            fish.phase = Math.random() * Math.PI * 2;

            this.fish.push(fish);
        }
    }

    chooseGoal() {
        this.goalX = Phaser.Math.FloatBetween(80 * this.layoutX, 720 * this.layoutX);

        this.goalY = Phaser.Math.FloatBetween(
            this.minY + 20,
            this.maxY - 20
        );

        this.goalTimer = Phaser.Math.Between(3500, 6500);
    }

    update(delta, player) {
        const dt = Math.min(delta / 1000, 0.033);

        this.time += delta;
        this.goalTimer -= delta;

        if (this.goalTimer <= 0) {
            this.chooseGoal();
        }

        let playerMoveX = 0;
        let playerMoveY = 0;

        if (player) {
            if (this.lastPlayerX !== null) {
                playerMoveX =
                    player.x - this.lastPlayerX;

                playerMoveY =
                    player.y - this.lastPlayerY;
            }

            this.lastPlayerX = player.x;
            this.lastPlayerY = player.y;
        }

        const playerSpeed = Math.sqrt(
            playerMoveX * playerMoveX +
            playerMoveY * playerMoveY
        );

        for (const fish of this.fish) {
            let centerX = 0;
            let centerY = 0;

            let alignmentX = 0;
            let alignmentY = 0;

            let separationX = 0;
            let separationY = 0;

            let neighborCount = 0;

            for (const other of this.fish) {
                if (other === fish) {
                    continue;
                }

                const dx = other.x - fish.x;
                const dy = other.y - fish.y;

                const distance = Math.sqrt(
                    dx * dx + dy * dy
                );

                if (
                    distance > 0 &&
                    distance < this.viewDistance
                ) {
                    centerX += other.x;
                    centerY += other.y;

                    alignmentX += other.vx;
                    alignmentY += other.vy;

                    neighborCount++;

                    if (
                        distance <
                        this.separationDistance
                    ) {
                        const strength =
                            1 -
                            distance /
                            this.separationDistance;

                        separationX -=
                            (dx / distance) *
                            strength;

                        separationY -=
                            (dy / distance) *
                            strength;
                    }
                }
            }

            let ax = 0;
            let ay = 0;

            if (neighborCount > 0) {
                centerX /= neighborCount;
                centerY /= neighborCount;

                const cohesionX =
                    centerX - fish.x;

                const cohesionY =
                    centerY - fish.y;

                const cohesionLength = Math.sqrt(
                    cohesionX * cohesionX +
                    cohesionY * cohesionY
                );

                if (cohesionLength > 0) {
                    ax +=
                        (cohesionX / cohesionLength) *
                        this.cohesionStrength;

                    ay +=
                        (cohesionY / cohesionLength) *
                        this.cohesionStrength;
                }

                alignmentX /= neighborCount;
                alignmentY /= neighborCount;

                ax +=
                    (alignmentX - fish.vx) *
                    this.alignmentStrength *
                    0.03;

                ay +=
                    (alignmentY - fish.vy) *
                    this.alignmentStrength *
                    0.03;
            }

            ax +=
                separationX *
                this.separationStrength;

            ay +=
                separationY *
                this.separationStrength;

            const goalDx =
                this.goalX - fish.x;

            const goalDy =
                this.goalY - fish.y;

            const goalDistance = Math.sqrt(
                goalDx * goalDx +
                goalDy * goalDy
            );

            if (goalDistance > 0) {
                ax +=
                    (goalDx / goalDistance) *
                    this.goalStrength;

                ay +=
                    (goalDy / goalDistance) *
                    this.goalStrength;
            }

            ax +=
                Math.sin(
                    this.time * 0.0012 +
                    fish.phase
                ) *
                this.wanderStrength;

            ay +=
                Math.cos(
                    this.time * 0.001 +
                    fish.phase
                ) *
                this.wanderStrength;

            if (player) {
                const dx = fish.x - player.x;
                const dy = fish.y - player.y;

                const distance = Math.sqrt(
                    dx * dx + dy * dy
                );

                if (
                    distance > 0 &&
                    distance < this.playerAvoidRadius
                ) {
                    const proximity =
                        1 -
                        distance /
                        this.playerAvoidRadius;

                    const movementBoost =
                        1 +
                        playerSpeed *
                        this.playerMovementBoost;

                    const force =
                        proximity *
                        proximity *
                        this.playerAvoidStrength *
                        movementBoost;

                    ax +=
                        (dx / distance) *
                        force;

                    ay +=
                        (dy / distance) *
                        force;
                }
            }

            if (fish.y < this.minY) {
                ay +=
                    (this.minY - fish.y) *
                    0.8;
            }

            if (fish.y > this.maxY) {
                ay -=
                    (fish.y - this.maxY) *
                    0.8;
            }

            if (fish.x < 40 * this.layoutX) {
                ax += 35;
            }

            if (fish.x > 760 * this.layoutX) {
                ax -= 35;
            }

            fish.vx += ax * dt;
            fish.vy += ay * dt;

            const speed = Math.sqrt(
                fish.vx * fish.vx +
                fish.vy * fish.vy
            );

            const speedPulse =
                1 +
                Math.sin(
                    this.time * 0.0007 +
                    fish.phase
                ) *
                0.15;

            const targetSpeed =
                fish.baseSpeed *
                speedPulse;

            if (speed > 0) {
                const correction =
                    Phaser.Math.Linear(
                        speed,
                        targetSpeed,
                        0.03
                    ) / speed;

                fish.vx *= correction;
                fish.vy *= correction;
            }

            fish.x += fish.vx * dt;
            fish.y += fish.vy * dt;
        }
    }
}