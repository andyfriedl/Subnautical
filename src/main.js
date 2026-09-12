import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import { createGameState } from './state/gameState.js';

export const gameState = createGameState();

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    pixelArt: true,
    scene: new GameScene(gameState)
};

new Phaser.Game(config);
