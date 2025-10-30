import type { GamePhase, GameState }        from "../game/types";
import { el, text }                         from "../../home";
import { GameController }                   from "../controller";

export class domOverlayManager {
    private gameController: GameController;
    public countdownTimerId: number | null = null;
    public countdownLeft: number = 3;

    constructor(gameController: GameController) {
        this.gameController = gameController;
    }

    public bindHTMLElement(phase: GamePhase, state: GameState): HTMLElement {
        switch (phase) {
            case "START": {
                const b = el("button", "px-4 py-2 border pointer-events-auto hover:bg-white/100");
                b.textContent = "START";
                b.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.gameController.setPhase("WAITING");
                });
                return b;
            }
            case "WAITING": {
                const wrap = el("div", "text-center");
                const lbl = el("div", "text-xl mb-2");
                lbl.append(text("Waiting players…"));

                const status = el("div", "text-sm");
                status.append(
                    text(`P1 Ready: ${state.ready.p1 ? "✅" : "❌"} | P2 Ready: ${state.ready.p2 ? "✅" : "❌"}`)
                );
                wrap.append(lbl, status);

                return wrap;
            }
            case "COUNTDOWN": {
                const c = el("div", "text-6xl font-bold pointer-events-none");
                c.textContent = String(this.countdownLeft ?? 3);
                return c;
            }
            case "PLAYING": {
                return el("div");
            }
            case "PAUSED": {
                const wrap = el("div", "text-center");
                const b1 = el("button", "px-4 py-2 border pointer-events-auto hover:bg-white/100");
                b1.textContent = "RESUME";
                b1.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.gameController.setPhase("COUNTDOWN");
                });
                const b2 = el("button", "px-4 py-2 border pointer-events-auto hover:bg-white/100 mt-2");
                b2.textContent = "RESTART";
                b2.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.gameController.setPhase("RESTART");
                });
                wrap.append(b1, b2);
                return wrap;
            }
            case "GAMEOVER": {
                const b = el("button", "px-4 py-2 border pointer-events-auto hover:bg-white/100");
                b.textContent = "RESTART";
                b.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.gameController.setPhase("RESTART");
                });
                return b;
            }
        }
        return el("div");
    }

    public setCursorHidden(hidden: boolean): void {
        if (hidden) {
            document.body.style.cursor = 'none';
        }
        else {
            document.body.style.cursor = 'default';
        }
    }
}

// Functions architecture :
// interface GameViewWindow------ main: HTMLElement;
//                              - stage: HTMLElement;
//                              - canvas: HTMLCanvasElement;
//                              - terminal: HTMLElement;
//                              - overlay: OverlayManager---- bindHTMLElement(phase, state): HTMLElement
//                                                          - setCursorHidden(hidden): void
//                                                          - showStartButton(show): void
//                                                          - showPauseButton(show): void
//                                                          - showRestartButton(show): void
//                                                          - onPlay(callback): void
//                                                          - onPause(callback): void
//                                                          - secsLeft: number | null
//                                                                    |           
// class GameController     - root: HTMLElement                       |
//                          - context: CanvasRenderingContext2D       |
//                          - overlay: OverlayManager------------------
//                          - state: GameState--------------- world
//                                                          - ball
//                                                          - paddles
//                                                          - phase
//                                                          - ready
//                                                          - controls
//                          - setPhase(phase: GamePhase): void
//                          - attachKeyboardInputs(): void
//                          - startCountdown(): void
//                          - restartGame(): void



// // Types, interfaces et classes en synergie // //
// Voici comment ces concepts peuvent interagir de manière bénéfique :
//
// Types pour la sécurité des données : En utilisant des types, vous assurez que vos données sont correctement typées.
// Cela réduit les erreurs de type à l’exécution et améliore la lisibilité de votre code.

// Interfaces pour la structuration : Les interfaces définissent la forme des objets et des contrats. En les utilisant,
// vous définissez clairement ce que vous attendez des objets et créez une documentation en temps réel pour les développeurs qui travaillent
// avec votre code.

// Classes pour l’encapsulation et la modélisation : Les classes vous permettent de créer des structures de données complexes
// en encapsulant la logique et les données. Elles rendent votre code modulaire, réutilisable et maintenable.