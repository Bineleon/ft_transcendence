import { createGameViewWindow }     from "./ui/pongview";
import { setupCanvas }              from "./core/canvas";
import { GameController }           from "./controller";



export function PlayPong(): HTMLElement {
    // Création de la fenêtre de jeu
    const view = createGameViewWindow();

    // Configuration du canvas Pong
    const context = setupCanvas(view.canvas);

    // Configuration de l'overlay
    const controller = new GameController({ 
        root: view.main,
        context: context,
        overlay: view.overlay,
    });

    controller.boot();

    return view.main;
}

/*** MEMO **
    var    // antique et dangereux
    let    // moderne et sûr
    const  // encore mieux : valeur non réassignable
 */