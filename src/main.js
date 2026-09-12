import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App.jsx';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import { createGameState } from './state/gameState.js';

export const gameState = createGameState();

function mountGame(parent) {
    const config = {
        type: Phaser.AUTO,
        width: 1152,
        height: 648,
        parent,
        pixelArt: true,
        scene: new GameScene(gameState)
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
}

const root = createRoot(document.getElementById('app'));
root.render(React.createElement(App, { gameState, mountGame }));

if (import.meta.hot) {
    import.meta.hot.dispose(() => root.unmount());
}
