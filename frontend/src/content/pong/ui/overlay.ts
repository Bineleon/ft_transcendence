import type { GamePhase, GameState }        from "../game/uiTypes";
import { el, text }                         from "../../home";
import { GameController }                   from "../controller";
import { pongAlert }                        from "../../utils/alertBox.ts"
import { areBothPlayersRegistered }         from "./players";

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
                const b = el("button", "btn-click");
                b.textContent = "START";
                b.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (areBothPlayersRegistered(state)) {
                        this.gameController.setPhase("WAITING");
                    } else {
                        pongAlert("Both players must be set before starting the game.");
                    }
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
                const c = el("div", "text-6xl font-bold font-jmh pointer-events-none");
                c.textContent = String(this.countdownLeft ?? 3);
                return c;
            }
            case "PLAYING": {
                return el("div");
            }
            case "PAUSED": {
                const wrap = el("div", "text-center");
                const b1 = el("button", "btn-click");
                b1.textContent = "RESUME";
                b1.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.gameController.setPhase("COUNTDOWN");
                });
                
                // Only show RESTART button for non-tournament matches
                const isTournamentMatch = !!(state.tournamentCode || state.stats.tournamentCode);
                
                if (!isTournamentMatch) {
                    const b2 = el("button", "btn-click mt-2");
                    b2.textContent = "RESTART";
                    b2.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.gameController.setPhase("RESTART");
                    });
                    wrap.append(b1, b2);
                } else {
                    wrap.append(b1);
                }
                
                return wrap;
            }
            case "GAMEOVER": {
                const wrap = el("div", "text-center");
                const score = el("div", "text-9xl mb-2");
                score.append(
                    text(`${state.stats.p1.score} - ${state.stats.p2.score}`)
                );
                
                // Only show RESTART button for non-tournament matches
                const isTournamentMatch = !!(state.tournamentCode || state.stats.tournamentCode);
                
                if (!isTournamentMatch) {
                    const b = el("button", "btn-click");
                    b.textContent = "RESTART";
                    b.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.gameController.setPhase("RESTART");
                    });
                    wrap.append(score, b);
                } else {
                    wrap.append(score);
                }
                
                return wrap;
            }
            case "SCORED": {
                const wrap = el("div", "text-center");
                const score = el("div", "text-9xl mb-2");
                score.append(
                    text(`${state.stats.p1.score} - ${state.stats.p2.score}`)
                );

                wrap.append(score);
                return wrap;
            }
        }
        return el("div");
    }

    public gamingOverlayMode(canvas: HTMLCanvasElement, phase: GamePhase) {
        // Desactiver souris / clavier lors du jeu
        const isGameActive = (phase === "PLAYING" || phase === "COUNTDOWN");
        
        canvas.style.cursor = isGameActive ? "none" : "default";
        canvas.style.touchAction = isGameActive ? "none" : "auto";
    }

    public setCursorHidden(hidden: boolean): void {
        if (hidden) {
            document.body.classList.add("hide-cursor");
        }
        else {
            document.body.classList.remove("hide-cursor");
        }
    }
}

// Diagramme d’architecture des fonctions :  //
// interface    GameViewWindow------- main: HTMLElement;
//                                  - stage: HTMLElement;
//                                  - canvas: HTMLCanvasElement;
//                                  - terminal: HTMLElement;
//                                  - overlay: HTMLElement
//
// Class        domOverlayManager-------- private gameController: GameController
//  constructor                         - public countdownTimerId: number | null
//  domOverlayManager(GameController)   - public countdownLeft: number
//                                      - public bindHTMLElement(phase: GamePhase, state: GameState): HTMLElement
//                                      - public setCursorHidden(hidden: boolean): void
//
// Class        GameController------------------- public view: GameViewWindow
//  constructor                                 - public context: CanvasRenderingContext2D
//  GameController(opts: {                      - public state: GameState
//      context: CanvasRenderingContext2D;      - public domOverlay: domOverlayManager
//      view: GameViewWindow; })                - private loopCtrl: ReturnType<typeof GameLoop> | null
//                                              - public setPhase(phase: GamePhase): void
//                                              - private startPlaying(): void
//                                              - private pausePlaying(): void
//                                              - private startCountdown(): void
//                                              - private resetGame(): void
//                                              - private attachKeyboardInputs(): void
//                                              - public boot()
//
// Type Gamestate---------------- world:
//                              - ball
//                              - paddles
//                              - phase
//                              - ready
//                              - controls
//
// Type GamePhase = 'START' | 'WAITING' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'RESTART'
//
//
//
// Fonctionnement Global :
// createGameViewWindow()       Retourne une interface GameViewWindow qui contient les éléments HTML nécessaires pour le jeu.
// setupCanvas(view.canvas)     Il prend l'element HTMLCanvasElement et configure son contexte de rendu 2D, il retourne un CanvasRenderingContext2D. (le 'context')
// new GameController({         Crée une instance de GameController en lui passant le 'context' (CanvasRenderingContext2D) et la 'view' (GameViewWindow).
//     context: context,
//     view: view });
//
// Dans le Gamecontroller :     À la construction, il associe à ses propriétés, le contexte de rendu et la vue. Il initialise l'état du jeu, et crée un new domOverlayManager,
//                              qui prend une référence au GameController. Il cree egalement un loopCtrl, qui est un ReturnType de la fonction GameLoop ()
//
// La GameLoop() :              Elle est appellee une seule fois, via la fonction startPlaying() du GameController, qui est elle-même appelée lorsque le jeu passe en phase 'PLAYING'.
//                              Elle retourne une fonction "callback", definie dans le return de GameLoop(), qui est stockée dans la propriété loopCtrl du GameController.
//
// Dans le domOverlayManager :  La méthode bindHTMLElement(phase: GamePhase, state: GameState) retourne un élément HTML différent en fonction de la phase actuelle du jeu.
//                              C'est lui aussi qui "ecoute" les clics bouttons, et change la phase via setPhase() du GameController.








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