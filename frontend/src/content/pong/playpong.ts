import { createGameViewWindow }     from "./ui/view";
import { setupCanvas }              from "./core/canvas";
import { GameController }           from "./controller";
import { getRouteTail }             from "../../router";

export function PlayPong(): HTMLElement {
    // Création de la fenêtre de jeu
    const view = createGameViewWindow();
    // Configuration du canvas Pong
    const context = setupCanvas(view.canvas);

    let tCode = getRouteTail("/playpong") || "";

    const opts: any = { context, view };
    if (tCode) opts.tCode = tCode;

    const controller = new GameController(opts);

    controller.boot();

    return view.root;
}

/*** MEMO **
    var    // antique et dangereux
    let    // moderne et sûr
    const  // encore mieux : valeur non réassignable
 */