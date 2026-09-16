import Phaser from 'phaser';
import { decorativePool } from '../assets/environmentAssets.js';

const CORAL_DOMINANT_SHARE = 0.8;
const CORAL_REEF_EDGE_MARGIN = 120;
const LARGE_PLANT_PATCH_CHANCE = 0.2;
const GRASS_BED_REFERENCE_AREA = 1152 * 648;
const GRASS_BED_COUNT_MIN = 6;
const GRASS_BED_COUNT_MAX = 10;
const GRASS_BED_EDGE_MARGIN = 20;
// Half-extents of the planting footprint; sprite artwork extends beyond these.
const GRASS_BED_SPREAD_X = { min: 95, max: 130, largeMin: 130, largeMax: 165 };
const GRASS_BED_SPREAD_Y = { min: 35, max: 50, largeMin: 45, largeMax: 65 };

// Bottom-anchored approximation: positive rotation bends upright plants right.
const PLANT_SWAY_KEYS = new Set(['s-c-grass-2', 's-c-grass-4']);
const PLANT_SWAY_AMOUNT_DEGREES = 1.2;
const PLANT_SWAY_PERIOD_MS = 4800;
const PLANT_SWAY_CURRENT_DIRECTION = 1; // 1 = right, -1 = left
const PLANT_SWAY_VARIATION = 0.25;

// Shared hard caps across all decorative categories, reset for every dive.
const DECORATIVE_RARITY_LIMITS = { common: Infinity, uncommon: 8, rare: 3, veryRare: 1 };

