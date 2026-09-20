import Phaser from 'phaser';
import { decorativePool } from '../assets/environmentAssets.js';

// Y ordering within a rock-only band above seabed (-900), below pickups.
const ROCK_DEPTH_BASE = -800;

// Bottom-anchored approximation: positive rotation bends upright plants right.
const PLANT_SWAY_AMOUNT_DEGREES = 1.2;
const PLANT_SWAY_PERIOD_MS = 4800;
const PLANT_SWAY_CURRENT_DIRECTION = 1; // 1 = right, -1 = left
const PLANT_SWAY_VARIATION = 0.25;

export default class EnvironmentSpawner {
    constructor(scene, config, biome = 1, reservedFootprints = null) {
        this.scene = scene;
        this.reservedFootprints = reservedFootprints;
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
        console.log(
            'CORAL DEBUG',
            'biome:', biome,
            'count:', this.coralTypes.length,
            'assets:', this.coralTypes.map(type => type.key)
        );
        this.grassTypes = decorativePool('plants', config.grassTypes, biome);
    }

    chooseVariety(types, previousKey) {
        let eligible = types.filter(type => this.rarityCounts[type.rarity] < this.config.rarityLimits[type.rarity]);
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
        const reserveFirst = this.reservedFootprints?.enabled;
        if (reserveFirst) this.createRareRocks();
        this.createCoralClusters();
        this.createGrassClusters();
        for (let i = 0; i < this.config.lonePlantCount; i++) {
            this.createGrass(this.getDecorativeX(), this.getDecorativeY());
        }
        this.createLoneCoral();
        if (!reserveFirst) this.createRareRocks();
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
        if (!this.coralTypes.length) return;
        const config = this.config.coral;
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
                config.edgeMargin, this.scene.scale.width - config.edgeMargin
            );
            const centerY = Phaser.Math.FloatBetween(
                config.edgeMargin, this.scene.scale.height - config.edgeMargin
            );

            // Give every filename-derived color a reef before repeating a color.
            // Asset weights still choose pieces, but cannot suppress orange neighborhoods.
            if (!remainingGroups.length) remainingGroups = Phaser.Utils.Array.Shuffle([...groups]);
            const dominant = remainingGroups.pop();
            const miniCenters = [];
            const miniClusterCount =
                Phaser.Math.Between(
                    config.miniClusters.min,
                    config.miniClusters.max
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
                        config.miniDistance.min,
                        config.miniDistance.max
                    );

                const clusterX =
                    centerX +
                    Math.cos(angle) *
                    distance;

                const clusterY =
                    centerY +
                    Math.sin(angle) *
                    distance *
                    config.verticalSpread;

