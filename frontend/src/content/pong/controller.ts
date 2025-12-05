import type { GameViewWindow }           from "./ui/view";
import { GameLoop }                      from "./core/loop";
import { initState, initBoard, launchBall, initPlayersInfo } from "./game/state";
import { update, type CardinalDirection }                    from "./game/update";
import { render }                        from "./game/render";
import type {
    GamePhase,
    GameState,
    Controls,
    PlayerInfo,
    PlayerId,
    PlayersStats, // 👈 ajouté
} from "./game/types";
import { domOverlayManager }             from "./ui/overlay";
import { createGameGuards }              from "./ui/guards";
import { setupCanvas }                   from "./core/canvas";
import type { GameGuards }               from "./ui/guards";
import { createPongStatsPanel }          from "./ui/terminal";
import { createPlayersBox, resetPlayersCache } from "./ui/players";
import type { Tournament }               from "../tournament/uiTypes";

// On implement carrement une classe en Typescript
// Meme principes qu'en C, sauf que les methodes sont directement dans la classe
export class GameController {
    ///////// ATTRIBUTS /////////
    public view: GameViewWindow;
    public context: CanvasRenderingContext2D;
    public state: GameState;
    public domOverlay: domOverlayManager;
    private loopCtrl: ReturnType<typeof GameLoop> | null = null;
    private gameGuards: GameGuards;
    public terminal: HTMLElement;
    public pongControls: Controls = {
        p1Up:   { code: "KeyW",         down: false },
        p1Down: { code: "KeyS",         down: false },
        p2Up:   { code: "ArrowUp",      down: false },
        p2Down: { code: "ArrowDown",    down: false },
        pause:  { code: "Space",        down: false },
        escape: { code: "Escape",       down: false }
    };
    private tournament: Tournament | undefined;

    ///////// CONSTRUCTEUR /////////
    constructor(opts: { context: CanvasRenderingContext2D; view: GameViewWindow; t?: Tournament }) {
        this.context = opts.context;
        this.view = opts.view;
        this.terminal = this.view.terminal;
        this.state = initState();
        this.domOverlay = new domOverlayManager(this);
        this.gameGuards = createGameGuards(this.view.canvas);
        this.tournament = opts.t || undefined;

        document.addEventListener("playersUpdated", this.onPlayersUpdated);
    }

    ///////// METHODES /////////
    // -----  Gestion du Clavier  ----- //
    private onKeyDown = (e: KeyboardEvent) => {
        // if (e.repeat) return;
        const { code } = e;
        const c = this.pongControls;

        if (code === c.p1Up.code)   c.p1Up.down = true;
        if (code === c.p1Down.code) c.p1Down.down = true;
        if (code === c.p2Up.code)   c.p2Up.down = true;
        if (code === c.p2Down.code) c.p2Down.down = true;
        if (code === c.pause.code)  c.pause.down = true;
        if (code === c.escape.code) c.escape.down = true;

        // --- Logiques simples ---
        switch (this.state.phase) {
        case "WAITING":
            if (code === c.p1Up.code) {
                this.state.ready.p1 = true;
                this.view.overlay.replaceChildren(
                    this.domOverlay.bindHTMLElement("WAITING", this.state)
                );
            }
            if (code === c.p2Up.code) {
                this.state.ready.p2 = true;
                this.view.overlay.replaceChildren(
                    this.domOverlay.bindHTMLElement("WAITING", this.state)
                );
            }
            if (this.state.ready.p1 && this.state.ready.p2) this.setPhase("COUNTDOWN");
            break;

        case "PLAYING":
            if (code === c.pause.code) this.setPhase("PAUSED");
            break;

        case "COUNTDOWN":
            if (code === c.pause.code) this.setPhase("PAUSED");
            break;

        case "SCORED":
            if (code === c.pause.code) this.setPhase("PAUSED");
            break;

        case "PAUSED":
            if (code === c.pause.code) this.setPhase("COUNTDOWN");
            break;
        }
    };

    private onKeyUp = (e: KeyboardEvent) => {
        const { code } = e;
        const c = this.pongControls;
        if (code === c.p1Up.code)   c.p1Up.down = false;
        if (code === c.p1Down.code) c.p1Down.down = false;
        if (code === c.p2Up.code)   c.p2Up.down = false;
        if (code === c.p2Down.code) c.p2Down.down = false;
        if (code === c.pause.code)  c.pause.down = false;
        if (code === c.escape.code) c.escape.down = false;
    };

    private clearKeys() {
        for (const k in this.pongControls) {
            (this.pongControls as any)[k].down = false;
        }
    }

    private wireControls() {
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", () => this.clearKeys());
    }

