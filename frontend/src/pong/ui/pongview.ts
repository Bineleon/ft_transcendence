import { el, text } from "../home";

// Structure de la fenêtre de jeu Pong avec ratio 36:16
export interface GameViewWindow {
    main: HTMLElement;
    bigBox: HTMLElement;
    left: HTMLElement;
    right: HTMLElement;
    canvas: HTMLCanvasElement;
}

export function createGameViewWindow(): GameViewWindow {
    // Le conteneur principal — no viewport-fixed heights so it fits the parent block
    const main = el("main",
        "relative flex items-center justify-center w-full");

    // Definition du Ratio GLOBAL ici (on adapte le nombre de "parts" aux proportions souhaitées, dans les enfants)
    const bigBox = el("div",
        "w-full max-w-full overflow-hidden") as HTMLElement;
    bigBox.style.aspectRatio = "36/16";
    
    // On construit une autre div pour gérer les proportions internes
    const row = el("div",
        "flex flex-row items-stretch justify-between w-full h-full gap-0");

    // Gauche
    const left = el("div",
        "relative border-8 border-black overflow-hidden h-full") as HTMLElement;
    left.style.width = "72.222222%";    // 26/36
    left.style.height = "100%";

    // le spacer
    const spacer = el("div", "");
    spacer.style.width = "2.941176%";   // 1/36
    spacer.style.height = "100%";

    // Droite
    const right = el("div",
        "relative bg-[url('/public/imgs/trame2.png')] bg-cover bg-center overflow-hidden flex flex-col items-center justify-center h-full") as HTMLElement;
    right.style.width = "26.470588%";   // 9/36
    right.style.height = "100%";

    // Le canvas de jeu
    const pongGame = el("canvas",
        "absolute inset-0 w-full h-full block") as HTMLCanvasElement;
    left.append(pongGame);

    // Futur contenu de droite
    const terminal = el("div",
        "absolute inset-0 grid place-items-center font-ocean-type text-white text-center p-4");
    terminal.append(text("Pong Game Terminal\n\n[Game instructions and info will appear here...]"));
 
    right.append(terminal);
    row.append(left, spacer, right);
    bigBox.append(row);
    main.append(bigBox);
    
    return {
        main,
        bigBox,
        left,
        right,
        canvas: pongGame,
    };
}