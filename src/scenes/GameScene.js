import ReservedFootprints from '../levels/ReservedFootprints.js';
import { WATER_TOP_RGB, WATER_BOTTOM_RGB, WATER_TOP_OPACITY, WATER_BOTTOM_OPACITY, WATER_OVERLAY_DEPTH } from '../systems/waterTint.js';
import { environmentAssets } from '../assets/environmentAssets.js';
import { placeInteractiveObjects } from '../levels/placeInteractiveObjects.js';
import grabN from '../assets/sub/grab/sub-grab-n.png';
import grabNE from '../assets/sub/grab/sub-grab-ne.png';
import grabE from '../assets/sub/grab/sub-grab-e.png';
import grabSE from '../assets/sub/grab/sub-grab-se.png';
import grabS from '../assets/sub/grab/sub-grab-s.png';
import grabSW from '../assets/sub/grab/sub-grab-sw.png';
import grabW from '../assets/sub/grab/sub-grab-w.png';
import grabNW from '../assets/sub/grab/sub-grab-nw.png';
import Phaser from 'phaser';
import { fitLevel } from '../levels/fitLevel.js';
import { getLevel } from '../levels/index.js';
import { generateDive } from '../levels/generateDive.js';
import LevelObjects from '../systems/LevelObjects.js';
import subN from '../assets/sub/sub-idle-n.png';
import subNE from '../assets/sub/sub-idle-ne.png';
import subE from '../assets/sub/sub-idle-e.png';
import subSE from '../assets/sub/sub-idle-se.png';
import subS from '../assets/sub/sub-idle-s.png';
import subSW from '../assets/sub/sub-idle-sw.png';
import subW from '../assets/sub/sub-idle-w.png';
import subNW from '../assets/sub/sub-idle-nw.png';

import SubmarineController from '../systems/SubmarineController.js';
import BubbleSystem from '../systems/BubbleSystem.js';
import FishSchool from '../systems/FishSchool.js';
import EnvironmentSpawner from '../systems/EnvironmentSpawner.js';
import BiomeLighting from '../systems/BiomeLighting.js';

import seabed1 from '../assets/backgrounds/seabed-1.png';
import seabed2 from '../assets/backgrounds/seabed-2.png';

export default class GameScene extends Phaser.Scene {
    constructor(gameState, initialLevelId) {
        super('GameScene');
        this.gameState = gameState;
        this.initialLevelId = initialLevelId;
    }

    init({ levelId = this.initialLevelId } = {}) {
        this.level = fitLevel(generateDive(getLevel(levelId)), { width: this.scale.width, height: this.scale.height });
        this.gameState.startLevel(this.level);
    }

    preload() {
        this.load.image('seabed-2', seabed2);
        for (const { key, url } of environmentAssets) this.load.image(key, url);
        const grabSheets = { n: grabN, ne: grabNE, e: grabE, se: grabSE, s: grabS, sw: grabSW, w: grabW, nw: grabNW };
        for (const [direction, url] of Object.entries(grabSheets)) {
            this.load.spritesheet(`sub-grab-${direction}`, url, {
                frameWidth: 130,
                frameHeight: 93,
                endFrame: 20,
            });
        }

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




    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.seabed =
            this.add.tileSprite(
                0,
                0,
                width,
                height,
                this.level.background.texture
            );

        this.seabed
            .setOrigin(0)
            .setDepth(-900);

        this.seabed.setTileScale(
            this.level.background.tileScale,
            this.level.background.tileScale
        );

        this.reservedFootprints = new ReservedFootprints(this.level.environment.placement.reservedFootprints);
        this.environmentSpawner =
            new EnvironmentSpawner(this, this.level.environment, this.level.biome, this.reservedFootprints);

        this.environmentSpawner.create();

        this.levelObjects = new LevelObjects(this, this.gameState);
        const objects = placeInteractiveObjects(
            this.level.objects, { width, height },
            { ...this.level.player, texture: `sub-${this.level.player.heading}`, origin: [0.5, 0.5], scale: 1 },
            object => {
                const frame = this.textures.getFrame(object.texture);
                return { width: frame.realWidth * object.scale, height: frame.realHeight * object.scale };
            },
            Math.random, this.reservedFootprints
        );
        this.levelObjects.create(objects);

        this.fishSchool =
            new FishSchool(this);

        this.fishSchool.create();

        this.submarine = new SubmarineController(
            this,
            heading => this.bubbleSystem.setDirection(heading),
            this.level.player
        );
        this.player = this.submarine.player;
        this.biomeLighting = this.level.lighting?.enabled
            ? new BiomeLighting(this, this.submarine, this.level.lighting)
            : null;

        this.bubbleSystem =
            new BubbleSystem(
                this,
                this.player
            );

        this.bubbleSystem.setDirection(this.level.player.heading);
        this.bubbleSystem.createMist();

        this.submarine.controls =
            this.input?.keyboard?.addKeys('W,A,S,D') ??
            Object.fromEntries(['W', 'A', 'S', 'D'].map(key => [key, { isDown: false }]));

        // Viewport-wide water tint: tune color and opacity without changing assets.
        const overlayTexture = this.textures.exists('underwaterOverlay')
            ? this.textures.get('underwaterOverlay')
            : this.textures.createCanvas('underwaterOverlay', width, height);
        overlayTexture.setSize(width, height);
        const ctx = overlayTexture.context;
        ctx.clearRect(0, 0, width, height);
        const tint = ctx.createLinearGradient(0, 0, 0, height);
        tint.addColorStop(0, `rgba(${WATER_TOP_RGB}, ${WATER_TOP_OPACITY})`);
        tint.addColorStop(1, `rgba(${WATER_BOTTOM_RGB}, ${WATER_BOTTOM_OPACITY})`);
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, width, height);
        overlayTexture.refresh();
        // Non-interactive image; fixed to the viewport and above gameplay/effects.
        this.add.image(0, 0, 'underwaterOverlay')
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(WATER_OVERLAY_DEPTH);

        this.events.once('shutdown', this.shutdown, this);
    }

    shutdown() {
        this.reservedFootprints.clear();
        this.reservedFootprints = null;
        this.biomeLighting?.destroy();
        this.biomeLighting = null;
        // Phaser destroys scene-owned images, emitters, and keyboard keys on shutdown.
        // Release our references so a restarted scene starts with fresh systems.
        this.levelObjects.objects.clear();
        this.levelObjects = null;
        this.environmentSpawner = null;
        this.fishSchool = null;
        this.bubbleSystem = null;
        this.submarine = null;
        this.player = null;
        this.seabed = null;
    }

    update(time, delta) {
        this.submarine.update(time, delta);
        this.biomeLighting?.update();

        this.bubbleSystem.update(
            delta
        );

        this.fishSchool.update(
            delta,
            this.player
        );

        this.levelObjects.update(this.submarine);
    }
}
