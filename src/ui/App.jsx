import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import './shell.css';

function GameViewport({ mountGame }) {
    const container = useRef(null);

    useEffect(() => mountGame(container.current), [mountGame]);

    return <div className="game-viewport" ref={container} aria-label="Subnautical gameplay" />;
}

export default function App({ gameState, mountGame }) {
    const state = useSyncExternalStore(gameState.subscribe, gameState.getSnapshot);

    return (
        <main className="game-shell">
            <header className="shell-header">SUBNAUTICAL</header>
            <div className="shell-middle">
                <aside className="side-frame" aria-hidden="true" />
                <GameViewport mountGame={mountGame} />
                <aside className="side-frame" aria-hidden="true" />
            </div>
            <footer className="shell-status">
                <dl className="status-values">
                    <div><dt>Cleanup</dt><dd>{state.cleanupCount} / {state.cleanupRequired}</dd></div>
                    <div><dt>Discoveries</dt><dd>{state.discoveries.length}</dd></div>
                    <div><dt>Artifacts</dt><dd>{state.artifacts.length}</dd></div>
                    <div><dt>Score</dt><dd>{state.score}</dd></div>
                </dl>
                <label className="mission-progress">
                    <span>Mission progress: {state.progressPercentage}%</span>
                    <progress max="100" value={state.progressPercentage} />
                </label>
                <div className="shell-controls">
                    <button type="button" disabled>MENU</button>
                    <button type="button" disabled>RESTART</button>
                    <button type="button" disabled>HELP</button>
                </div>
            </footer>
        </main>
    );
}