                this.createCoralMiniCluster(
                    clusterX,
                    clusterY,
                    dominant
                );
                miniCenters.push({ x: clusterX, y: clusterY });

            }

            const plantClumps = Phaser.Math.Between(config.plants.clumps.min, config.plants.clumps.max);
            for (let j = 0; j < plantClumps; j++) {
                // Unevenly chosen reef anchors place clumps inside, between and along edges.
                const anchor = Phaser.Utils.Array.GetRandom(miniCenters);
                this.createGrassMiniCluster(
                    anchor.x + Phaser.Math.Between(-config.plants.anchorSpread.x, config.plants.anchorSpread.x),
                    anchor.y + Phaser.Math.Between(-config.plants.anchorSpread.y, config.plants.anchorSpread.y),
                    Math.random() < config.plants.largeChance
                        ? Phaser.Math.Between(config.plants.largeCount.min, config.plants.largeCount.max)
                        : Phaser.Math.Between(config.plants.count.min, config.plants.count.max)
                );
            }
        }
    }

    createCoralMiniCluster(
        centerX,
        centerY,
        dominant
    ) {
        const config = this.config.coral;
        const amount = Phaser.Math.Between(config.pieces.min, config.pieces.max);

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
                    -config.spread.x,
                    config.spread.x
                );

            const y =
                centerY +
                Phaser.Math.Between(
                    -config.spread.y,
                    config.spread.y
                );

            this.createCoral(
                x,
                y,
                !accents.length || Math.random() < config.dominantShare ? mainTypes : accents
            );
        }
    }

    createGrassClusters() {
        const config = this.config.grassBeds;
        if (!this.grassTypes.length || config.count.max === 0) return;
        const { width, height } = this.scene.scale;
        const areaRatio = width * height / this.config.referenceArea;
        const bedDensity = this.config.grassBedDensity ?? 1;
        const count = Phaser.Math.Between(
            Math.max(1, Math.round(config.count.min * areaRatio * bedDensity)),
            Math.max(1, Math.round(config.count.max * areaRatio * bedDensity))
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
                    x: Phaser.Math.FloatBetween(config.edgeMargin, width - config.edgeMargin),
                    y: Phaser.Math.FloatBetween(config.edgeMargin, height - config.edgeMargin),
                };
                const spacing = centers.length ? Math.min(...centers.map(other =>
                    Math.hypot(candidate.x - other.x, candidate.y - other.y))) : Infinity;
                if (spacing > bestSpacing) { center = candidate; bestSpacing = spacing; }
            }
            centers.push(center);
            const large = Math.random() < config.largeChance;
            const amount = large ? Phaser.Math.Between(config.largePlants.min, config.largePlants.max) : Phaser.Math.Between(config.plants.min, config.plants.max);
            // Broad, gently curved beds rather than several overlapping tight tufts.
            const spreadX = Phaser.Math.FloatBetween(
                large ? config.spreadX.largeMin : config.spreadX.min,
                large ? config.spreadX.largeMax : config.spreadX.max
            );
            const spreadY = Phaser.Math.FloatBetween(
                large ? config.spreadY.largeMin : config.spreadY.min,
                large ? config.spreadY.largeMax : config.spreadY.max
            );
            const skew = Phaser.Math.FloatBetween(-config.skew, config.skew);
            const bend = Phaser.Math.FloatBetween(-spreadY * config.bend, spreadY * config.bend);
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
                    -this.config.coral.plants.spread.x,
                    this.config.coral.plants.spread.x
                );

            const y =
                centerY +
                Phaser.Math.Between(
                    -this.config.coral.plants.spread.y,
                    this.config.coral.plants.spread.y
                );

            this.createGrass(
                x,
                y
            );
        }
    }

    decorationBlocked(type, x, y, scale) {
        if (!this.reservedFootprints?.enabled) return false;
        const frame = this.scene.textures.getFrame(type.key);
        const width = frame.realWidth * scale, height = frame.realHeight * scale;
        // Decoration sprites are bottom-centered. Reject only the individual
        // piece, leaving its reef/bed shape and all other candidates unchanged.
        const blocked = this.reservedFootprints.isPlacementBlocked({
            left: x - width / 2, right: x + width / 2, top: y - height, bottom: y,
        });
        if (blocked) this.rarityCounts[type.rarity]--; // No instance consumed its budget.
        return blocked;
    }

    createCoral(
        x,
        y,
        types = this.coralTypes
    ) {
        if (!types.length) return;
        const type = this.chooseVariety(types, this.lastCoralKey);

        const scale =
            Phaser.Math.FloatBetween(
                type.minScale,
                type.maxScale
            );

        if (this.decorationBlocked(type, x, y, scale)) return;
        this.lastCoralKey = type.key;

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

        if (type.flipX) coral.setFlipX(Math.random() < 0.5);

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
        if (!this.grassTypes.length) return;
        const type = this.chooseVariety(this.grassTypes, this.lastGrassKey);

        const scale =
            Phaser.Math.FloatBetween(
                type.minScale,
                type.maxScale
            );

        if (this.decorationBlocked(type, x, y, scale)) return;
        this.lastGrassKey = type.key;

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

        if (type.flipX) grass.setFlipX(Math.random() < 0.5);

        grass.setScale(
            scale
        );

        grass.setDepth(
            y
        );

        if (type.sway) {
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

    createScatteredRocks() {
        const config = this.config.rockClumps;
        const { width, height } = this.scene.scale;
        const amount = Phaser.Math.Between(this.config.rockCount.min, this.config.rockCount.max);
        // Clump members use existing slots, with at least one independent rock left.
        const clumpCount = amount >= 3 && Math.random() < config.chance
            ? Math.min(amount - 1, Phaser.Math.Between(config.minPerClump, config.maxPerClump)) : 0;
        const center = { x: Phaser.Math.FloatBetween(config.centerMargin, width - config.centerMargin), y: Phaser.Math.FloatBetween(config.centerMargin, height - config.centerMargin) };
        const placed = [];
        let previousKey;
        const player = this.scene.level.player;
        const playerBounds = new Phaser.Geom.Rectangle(player.x - config.playerClearance.x, player.y - config.playerClearance.y, config.playerClearance.x * 2, config.playerClearance.y * 2);
        for (let i = 0; i < amount; i++) {
            const type = this.chooseVariety(this.rockTypes, previousKey);
            previousKey = type.key;
            const scale = Phaser.Math.FloatBetween(type.minScale, type.maxScale);
            const frame = this.scene.textures.getFrame(type.key);
            const rockWidth = frame.realWidth * scale, rockHeight = frame.realHeight * scale;
            let bounds;
            // Try the clump first, then scatter if this texture is too large to fit.
            for (let attempt = 0; attempt < 240; attempt++) {
                const inClump = i < clumpCount && attempt < 120;
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const distance = Math.sqrt(Math.random()) * config.radius;
                const x = inClump ? center.x + Math.cos(angle) * distance
                    : Phaser.Math.FloatBetween(rockWidth / 2 + config.edgeMargin, width - rockWidth / 2 - config.edgeMargin);
                const y = inClump ? center.y + Math.sin(angle) * distance
                    : Phaser.Math.FloatBetween(rockHeight + config.edgeMargin, height - config.edgeMargin);
                const candidate = new Phaser.Geom.Rectangle(x - rockWidth / 2, y - rockHeight, rockWidth, rockHeight);
                if (candidate.left < config.edgeMargin || candidate.right > width - config.edgeMargin || candidate.top < config.edgeMargin || candidate.bottom > height - config.edgeMargin) continue;
                if (!inClump && clumpCount && Math.hypot(x - center.x, y - center.y) < config.radius * config.scatterSeparation) continue;
                const padded = Phaser.Geom.Rectangle.Clone(candidate);
                Phaser.Geom.Rectangle.Inflate(padded, config.spacing, config.spacing);
                if (Phaser.Geom.Intersects.RectangleToRectangle(padded, playerBounds) ||
                    placed.some(other => Phaser.Geom.Intersects.RectangleToRectangle(padded, other))) continue;
                bounds = candidate;
                break;
            }
            // Extremely oversized future assets must not force overlapping placement.
            if (!bounds) {
                this.rarityCounts[type.rarity]--;
                continue;
            }
            placed.push(bounds);
            const rock = this.scene.add.image(bounds.centerX, bounds.bottom, type.key)
                .setOrigin(0.5, 1).setScale(scale)
                .setDepth(ROCK_DEPTH_BASE + bounds.bottom / height);
            if (type.flipX) rock.setFlipX(Math.random() < 0.5);
            this.reservedFootprints?.registerReservedFootprint(rock.getBounds());
        }
    }

    createRareRocks() {
        if (!this.rockTypes.length) return;
        if (this.config.rockClumps?.enabled) {
            this.createScatteredRocks();
            return;
        }
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

            if (type.flipX) rock.setFlipX(Math.random() < 0.5);

            rock.setScale(
                Phaser.Math.FloatBetween(
                    type.minScale,
                    type.maxScale
                )
            );

            rock.setDepth(ROCK_DEPTH_BASE + y / this.scene.scale.height);
            if (this.reservedFootprints?.enabled) {
                this.reservedFootprints.registerReservedFootprint(rock.getBounds());
            }
        }
    }

}
