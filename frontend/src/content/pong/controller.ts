import type { GameViewWindow }           from "./ui/view";
import { GameLoop }                      from "./core/loop";
import { initState, initBoard, launchBall, initPlayersInfo, resetGameStats } from "./game/state";
import { update, type CardinalDirection }                    from "./game/update";
import { render }                        from "./game/render";
import type { GamePhase, GameState,
    Controls, PlayerInfo, PlayerId, MatchStats } from "./game/uiTypes";
import type { ApiMatchStatsDTO, ApiFinishMatchDTO, ApiPlayedMatchDTO, ApiPlayerStatsDTO }         from "../tournament/apiTypes";
import { domOverlayManager }             from "./ui/overlay";
import { createGameGuards }              from "./ui/guards";
import type { GameGuards }               from "./ui/guards";
import { createPongStatsPanel }          from "./ui/terminal";
import { createPlayersBox, resetPlayersCache } from "./ui/players";
import { finishMatch, createMatchWithStats }                    from "../utils/todb"
import { liveStatsToMatchStats, fromMatchStatsToApiMatchStatsDTO,
    fromPlayerMatchStatsToApiPlayerStatsBase } from "../tournament/mapper";
import { pongAlert }                    from "../utils/alertBox";

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

///////// CONSTRUCTEUR /////////
    constructor(opts: { context: CanvasRenderingContext2D; view: GameViewWindow, tCode?: string }) {
        this.context = opts.context;
        this.view = opts.view;
        this.terminal = this.view.terminal;
        this.state = initState(opts.tCode);
        this.domOverlay = new domOverlayManager(this);
        this.gameGuards = createGameGuards(this.view.canvas);

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

        case "START":
            if (code === c.escape.code) {
                // Allow returning to home page from START screen
                this.unwireControls();
            }
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
        // this.view.playersBox.replaceChildren(createPlayersBox(this.state));

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

            launchBall(this.state, this.getNextServer(this.state), 1000);
            break;

        case "RESTART":
            // Clean up any running timers
            if (this.domOverlay.countdownTimerId !== null) {
                clearInterval(this.domOverlay.countdownTimerId);
                this.domOverlay.countdownTimerId = null;
            }

            // Stop the game loop if running
            if (this.loopCtrl && this.loopCtrl.running) {
                this.loopCtrl.stop();
            }

            // Reset all game stats (scores, timers, ready states, etc.)
            // This preserves tournament information (tournamentCode, matchId, etc.)
            resetGameStats(this.state);

            // Reset board (ball and paddles positions)
            initBoard(this.state);

            // Launch ball for next game
            launchBall(this.state, this.getNextServer(this.state), 1000);

            // Refresh UI
            this.refreshTerminal();
            this.view.playersBox.replaceChildren(createPlayersBox(this.state));

            // Go to WAITING phase
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
            this.startRallyTime();
            this.wireControls();
            this.startPlaying();
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );

            break;

        case "PAUSED":
            this.pauseRallyTime();
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

            this.handleStats();
            this.resetGame();
            break;

        case "SCORED":
            this.stopRallyTime();
            this.pausePlaying();
            this.scoredCountdown();
            initBoard(this.state);
            launchBall(this.state, this.getNextServer(this.state), 1000);
            this.view.overlay.replaceChildren(
                this.domOverlay.bindHTMLElement(phase, this.state)
            );
            break;
        }
    }

    // STATE & STATS ACTIONS
    private startRallyTime() {
        this.state.stats.rallyStartAt = performance.now();
        if (this.state.stats.pauseStartAt !== undefined) this.endPauseRallyTime();
    }

    private stopRallyTime() {
        const now = performance.now();
        const rallyStart = this.state.stats.rallyStartAt;
        if (rallyStart == null) return;
        const time = now - rallyStart;

        this.state.stats.rallyDurationsMs.push(time);
        this.state.stats.rallyStartAt = undefined;

        this.state.stats.totalRallies += 1;
        if (this.state.stats.lastScorer === "p1") {
            const p1 = this.state.stats.p1;
            const p2 = this.state.stats.p2;

            if (p1.fastestWonRally === 0 || time < p1.fastestWonRally) p1.fastestWonRally = time;
            if (p2.fastestLostRally === 0 || time < p2.fastestLostRally) p2.fastestLostRally = time;
        }

        if (this.state.stats.lastScorer === "p2") {
            const p1 = this.state.stats.p1;
            const p2 = this.state.stats.p2;

            if (p2.fastestWonRally === 0 || time < p2.fastestWonRally) p2.fastestWonRally = time;
            if (p1.fastestLostRally === 0 || time < p1.fastestLostRally) p1.fastestLostRally = time;
        } 
    }

    private pauseRallyTime() {
        this.state.stats.pauseStartAt = performance.now();
    }

    private endPauseRallyTime() {
        if (this.state.stats.pauseStartAt === undefined) return;

        const now = performance.now();
        const elapsed = now - this.state.stats.pauseStartAt;

        this.state.stats.totalPauseMs += elapsed;
        this.state.stats.pauseStartAt = undefined;
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
            this.state.p1 = info ? info : { id: "", userName: "P1", avatarUrl: "" };
        } else {
            this.state.p2 = info ? info : { id: "", userName: "P2", avatarUrl: "" };
        }
    }

    public clearPlayers(): void {
        this.state.p1 = { id: "", userName: "P1", avatarUrl: "" };
        this.state.p2 = { id: "", userName: "P2", avatarUrl: "" };
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
        // initBoard(this.state);
        // this.context = setupCanvas(this.view.canvas);
    }

    // ----- Envoi des stats au backend ----- //
    private async handleStats() {
        const stats: MatchStats = liveStatsToMatchStats(this.state.stats);
        const apiMatchStats: ApiMatchStatsDTO = fromMatchStatsToApiMatchStatsDTO(stats);
        const tCode: string | undefined = this.state.stats.tournamentCode || undefined;

        const p1Base = fromPlayerMatchStatsToApiPlayerStatsBase(stats.p1);
        const p2Base = fromPlayerMatchStatsToApiPlayerStatsBase(stats.p2);

        if (this.state.p1.id) {
            p1Base.userId = this.state.p1.id;
        }
        if (this.state.p2.id) {
            p2Base.userId = this.state.p2.id;
        }
        if (tCode && this.state.matchId) {
            const matchId = this.state.matchId;
            const payload: ApiFinishMatchDTO = {
                matchStats: apiMatchStats,
                p1Stats: p1Base,
                p2Stats: p2Base,
            }
            console.log("Payload FinishMatch :", payload);
            try {
                await finishMatch(matchId, tCode, payload);
            } catch (e) {
                console.error("HandleStats DOWN:", e);
                pongAlert("Error while saving match stats", "error");
            }        
        } else {
            const payload: ApiPlayedMatchDTO = {
                p1Username: stats.p1.userName,
                p2Username: stats.p2.userName,
                p1IsGuest: this.state.stats.p1.isGuest,
                p2IsGuest: this.state.stats.p2.isGuest,
                matchStats: apiMatchStats,
                p1Stats: p1Base as ApiPlayerStatsDTO,
                p2Stats: p2Base as ApiPlayerStatsDTO,
            }
            console.log("Payload CreateMatchWithStats :", payload);
            await createMatchWithStats(payload);
        }
    }

    public boot() {
        this.setPhase("START");
    }
}