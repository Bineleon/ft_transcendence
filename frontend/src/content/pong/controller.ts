import type { GameViewWindow}       from "./ui/pongview";
import { gameLoop }                 from "./core/loop";
import { createState }              from "./game/state";
import { update }                   from "./game/update";
import { render }                   from "./game/render";
import { attachGameInputs }         from "./game/input";
import type { GameState, GamePhase } from "./game/types";


// On implement carrement une classe en Typescript
// Meme principes qu'en C, sauf que les methodes sont directement dans la classe
export class GameController {
    private root: HTMLElement;
    private context: CanvasRenderingContext2D;
    private overlay: GameViewWindow["overlay"];
    private state: GameState;
    private loopCtrl: { stop: () => void } | null = null;
    private detachInputs: (() => void) | null = null;
    private countdownTimer: number | null = null;

    constructor(opts: { context: CanvasRenderingContext2D; overlay: GameViewWindow["overlay"]; root: HTMLElement }) {
        this.context = opts.context;
        this.overlay = opts.overlay;
        this.root = opts.root;
        this.state = createState();
    }

    private setPhase(phase: GamePhase) {
        // Timer Reset si on quitte le COUNTDOWN
        if (phase !== "COUNTDOWN" && this.countdownTimer !== null) {
            window.clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        this.state.phase = phase;

        switch (phase) {
            case "START":
                this.stopLoopInputs();
                this.overlay.applyOverlay({
                    phase,
                    cursorHidden: false,
                    showStart: true,
                    showPause: false,
                });
                break;
                
            case "WAITING":
                this.stopLoopInputs();
                this.overlay.applyOverlay({
                    phase,
                    cursorHidden: true,
                    showStart: false,
                    showPause: false,
                    p1Ready: this.state.ready.p1,
                    p2Ready: this.state.ready.p2,
                });
                this.attachInputs();
                break;
                
            case "COUNTDOWN":
                this.stopLoopInputs();
                this.overlay.applyOverlay({
                    phase,
                    cursorHidden: true,
                    showStart: false,
                    showPause: false,
                    countdown: { secondsLeft: 3 },
                });
                this.attachInputs();
                break;
                
            case "PLAYING":
                this.startLoop();
                this.overlay.applyOverlay({
                    phase,
                    cursorHidden: true,
                    showStart: false,
                    showPause: true,
                });
                break;
                
            case "PAUSED":
                this.stopLoopOnly();
                this.overlay.applyOverlay({
                    phase,
                    cursorHidden: false,
                    showStart: false,
                    showPause: true,
                });
                break;
                
            case "GAMEOVER":
                this.stopLoopInputs();
                this.overlay.applyOverlay({
                    phase,
                    cursorHidden: false,
                    showStart: false,
                    showPause: false,
                });
                break;
        }

    }

    boot()        {
        this.setPhase("START");
        this.wireView();
    }

    private wireView() {
        this.overlay.onPlay(() => {
            if (this.state.phase === "PAUSED") {
                this.resume();
            } else {
                this.start();
            }
        });
        this.overlay.onPause(() => {
            if (this.state.phase === "PLAYING") this.pause();
            else if (this.state.phase === "PAUSED") this.resume();
        });
    }

    start()       { this.setPhase("WAITING"); }

    countdown()   {
        const total = 3;
        let remaining = total;
        this.setPhase("COUNTDOWN");
        // met à jour immédiatement l'affichage (setPhase a déjà mis 3)
        // démarre interval
        if (this.countdownTimer !== null) window.clearInterval(this.countdownTimer);
        this.countdownTimer = window.setInterval(() => {
            remaining -= 1;
            if (remaining >= 0) {
                this.overlay.applyOverlay({
                    phase: "COUNTDOWN",
                    countdown: { secondsLeft: remaining }
                });
            }
            if (remaining <= 0) {
                // clear et lancer le jeu
                if (this.countdownTimer !== null) {
                    window.clearInterval(this.countdownTimer);
                    this.countdownTimer = null;
                }
                this.play();
            }
        }, 1000);
    }


    play()        { this.setPhase("PLAYING"); }
    pause()       { this.setPhase("PAUSED"); }
    resume()      { this.countdown(); } // ou direct PLAYING si tu veux instantané
    gameOver()    { this.setPhase("GAMEOVER"); }


    private attachInputs() {
    this.detachInputs = attachGameInputs(this.state, {
        root: this.root,
        onBothReady: () => this.countdown(),
        onPause: () => this.pause(),
        onResume: () => this.resume(),
        onReadyChange: () => {
            // redraw waiting overlay with current ready flags
            if (this.state.phase === "WAITING") {
                this.overlay.applyOverlay({
                    phase: "WAITING",
                    p1Ready: this.state.ready.p1,
                    p2Ready: this.state.ready.p2,
                });
            }
        }
    });
    }

    private startLoop() {
    if (this.loopCtrl) return;
    this.loopCtrl = gameLoop(
        (dt)   => update(this.state, dt),
        (acc)  => render(this.context, this.state, acc),
        60
    );
    }

    private stopLoopOnly() {
    if (this.loopCtrl) { this.loopCtrl.stop(); this.loopCtrl = null; }
    }

    private stopLoopInputs() {
    this.stopLoopOnly();
    if (this.detachInputs) { this.detachInputs(); this.detachInputs = null; }
    }

    getState() {
        return this.state;
    }
}