import React, { useEffect, useState } from 'react';
import { getNextLevelId, getInitialLevelId, getLevel } from './levels/index.js';
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
let helpOpen = false;
const DIVE_TRANSITION_DELAY_MS = 1400;
let transitionTimer = null;

function cancelTransition() {
    clearTimeout(transitionTimer);
    transitionTimer = null;
}

function handleDiveProgress() {
    const snapshot = gameState.getSnapshot();
    if (!snapshot.levelComplete) { cancelTransition(); return; }
    setDiveInput(false);
    if (transitionTimer !== null || !getNextLevelId(snapshot.currentLevelId)) return;
    const completedId = snapshot.currentLevelId;
    transitionTimer = setTimeout(() => {
        transitionTimer = null;
        const current = gameState.getSnapshot();
        if (current.currentLevelId === completedId && current.levelComplete) nextDive();
    }, DIVE_TRANSITION_DELAY_MS);
}

function mountGame(parent) {
    const scene = new GameScene(gameState, getInitialLevelId(window.location.search));
    // Scene plugins (including events/input) do not exist until Phaser boots it.
    // Run normal creation first, then gate only input; rendering keeps running.
    const createScene = scene.create.bind(scene);
    scene.create = (...args) => {
        createScene(...args);
        setDiveInput(diveStarted && !helpOpen, scene);
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
    const unsubscribe = gameState.subscribe(handleDiveProgress);
    return () => {
        cancelTransition();
        unsubscribe();
        activeGame = null;
        game.destroy(true);
    };
}

function setDiveInput(enabled, scene = activeGame?.scene.getScene('GameScene')) {
    if (scene?.input?.keyboard) {
        scene.input.keyboard.resetKeys();
        scene.input.keyboard.enabled = enabled && !gameState.getSnapshot().levelComplete;
    }
}

function startDive() {
    diveStarted = true;
    setDiveInput(!helpOpen);
}

function setHelpOpen(open) {
    helpOpen = open;
    setDiveInput(diveStarted && !helpOpen);
}

function restartDive() {
    const levelId = gameState.getSnapshot().currentLevelId;
    if (!activeGame || !levelId) return;
    cancelTransition();
    diveStarted = false;
    helpOpen = false;
    setDiveInput(false);
    activeGame.scene.getScene('GameScene').scene.restart({ levelId });
}

function nextDive() {
    const snapshot = gameState.getSnapshot();
    const nextId = getNextLevelId(snapshot.currentLevelId);
    if (activeGame && snapshot.levelComplete && nextId) {
        const changingBiome = getLevel(nextId).biome !== getLevel(snapshot.currentLevelId).biome;
        diveStarted = !changingBiome;
        helpOpen = false;
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
                React.createElement('h1', null, 'SUBOCEANIC'),
                React.createElement('h2', null, 'ROTATE DEVICE'),
                React.createElement('p', null, 'Landscape orientation recommended.'),
                React.createElement('p', null, 'Keyboard controls are currently required for this prototype.')
            ));
    }
    sessionSize = size;
    return React.createElement(App, { gameState, mountGame, sessionSize: size, onStartDive: startDive, onHelpChange: setHelpOpen, onRestartDive: restartDive, transitionDuration: DIVE_TRANSITION_DELAY_MS });
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