    private unwireControls() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        this.clearKeys();
    }

    private refreshTerminal() {
        this.view.terminal.replaceChildren(createPongStatsPanel(this.state));
    }

    private onPlayersUpdated = (_e: Event) => {
        this.refreshTerminal();
    };

    // -----  Gestion des Phases de Jeu  ----- //
    public setPhase(phase: GamePhase) {
        if (this.state.phase !== "COUNTDOWN") this.state.PrevPhase = this.state.phase;
        this.state.phase = phase;

        this.terminal.replaceChildren(createPongStatsPanel(this.state));
        this.view.playersBox.replaceChildren(createPlayersBox(this.state));

        if (phase === "PLAYING" || phase === "COUNTDOWN" || phase === "SCORED") {
            this.gameGuards.enable();
        } else {
            this.gameGuards.disable();
        }

        this.domOverlay.gamingOverlayMode(this.view.canvas, phase);

        if (phase === "PAUSED") {
            if (this.domOverlay.countdownTimerId !== null) {
                clearInterval(this.domOverlay.countdownTimerId);
                this.domOverlay.countdownTimerId = null;
            }
            (document.activeElement as HTMLElement)?.blur();
        }

        switch (phase) {
        case "START":
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );
            this.unwireControls();

            resetPlayersCache();
            initBoard(this.state);
            initPlayersInfo(this.state);

            this.view.playersBox.replaceChildren(createPlayersBox(this.state));
            launchBall(this.state, this.getNextServer(this.state), 500);
            break;

        case "RESTART":
            initBoard(this.state);
            this.setPhase("WAITING");
            break;

        case "WAITING":
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );
            this.wireControls();
            break;

        case "COUNTDOWN":
            this.startCountdown();
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );
            if (this.state.PrevPhase === "PAUSED") break;
            break;

        case "PLAYING":
            this.wireControls();
            this.startPlaying();
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );
            break;

        case "PAUSED":
            this.pausePlaying();
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );
            break;

        case "GAMEOVER":
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );
            this.unwireControls();

            // 👇 Envoi des stats au backend (PlayersStats seulement)
            void this.sendMatchStats();

            this.resetGame();
            break;

        case "SCORED":
            this.pausePlaying();
            this.scoredCountdown();
            initBoard(this.state);
            launchBall(this.state, this.getNextServer(this.state), 500);
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );
            break;
        }
    }

    private getNextServer(state: GameState): CardinalDirection {
        const last = state.stats.lastScorer;
        if (last === "p1") return "SE";
        if (last === "p2") return "SO";
        // pas encore de point -> serveur random
        const r = Math.random();
        if (r < 0.5) return "SE";
        return "SO";
    }

    public setPlayer(id: PlayerId, info: PlayerInfo | null): void {
        if (id === "p1") {
            this.state.p1 = info ? info : { userName: "P1", avatarUrl: "" };
        } else {
            this.state.p2 = info ? info : { userName: "P2", avatarUrl: "" };
        }
    }

    public clearPlayers(): void {
        this.state.p1 = { userName: "P1", avatarUrl: "" };
        this.state.p2 = { userName: "P2", avatarUrl: "" };
    }

    // ----  Actions sur le Jeu  ----- //
    private startPlaying() {
        if (!this.loopCtrl) {
            this.loopCtrl = GameLoop(
                (delta) => update(this, delta),
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

    private scoredCountdown() {
        let secsLeft = 2;

        if (this.domOverlay.countdownTimerId !== null) {
            window.clearInterval(this.domOverlay.countdownTimerId);
        }

        this.domOverlay.countdownLeft = secsLeft;
        this.view.overlay.replaceChildren(
            this.domOverlay.bindHTMLElement("SCORED", this.state)
        );

        this.domOverlay.countdownTimerId = window.setInterval(() => {
            secsLeft -= 1;
            if (secsLeft <= 0) {
                if (this.domOverlay.countdownTimerId !== null) {
                    window.clearInterval(this.domOverlay.countdownTimerId);
                    this.domOverlay.countdownTimerId = null;
                }
                this.setPhase("COUNTDOWN");
                return;
            }
        }, 1000);
    }

    private startCountdown() {
        let secsLeft = 3;

        if (this.domOverlay.countdownTimerId !== null) {
            window.clearInterval(this.domOverlay.countdownTimerId);
        }

        this.domOverlay.countdownLeft = secsLeft;
        this.view.overlay.replaceChildren(
            this.domOverlay.bindHTMLElement("COUNTDOWN", this.state)
        );

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
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement("COUNTDOWN", this.state)
            );
        }, 1000);
    }

    private resetGame() {
        if (this.loopCtrl) {
            this.loopCtrl.stop();
            this.loopCtrl = null;
        }
        this.state = initState();
        this.context = setupCanvas(this.view.canvas);
    }

    // ----- Envoi des stats au backend ----- //
    private async sendMatchStats() {
        // On suppose que this.state.stats correspond à PlayersStats
        const stats = this.state.stats as PlayersStats;

        try {
            const res = await fetch("/api/matches/stats", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // pour envoyer les cookies JWT
                body: JSON.stringify(stats), // 👉 uniquement PlayersStats
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.error(
                    "[GameController] Failed to send match stats",
                    res.status,
                    text
                );
            }
        } catch (err) {
            console.error("[GameController] Error while sending match stats", err);
        }
    }

    public boot() {
        this.setPhase("START");
    }
}
