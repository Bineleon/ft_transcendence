import type { GameViewWindow}           from "./ui/pongview";
import { GameLoop }                     from "./core/loop";
import { initState }                    from "./game/state";
import { update }                       from "./game/update";
import { render }                       from "./game/render";
import { attachGameInputs }             from "./game/input";
import type { GamePhase, GameState }    from "./game/types";
import { domOverlayManager }            from "./ui/overlay";
import { setupCanvas }                  from "./core/canvas";

// On implement carrement une classe en Typescript
// Meme principes qu'en C, sauf que les methodes sont directement dans la classe
export class GameController {
    public view: GameViewWindow;
    public context: CanvasRenderingContext2D;
    public state: GameState;
    public domOverlay: domOverlayManager;
    private loopCtrl: ReturnType<typeof GameLoop> | null = null;

    constructor(opts: { context: CanvasRenderingContext2D; view: GameViewWindow }) {
        this.context = opts.context;
        this.view = opts.view;
        this.state = initState();
        this.domOverlay = new domOverlayManager(this);
    }

    public setPhase(phase: GamePhase) {
        this.state.phase = phase;
        switch (phase) {
            case "START":
                this.resetGame();
                this.domOverlay.setCursorHidden(false);
                this.view.overlay.replaceChildren(this.domOverlay.bindHTMLElement(phase, this.state));
                break;

            case "RESTART":
                this.resetGame();
                this.domOverlay.setCursorHidden(true);
                this.attachKeyboardInputs();
                this.setPhase("WAITING");
                break;
                
            case "WAITING":
                this.domOverlay.setCursorHidden(true);
                this.attachKeyboardInputs();
                this.view.overlay.replaceChildren(this.domOverlay.bindHTMLElement(phase, this.state));
                break;

            case "COUNTDOWN":
                this.domOverlay.setCursorHidden(true);
                this.startCountdown();
                this.view.overlay.replaceChildren(this.domOverlay.bindHTMLElement(phase, this.state));
                break;

            case "PLAYING":
                this.domOverlay.setCursorHidden(true);
                this.startPlaying();
                this.view.overlay.replaceChildren(this.domOverlay.bindHTMLElement(phase, this.state));
                break;

            case "PAUSED":
                this.pausePlaying();
                this.domOverlay.setCursorHidden(false);
                this.view.overlay.replaceChildren(this.domOverlay.bindHTMLElement(phase, this.state));
                break;

            case "GAMEOVER":
                this.resetGame();
                this.domOverlay.setCursorHidden(false);
                this.view.overlay.replaceChildren(this.domOverlay.bindHTMLElement(phase, this.state));
                break;
        }
    }

    private startPlaying() {
        if (!this.loopCtrl) {
            this.loopCtrl = GameLoop(
                (delta) => update(this.state, delta),
                (acc) => render(this.context, this.state, acc),
                60,
                true
            );
        }
        if (!this.loopCtrl.running) {
            this.loopCtrl.start();
        }
    }

    private pausePlaying() {
        if (this.loopCtrl && this.loopCtrl.running) {
            this.loopCtrl.stop();
        }
    }


    private startCountdown() {
        let secsLeft = 3;


        if (this.domOverlay.countdownTimerId !== null) {
            window.clearInterval(this.domOverlay.countdownTimerId);
        }

        this.domOverlay.countdownLeft = secsLeft;
        this.view.overlay.replaceChildren(this.domOverlay.bindHTMLElement("COUNTDOWN", this.state));

        this.domOverlay.countdownTimerId = window.setInterval(() => {
            secsLeft -= 1;
            if (secsLeft <= 0) {
                if (this.domOverlay.countdownTimerId !== null) {
                    window.clearInterval(this.domOverlay.countdownTimerId);
                    this.domOverlay.countdownTimerId = null;
                }
                this.setPhase("PLAYING");
                return;
            }

            this.domOverlay.countdownLeft = secsLeft;
            this.view.overlay.replaceChildren(this.domOverlay.bindHTMLElement("COUNTDOWN", this.state));
        }, 1000);
    }

    public attachKeyboardInputs() {
        attachGameInputs(this);
    }

    private resetGame() {
        if (this.loopCtrl) {
            this.loopCtrl.stop();
            this.loopCtrl = null;
        }
        this.state = initState();
        this.context = setupCanvas(this.view.canvas);
    }

    public boot() {
        this.setPhase("START");
    }
}

