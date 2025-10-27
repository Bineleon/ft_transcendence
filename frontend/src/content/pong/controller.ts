import type { GameViewWindow }      from "./ui/pongview";
import { gameLoop }                 from "./core/loop";
import { createState }              from "./game/state";
import { update }                   from "./game/update";
import { render }                   from "./game/render";
import { attachGameInputs }         from "./game/input";
import type { GameState, GamePhase }           from "./game/types";

// On implement carrement une classe en Typescript
// Meme principes qu'en C, sauf que les methodes sont directement dans la classe

export class GameController {
    private state: GameState;
    private loopCtrl: { stop: () => void } | null = null;
    private detachInputs: (() => void) | null = null;
    private context: CanvasRenderingContext2D;
    private overlay: GameViewWindow["overlay"];
    private root: HTMLElement;

    constructor(opts: { context: CanvasRenderingContext2D; overlay: GameViewWindow["overlay"]; root: HTMLElement }) {
        this.context = opts.context;
        this.overlay = opts.overlay;
        this.root = opts.root;
        this.state = createState();
        this.overlay.setOverlayMode(this.state.phase);
    }

    private setPhase(phase: GamePhase) {
        this.state.phase = phase;

        switch (phase) {
            case "START":
                this.overlay.setOverlayMode("START");
                this.overlay.setCursorHidden(false);
                this.stopLoopInputs();
                break;
            case "WAITING":
                this.overlay.setOverlayMode("WAITING");
                this.overlay.setCursorHidden(true);
                this.state.ready.p1 = false;
                this.state.ready.p2 = false;
                this.attachInputs();
                break;
            case "COUNTDOWN":
                this.overlay.setOverlayMode("COUNTDOWN");
                this.overlay.setCursorHidden(true);
                this.overlay.countdown(3, () => this.setPhase("PLAYING"));
                break;
            case "PLAYING":
                this.overlay.setOverlayMode("PLAYING");
                this.overlay.setCursorHidden(true);
                this.startLoop();
                break;
            case "PAUSED":
                this.overlay.setOverlayMode("PAUSED");
                this.overlay.setCursorHidden(false);
                this.stopLoopOnly();
                break;
            case "GAMEOVER":
                this.overlay.setOverlayMode("GAMEOVER");
                this.overlay.setCursorHidden(false);
                this.stopLoopInputs();
                break;
        }

    }

    boot()        {
        this.setPhase("START");
        this.wireView();
    }

    private wireView() {
        this.overlay.onPlay(() => this.start());
        this.overlay.onPauseClick(() => {
            if (this.state.phase === "PLAYING") {
                this.pause();
            } else if (this.state.phase === "PAUSED") {
                this.resume();
            }
        });
    }

    start()       { this.setPhase("WAITING"); }
    countdown()   { this.setPhase("COUNTDOWN"); }
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