export default class EnvironmentSpawner {
    constructor(scene, config, biome = 's') {
        this.scene = scene;
        this.rarityCounts = { common: 0, uncommon: 0, rare: 0, veryRare: 0 };
        this.swayPlants = [];
        // Independent stream: animation variation must not change spawning randomness.
        this.swayRandom = new Phaser.Math.RandomDataGenerator(['decorative-plant-sway']);
        scene.events.on('update', this.updatePlantSway, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this.updatePlantSway, this);
            this.swayPlants.length = 0;
        });

        this.config = config;
        this.decorativeOverscan = config.decorativeOverscan;
        this.rockTypes = decorativePool('rocks', config.rockTypes, biome);
        this.lastCoralKey = null;
        this.lastGrassKey = null;
        this.coralTypes = decorativePool('coral', config.coralTypes, biome);
        this.grassTypes = decorativePool('plants', config.grassTypes, biome);
    }

    chooseVariety(types, previousKey) {
        let eligible = types.filter(type => this.rarityCounts[type.rarity] < DECORATIVE_RARITY_LIMITS[type.rarity]);
        if (!eligible.length) {
            // A restricted reef/accent pool may be exhausted. Keep the slot,
            // falling back to common textures from the same biome and category.
            const category = types[0]?.category;
            const fullPool = category === 'coral' ? this.coralTypes
                : category === 'plants' ? this.grassTypes : this.rockTypes;
            const common = fullPool.filter(type => type.rarity === 'common');
            const sameGroup = common.filter(type => types.some(original => original.group === type.group));
            eligible = sameGroup.length ? sameGroup : common;
        }
        if (!eligible.length) throw new Error('Decorative categories need common assets to fill rarity-limited slots.');
        const alternatives = eligible.filter(type => type.key !== previousKey);
        const pool = alternatives.length ? alternatives : eligible;
        let roll = Math.random() * pool.reduce((sum, type) => sum + (type.weight ?? 1), 0);
        for (const type of pool) {
            roll -= type.weight ?? 1;
            if (roll < 0) {
                this.rarityCounts[type.rarity]++;
                return type;
            }
        }
        const type = pool[pool.length - 1];
        this.rarityCounts[type.rarity]++;
        return type;
    }

    create() {
        this.rarityCounts = { common: 0, uncommon: 0, rare: 0, veryRare: 0 };
        this.createCoralClusters();
        this.createGrassClusters();
        for (let i = 0; i < this.config.lonePlantCount; i++) {
            this.createGrass(this.getDecorativeX(), this.getDecorativeY());
        }
        this.createLoneCoral();
        this.createRareRocks();
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

    createCoralClusters() {
        const mainClusterCount = this.config.coralClusterCount;
        const groups = [...new Set(this.coralTypes.filter(type =>
            type.rarity === 'common' || type.rarity === 'uncommon').map(type => type.group))];
        let remainingGroups = [];

        for (
            let i = 0;
            i < mainClusterCount;
            i++
        ) {
            const centerX = Phaser.Math.FloatBetween(
                CORAL_REEF_EDGE_MARGIN, this.scene.scale.width - CORAL_REEF_EDGE_MARGIN
            );
            const centerY = Phaser.Math.FloatBetween(
                CORAL_REEF_EDGE_MARGIN, this.scene.scale.height - CORAL_REEF_EDGE_MARGIN
            );

            // Give every filename-derived color a reef before repeating a color.
            // Asset weights still choose pieces, but cannot suppress orange neighborhoods.
            if (!remainingGroups.length) remainingGroups = Phaser.Utils.Array.Shuffle([...groups]);
            const dominant = remainingGroups.pop();
            const miniCenters = [];
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
                    clusterY,
                    dominant
                );
                miniCenters.push({ x: clusterX, y: clusterY });

            }

            const plantClumps = Phaser.Math.Between(2, 4);
            for (let j = 0; j < plantClumps; j++) {
                // Unevenly chosen reef anchors place clumps inside, between and along edges.
                const anchor = Phaser.Utils.Array.GetRandom(miniCenters);
                this.createGrassMiniCluster(
                    anchor.x + Phaser.Math.Between(-45, 45),
                    anchor.y + Phaser.Math.Between(-24, 24),
                    Math.random() < LARGE_PLANT_PATCH_CHANCE
                        ? Phaser.Math.Between(8, 12) : Phaser.Math.Between(4, 8)
                );
            }
        }
    }

    createCoralMiniCluster(
        centerX,
        centerY,
        dominant
    ) {
        const amount =
            Phaser.Math.Between(
                3,
                6
            );

        const mainTypes = this.coralTypes.filter(type => type.group === dominant &&
            (type.rarity === 'common' || type.rarity === 'uncommon'));
        const accents = this.coralTypes.filter(type => !mainTypes.includes(type));

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
                y,
                !accents.length || Math.random() < CORAL_DOMINANT_SHARE ? mainTypes : accents
            );
        }
    }

    createGrassClusters() {
        const { width, height } = this.scene.scale;
        const areaRatio = width * height / GRASS_BED_REFERENCE_AREA;
        const bedDensity = this.config.grassBedDensity ?? 1;
        const count = Phaser.Math.Between(
            Math.max(1, Math.round(GRASS_BED_COUNT_MIN * areaRatio * bedDensity)),
            Math.max(1, Math.round(GRASS_BED_COUNT_MAX * areaRatio * bedDensity))
        );
        const centers = [];
        for (let i = 0; i < count; i++) {
            // Choose among random candidates to leave sandy gaps between beds.
            // Keep centers just inside the view so broad beds can cross its edges
            // while retaining a visible core. Individual plants are not clamped.
            let center;
            let bestSpacing = -1;
            for (let attempt = 0; attempt < 20; attempt++) {
                const candidate = {
                    x: Phaser.Math.FloatBetween(GRASS_BED_EDGE_MARGIN, width - GRASS_BED_EDGE_MARGIN),
                    y: Phaser.Math.FloatBetween(GRASS_BED_EDGE_MARGIN, height - GRASS_BED_EDGE_MARGIN),
                };
                const spacing = centers.length ? Math.min(...centers.map(other =>
                    Math.hypot(candidate.x - other.x, candidate.y - other.y))) : Infinity;
                if (spacing > bestSpacing) { center = candidate; bestSpacing = spacing; }
            }
            centers.push(center);
            const large = Math.random() < LARGE_PLANT_PATCH_CHANCE;
            const amount = large ? Phaser.Math.Between(24, 32) : Phaser.Math.Between(12, 24);
            // Broad, gently curved beds rather than several overlapping tight tufts.
            const spreadX = Phaser.Math.FloatBetween(
                large ? GRASS_BED_SPREAD_X.largeMin : GRASS_BED_SPREAD_X.min,
                large ? GRASS_BED_SPREAD_X.largeMax : GRASS_BED_SPREAD_X.max
            );
            const spreadY = Phaser.Math.FloatBetween(
                large ? GRASS_BED_SPREAD_Y.largeMin : GRASS_BED_SPREAD_Y.min,
                large ? GRASS_BED_SPREAD_Y.largeMax : GRASS_BED_SPREAD_Y.max
            );
            const skew = Phaser.Math.FloatBetween(-0.2, 0.2);
            const bend = Phaser.Math.FloatBetween(-spreadY * 0.5, spreadY * 0.5);
            for (let j = 0; j < amount; j++) {
                // Jittered horizontal bands cover the full bed without an even grid.
                const u = (j + Math.random()) / amount * 2 - 1;
                const dx = u * spreadX;
                const edgeWidth = Math.sqrt(1 - u * u);
                const dy = Phaser.Math.FloatBetween(-1, 1) * spreadY * edgeWidth
                    + bend * (1 - u * u);
                this.createGrass(center.x + dx, center.y + dy + dx * skew);
            }
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
                    -20,
                    20
                );

            const y =
                centerY +
                Phaser.Math.Between(
                    -10,
                    10
                );

            this.createGrass(
                x,
                y
            );
        }
    }

    createCoral(
        x,
        y,
        types = this.coralTypes
    ) {
        const type = this.chooseVariety(types, this.lastCoralKey);
        this.lastCoralKey = type.key;

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
        const type = this.chooseVariety(this.grassTypes, this.lastGrassKey);
        this.lastGrassKey = type.key;

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

        if (PLANT_SWAY_KEYS.has(type.key)) {
            const variation = () => this.swayRandom.realInRange(
                1 - PLANT_SWAY_VARIATION, 1 + PLANT_SWAY_VARIATION
            );
            this.swayPlants.push({
                image: grass,
                phase: this.swayRandom.realInRange(0, Math.PI * 2),
                amount: PLANT_SWAY_AMOUNT_DEGREES * variation(),
                period: PLANT_SWAY_PERIOD_MS * variation(),
            });
        }
    }

    updatePlantSway(_time, delta) {
        for (const plant of this.swayPlants) {
            plant.phase = (plant.phase + delta / plant.period * Math.PI * 2) % (Math.PI * 2);
            // Relax and lean with a shared current, without changing the planted x/y.
            plant.image.setAngle(PLANT_SWAY_CURRENT_DIRECTION * plant.amount
                * (1 + Math.sin(plant.phase)));
        }
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

            const type = this.chooseVariety(this.rockTypes);
            const rock =
                this.scene.add.image(
                    x,
                    y,
                    type.key
                );

            rock.setOrigin(
                0.5,
                1
            );

            rock.setScale(
                Phaser.Math.FloatBetween(
                    type.minScale,
                    type.maxScale
                )
            );

            rock.setDepth(
                y
            );
        }
    }

}
