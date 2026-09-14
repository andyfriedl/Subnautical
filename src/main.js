import React from 'react';
import { getNextLevelId } from './levels/index.js';
import { selectSessionSize } from './config/sessionSize.js';
import { createRoot } from 'react-dom/client';
import App from './ui/App.jsx';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import { createGameState } from './state/gameState.js';

export const gameState = createGameState();
// Read browser space once. Resizing later never changes this session's world.
const sessionSize = selectSessionSize(document.documentElement.clientWidth, window.innerHeight);

let activeGame = null;
let diveStarted = false;

function mountGame(parent) {
    const scene = new GameScene(gameState);
    // Scene plugins (including events/input) do not exist until Phaser boots it.
    // Run normal creation first, then gate only input; rendering keeps running.
    const createScene = scene.create.bind(scene);
    scene.create = (...args) => {
        createScene(...args);
        scene.input.keyboard.resetKeys();
        scene.input.keyboard.enabled = diveStarted;
    };
    const config = {
        type: Phaser.AUTO,
        width: sessionSize.width,
        height: sessionSize.height,
        parent,
        pixelArt: true,
        scale: { mode: Phaser.Scale.NONE },
        scene
    };

    const game = new Phaser.Game(config);
    activeGame = game;
    return () => { activeGame = null; game.destroy(true); };
}

function startDive() {
    diveStarted = true;
    const scene = activeGame?.scene.getScene('GameScene');
    if (scene?.input?.keyboard) {
        scene.input.keyboard.resetKeys();
        scene.input.keyboard.enabled = true;
    }
}

function nextDive() {
    const snapshot = gameState.getSnapshot();
    const nextId = getNextLevelId(snapshot.currentLevelId);
    if (activeGame && snapshot.levelComplete && nextId) {
        activeGame.scene.getScene('GameScene').scene.restart({ levelId: nextId });
    }
}

const root = createRoot(document.getElementById('app'));
root.render(React.createElement(App, { gameState, mountGame, sessionSize, onNextDive: nextDive, onStartDive: startDive }));

if (import.meta.hot) {
    import.meta.hot.dispose(() => root.unmount());
}
