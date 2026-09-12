import Phaser from 'phaser';

export default class EnvironmentSpawner {
    constructor(scene, config) {
        this.scene = scene;

        this.config = config;
        this.decorativeOverscan = config.decorativeOverscan;
        this.interactivePadding = config.interactivePadding;
        this.coralTypes = config.coralTypes;
        this.grassTypes = config.grassTypes;
    }

    create() {
        this.createCoralClusters();
        this.createGrassClusters();
        this.createLoneCoral();
        this.createRareRocks();
        this.createDebris();
    }

    getDecorativeX() {
        return Phaser.Math.Between(
            -this.decorativeOverscan,
            this.scene.scale.width +
                this.decorativeOverscan
        );
    }

    getDecorativeY() {
        return Phaser.Math.Between(
            -this.decorativeOverscan,
            this.scene.scale.height +
                this.decorativeOverscan
        );
    }

    getInteractiveX() {
        return Phaser.Math.Between(
            this.interactivePadding,
            this.scene.scale.width -
                this.interactivePadding
        );
    }

    getInteractiveY() {
        return Phaser.Math.Between(
            this.interactivePadding,
            this.scene.scale.height -
                this.interactivePadding
        );
    }

    createCoralClusters() {
        const mainClusterCount = this.config.coralClusterCount;

        for (
            let i = 0;
            i < mainClusterCount;
            i++
        ) {
            const centerX =
                this.getDecorativeX();

            const centerY =
                this.getDecorativeY();

            const miniClusterCount =
                Phaser.Math.Between(
                    2,
                    4
                );

            for (
                let j = 0;
                j < miniClusterCount;
                j++
            ) {
                const angle =
                    Phaser.Math.FloatBetween(
                        0,
                        Math.PI * 2
                    );

                const distance =
                    Phaser.Math.Between(
                        20,
                        85
                    );

                const clusterX =
                    centerX +
                    Math.cos(angle) *
                    distance;

                const clusterY =
                    centerY +
                    Math.sin(angle) *
                    distance *
                    0.55;

                this.createCoralMiniCluster(
                    clusterX,
                    clusterY
                );

                if (Math.random() < 0.7) {
                    this.createGrassMiniCluster(
                        clusterX +
                            Phaser.Math.Between(
                                -35,
                                35
                            ),

                        clusterY +
                            Phaser.Math.Between(
                                -18,
                                18
                            ),

                        Phaser.Math.Between(
                            1,
                            3
                        )
                    );
                }
            }
        }
    }

    createCoralMiniCluster(
        centerX,
        centerY
    ) {
        const amount =
            Phaser.Math.Between(
                3,
                6
            );

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            const x =
                centerX +
                Phaser.Math.Between(
                    -35,
                    35
                );

            const y =
                centerY +
                Phaser.Math.Between(
                    -18,
                    18
                );

            this.createCoral(
                x,
                y
            );
        }
    }

    createGrassClusters() {
        const clusterCount =
            Phaser.Math.Between(
                this.config.grassClusterCount.min,
                this.config.grassClusterCount.max
            );

        for (
            let i = 0;
            i < clusterCount;
            i++
        ) {
            const centerX =
                this.getDecorativeX();

            const centerY =
                this.getDecorativeY();

            this.createGrassMiniCluster(
                centerX,
                centerY,
                Phaser.Math.Between(
                    2,
                    5
                )
            );
        }
    }

    createGrassMiniCluster(
        centerX,
        centerY,
        amount
    ) {
        for (
            let i = 0;
            i < amount;
            i++
        ) {
            const x =
                centerX +
                Phaser.Math.Between(
                    -28,
                    28
                );

            const y =
                centerY +
                Phaser.Math.Between(
                    -14,
                    14
                );

            this.createGrass(
                x,
                y
            );
        }
    }

    createCoral(
        x,
        y
    ) {
        const roll =
            Math.random();

        const type =
            roll <
            this.coralTypes[0].weight
                ? this.coralTypes[0]
                : this.coralTypes[1];

        const scale =
            Phaser.Math.FloatBetween(
                type.minScale,
                type.maxScale
            );

        const coral =
            this.scene.add.image(
                x,
                y,
                type.key
            );

        coral.setOrigin(
            0.5,
            1
        );

        coral.setScale(
            scale
        );

        coral.setDepth(
            y
        );
    }

    createGrass(
        x,
        y
    ) {
        const type =
            Phaser.Utils.Array.GetRandom(
                this.grassTypes
            );

        const scale =
            Phaser.Math.FloatBetween(
                type.minScale,
                type.maxScale
            );

        const grass =
            this.scene.add.image(
                x,
                y,
                type.key
            );

        grass.setOrigin(
            0.5,
            1
        );

        grass.setScale(
            scale
        );

        grass.setDepth(
            y
        );
    }

    createLoneCoral() {
        const amount = this.config.loneCoralCount;

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            this.createCoral(
                this.getDecorativeX(),
                this.getDecorativeY()
            );
        }
    }

    createRareRocks() {
        const amount =
            Phaser.Math.Between(
                this.config.rockCount.min,
                this.config.rockCount.max
            );

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            const x =
                this.getDecorativeX();

            const y =
                this.getDecorativeY();

            const rock =
                this.scene.add.image(
                    x,
                    y,
                    'rock-1'
                );

            rock.setOrigin(
                0.5,
                1
            );

            rock.setScale(
                Phaser.Math.FloatBetween(
                    0.28,
                    0.42
                )
            );

            rock.setDepth(
                y
            );
        }
    }

    createDebris() {
        const amount = this.config.debrisCount;

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            const x =
                this.getInteractiveX();

            const y =
                this.getInteractiveY();

            const barrel =
                this.scene.add.image(
                    x,
                    y,
                    'barrel-grey-1'
                );

            barrel.setOrigin(
                0.5,
                1
            );

            barrel.setScale(
                Phaser.Math.FloatBetween(
                    0.45,
                    0.6
                )
            );

            barrel.setDepth(
                y
            );
        }
    }

}
