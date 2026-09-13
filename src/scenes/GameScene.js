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

import barrelGrey1 from '../assets/environment/debris/barrel-grey-1.png';
import coralPink1 from '../assets/environment/coral/coral-pink-1.png';
import coralPurple1 from '../assets/environment/coral/coral-purple-1.png';
import grass1 from '../assets/environment/plants/grass-1.png';
import grass2 from '../assets/environment/plants/grass-2.png';
import rock1 from '../assets/environment/rocks/rock-1.png';
import can1 from '../assets/environment/cleanup/can-1.png';

import seabed1 from '../assets/backgrounds/seabed-1.png';

export default class GameScene extends Phaser.Scene {
    constructor(gameState) {
        super('GameScene');
        this.gameState = gameState;
    }

    init({ levelId } = {}) {
        this.level = fitLevel(getLevel(levelId), { width: this.scale.width, height: this.scale.height });
        this.gameState.startLevel(this.level);
    }

    preload() {
        const grabSheets = { n: grabN, ne: grabNE, e: grabE, se: grabSE, s: grabS, sw: grabSW, w: grabW, nw: grabNW };
        for (const [direction, url] of Object.entries(grabSheets)) {
            this.load.spritesheet(`sub-grab-${direction}`, url, {
                frameWidth: 126,
                frameHeight: 92,
                endFrame: 36,
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
            this.textures.exists('oceanBackground')
                ? this.textures.get('oceanBackground')
                : this.textures.createCanvas(
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
                this.level.background.texture
            );

        this.seabed
            .setOrigin(0)
            .setDepth(-900);

        this.seabed.setTileScale(
            this.level.background.tileScale,
            this.level.background.tileScale
        );

        this.environmentSpawner =
            new EnvironmentSpawner(this, this.level.environment);

        this.environmentSpawner.create();

        this.levelObjects = new LevelObjects(this, this.gameState);
        this.levelObjects.create(this.level.objects);

        this.fishSchool =
            new FishSchool(this);

        this.fishSchool.create();

        this.submarine = new SubmarineController(
            this,
            heading => this.bubbleSystem.setDirection(heading),
            this.level.player
        );
        this.player = this.submarine.player;

        this.bubbleSystem =
            new BubbleSystem(
                this,
                this.player
            );

        this.bubbleSystem.setDirection(this.level.player.heading);
        this.bubbleSystem.createMist();

        this.submarine.controls =
            this.input.keyboard.addKeys(
                'W,A,S,D'
            );

        this.events.once('shutdown', this.shutdown, this);
    }

    shutdown() {
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
