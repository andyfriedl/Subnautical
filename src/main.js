import React, { useEffect, useState } from 'react';
import { getNextLevelId } from './levels/index.js';
import { selectSessionSize, MIN_GAME_WIDTH, CONSOLE_WIDTH_OVERHEAD } from './config/sessionSize.js';
import { createRoot } from 'react-dom/client';
import App from './ui/App.jsx';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import { createGameState } from './state/gameState.js';

export const gameState = createGameState();
const MIN_CONSOLE_WIDTH = MIN_GAME_WIDTH + CONSOLE_WIDTH_OVERHEAD;
let sessionSize;

let activeGame = null;
let diveStarted = false;

function mountGame(parent) {
    const scene = new GameScene(gameState);
    // Scene plugins (including events/input) do not exist until Phaser boots it.
    // Run normal creation first, then gate only input; rendering keeps running.
    const createScene = scene.create.bind(scene);
    scene.create = (...args) => {
        createScene(...args);
        if (scene.input?.keyboard) {
            scene.input.keyboard.resetKeys();
            scene.input.keyboard.enabled = diveStarted;
        }
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

function Startup() {
    const [size, setSize] = useState(() => readSessionSize());
    useEffect(() => {
        if (size) return; // Once booted, preserve this world's size through resizes.
        const checkSize = () => {
            const nextSize = readSessionSize();
            if (nextSize) setSize(nextSize);
        };
        window.addEventListener('resize', checkSize);
        checkSize();
        return () => window.removeEventListener('resize', checkSize);
    }, [size]);
    if (!size) {
        return React.createElement('main', { className: 'mobile-notice' },
            React.createElement('div', { className: 'mobile-notice-inner' },
                React.createElement('h1', null, 'SUBNAUTICAL'),
                React.createElement('h2', null, 'ROTATE DEVICE'),
                React.createElement('p', null, 'Landscape orientation recommended.'),
                React.createElement('p', null, 'Keyboard controls are currently required for this prototype.')
            ));
    }
    sessionSize = size;
    return React.createElement(App, { gameState, mountGame, sessionSize: size, onNextDive: nextDive, onStartDive: startDive });
}

function readSessionSize() {
    const width = document.documentElement.clientWidth;
    return width >= MIN_CONSOLE_WIDTH ? selectSessionSize(width, window.innerHeight) : null;
}

const root = createRoot(document.getElementById('app'));
root.render(React.createElement(Startup));

if (import.meta.hot) {
    import.meta.hot.dispose(() => root.unmount());
}
