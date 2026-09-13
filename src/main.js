import React from 'react';
import { selectSessionSize } from './config/sessionSize.js';
import { createRoot } from 'react-dom/client';
import App from './ui/App.jsx';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import { createGameState } from './state/gameState.js';

export const gameState = createGameState();
// Read browser space once. Resizing later never changes this session's world.
const sessionSize = selectSessionSize(document.documentElement.clientWidth, window.innerHeight);

function mountGame(parent) {
    const config = {
        type: Phaser.AUTO,
        width: sessionSize.width,
        height: sessionSize.height,
        parent,
        pixelArt: true,
        scale: { mode: Phaser.Scale.NONE },
        scene: new GameScene(gameState)
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
}

const root = createRoot(document.getElementById('app'));
root.render(React.createElement(App, { gameState, mountGame, sessionSize }));

if (import.meta.hot) {
    import.meta.hot.dispose(() => root.unmount());
}
