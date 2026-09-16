import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getNextLevelId } from '../levels/index.js';
import './shell.css';

function focusSafely(element) {
    if (!element?.focus) return;
    try { element.focus({ preventScroll: true }); }
    catch { element.focus(); }
}

function GameViewport({ mountGame }) {
    const container = useRef(null);
    useEffect(() => mountGame(container.current), [mountGame]);
    return <div className="game-viewport" ref={container} aria-label="Subnautical gameplay" />;
}

function ConsoleHeader() {
    return (
        <header className="shell-header">
            <div className="console-brand">
                <div className="brand-line"><h1>SUBNAUTICAL</h1><span className="accent-stripes" aria-hidden="true"><i /><i /><i /></span></div>
                <p>CLEANER SEAS BRIGHTER TOMORROWS</p>
            </div>
            <p className="category-label"><span>EXPLORE</span><span>DISCOVER</span><span>CLEAN</span><span>PRESERVE</span></p>

        </header>
    );
}

function DiveStatus({ levelComplete, progressPercentage, hasNextLevel }) {
    return (
        <section className={`dive-status${levelComplete ? ' is-complete' : ''}`} aria-labelledby="dive-heading">
            <h2 id="dive-heading">DIVE STATUS</h2>
            <div className="dive-readout" role="status" aria-live="polite" aria-atomic="true">
                <p className="dive-message">{levelComplete ? 'DIVE COMPLETE' : 'DIVE ACTIVE'}</p>
                <p className="dive-detail">
                    {levelComplete
                        ? (hasNextLevel ? 'NEXT DIVE AVAILABLE' : <>NEXT DIVE<br />COMING SOON</>)
                        : `${Math.round(progressPercentage * 100)}% COMPLETE`}
                </p>
                {levelComplete && (
                    <svg className="dive-check" viewBox="0 0 64 64" aria-hidden="true">
                        <circle cx="32" cy="32" r="28" />
                        <path d="M 18 32 L 28 42 L 46 23" />
                    </svg>
                )}
            </div>
        </section>
    );
}

function ConsolePopup({ titleId, descriptionId, onDismiss, className = '', children }) {
    const panel = useRef(null);
    useEffect(() => {
        const previousFocus = document.activeElement;
        focusSafely(panel.current.querySelector('[data-initial-focus], button:not(:disabled)'));
        return () => focusSafely(previousFocus);
    }, []);

    function handleKey(event) {
        event.stopPropagation();
        if (event.key === 'Escape' && onDismiss) {
            event.preventDefault();
            onDismiss();
        }
        if (event.key === 'Tab') {
            const buttons = [...panel.current.querySelectorAll('button:not(:disabled)')];
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault(); first.focus();
            }
        }
    }

    return (
        <div className="completion-overlay">
            <section className={`completion-popup ${className}`} ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={handleKey}>
                <div className="completion-inner">{children}</div>
            </section>
        </div>
    );
}

// Supply onNextDive only when a real next-level transition is available.
function CompletionPopup({ onStay, onNextDive }) {
    return (
        <ConsolePopup titleId="completion-heading" descriptionId="completion-description" onDismiss={onStay}>
                    <svg className="dive-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" /><path d="M 18 32 L 28 42 L 46 23" /></svg>
                    <h2 id="completion-heading">LEVEL COMPLETE</h2>
                    <p id="completion-description">All objectives met</p>
                    <div className="completion-actions">
                        <button type="button" disabled={!onNextDive} onClick={onNextDive}>NEXT DIVE</button>
                        <button type="button" data-initial-focus onClick={onStay}>STAY</button>
                    </div>
        </ConsolePopup>
    );
}

function StartPopup({ onStart, isHelp = false }) {
    return (
        <ConsolePopup titleId="start-heading" descriptionId="start-description" className="start-popup" onDismiss={isHelp ? onStart : undefined}>
            <h2 id="start-heading">HOW TO DIVE</h2>
            <p id="start-description">Clean the sea, recover lost objects, and complete the mission.</p>
            <dl className="start-controls">
                <div><dt>W / S</dt><dd>Forward / Reverse</dd></div>
                <div><dt>A / D</dt><dd>Turn</dd></div>
                <div><dt>SPACE</dt><dd>Extend the claws and grab objects</dd></div>
            </dl>
            <p>Use the claws to collect cleanup items and recover artifacts you find along the way.</p>
            {isHelp && <p>Some objects may be partially hidden behind coral or plants. Check dense areas carefully.</p>}
            <div className="completion-actions">
                <button type="button" className={isHelp ? undefined : 'start-dive-button'} onClick={onStart}>{isHelp ? 'RESUME DIVE' : 'START DIVE'}</button>
            </div>
        </ConsolePopup>
    );
}

