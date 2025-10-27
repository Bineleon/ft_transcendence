import { createGameViewWindow }     from "./ui/pongview";
import { setupCanvas }              from "./core/canvas";
import { gameLoop }                 from "./core/loop";
import { render }                   from "./game/render";
import { update }                   from "./game/update";
import { createState }              from "./game/state";


export function PlayPong(): HTMLElement {
    // Création de la fenêtre de jeu
    const { main, canvas } = createGameViewWindow();

    // Configuration du canvas Pong
    const context = setupCanvas(canvas);

    // Creation de l'état initial du jeu
    const state = createState();

    // const playButton = startGame(canvas, state);
    // Boucle de jeu
    const LoopState = gameLoop((delta) => update(state, delta),
                              (alpha) => render(context, state, alpha),
                            60);

    return main;
}

/*** MEMO **
    var    // antique et dangereux
    let    // moderne et sûr
    const  // encore mieux : valeur non réassignable
 */