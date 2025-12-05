import { createGameViewWindow }     from "./ui/view";
import { setupCanvas }              from "./core/canvas";
import { GameController }           from "./controller";
import type { Tournament }               from "../tournament/uiTypes";

export function PlayPong(t?: Tournament): HTMLElement {
    // Création de la fenêtre de jeu
    const view = createGameViewWindow();
    // Configuration du canvas Pong
    const context = setupCanvas(view.canvas);

    // Configuration de l'overlay
    const controller = new GameController({ context, view, t});

    controller.boot();

    return view.root;
}

/*** MEMO **
    var    // antique et dangereux
    let    // moderne et sûr
    const  // encore mieux : valeur non réassignable
 */