function MissionStatus({ state, onHelp, onRestart, helpDisabled, restartDisabled }) {
    // Read the active generated mission snapshot; never generate assets during render.
    const requiredCount = kind => new Set(state.objectives
        .filter(o => o.kind === kind)
        .flatMap(o => o.objectIds ?? [])).size;

    return (
        <aside className="instrument-rail left-rail" aria-label="Mission instruments">
            <section className="mission-status" aria-labelledby="mission-heading">
                <h2 id="mission-heading">MISSION STATUS</h2>
                <dl className="status-values">
                    <div className="cleanup-value"><dt>Cleanup</dt><dd>{state.cleanupCount} / {state.cleanupRequired}</dd></div>
                    <div className="discovery-value"><dt>Discoveries</dt><dd>{state.discoveries.length} / {requiredCount('discovery')}</dd></div>
                    <div className="artifact-value"><dt>Artifacts</dt><dd>{state.artifactCount} / {state.artifactsRequired}</dd></div>
                </dl>
            </section>
            <DiveStatus levelComplete={state.levelComplete} progressPercentage={state.progressPercentage} hasNextLevel={Boolean(getNextLevelId(state.currentLevelId))} />
            <div className="shell-controls">
                <button className="control-menu" type="button" disabled><span aria-hidden="true">☰</span>MENU</button>
                <button className="control-restart" type="button" disabled={restartDisabled} onClick={onRestart}><span aria-hidden="true">↻</span>RESTART</button>
                <button className="control-help" type="button" disabled={helpDisabled} onClick={onHelp}><span aria-hidden="true">?</span>HELP</button>
            </div>
        </aside>
    );

}

export default function App({ gameState, mountGame, sessionSize, onNextDive, onStartDive, onHelpChange, onRestartDive }) {
    const state = useSyncExternalStore(gameState.subscribe, gameState.getSnapshot);
    const [showHelp, setShowHelp] = useState(false);
    const [showStart, setShowStart] = useState(true);
    const [showCompletion, setShowCompletion] = useState(false);
    const previous = useRef({ levelId: null, complete: false });
    useEffect(() => {
        const last = previous.current;
        if (!state.levelComplete) {
            setShowCompletion(false);
        } else if (!last.complete || last.levelId !== state.currentLevelId) {
            setShowCompletion(true);
        }
        previous.current = { levelId: state.currentLevelId, complete: state.levelComplete };
    }, [state.levelComplete, state.currentLevelId]);
    return (
        <main className="game-shell" style={{
            '--game-width': `${sessionSize.width}px`,
            '--game-height': `${sessionSize.height}px`,
        }}>
            <ConsoleHeader />
            <MissionStatus state={state}
                helpDisabled={showStart || showHelp || showCompletion}
                restartDisabled={showStart || showHelp || !state.currentLevelId}
                onHelp={() => { onHelpChange(true); setShowHelp(true); }}
                onRestart={() => {
                    setShowHelp(false);
                    setShowCompletion(false);
                    setShowStart(true);
                    onRestartDive();
                }} />
            <div className="viewport-bezel">
                <GameViewport mountGame={mountGame} />
                {showStart && <StartPopup onStart={() => { onStartDive(); setShowStart(false); }} />}
                {showHelp && <StartPopup isHelp onStart={() => { onHelpChange(false); setShowHelp(false); }} />}
                {!showStart && !showHelp && showCompletion && <CompletionPopup onStay={() => setShowCompletion(false)} onNextDive={getNextLevelId(state.currentLevelId) ? () => { setShowCompletion(false); onNextDive(); } : undefined} />}
            </div>
            <aside className="right-rail" aria-hidden="true" />
            <footer className="chassis-trim">
                <div className="vents" aria-hidden="true"><i /><i /><i /><i /></div>
                <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" />{[25, 34, 43].map(y => <path key={y} d={`M 7 ${y} Q 13 ${y - 6} 19 ${y} T 31 ${y} T 43 ${y} T 57 ${y}`} />)}</svg>
                <span>OCEAN RESEARCH DIVISION</span>
                <span className="trim-model">MODEL S-100 ｜ SUBMERSIBLE OPERATIONS CONSOLE</span>
                <div className="vents" aria-hidden="true"><i /><i /><i /><i /></div>
            </footer>
        </main>
    );
}
