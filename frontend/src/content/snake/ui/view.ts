import { el }         from "../../home";
import { createSnakeCanvas } from "../core/canvas";

export interface SnakeViewWindow {
    main: HTMLElement;          // grid 1 col 1 row (pour le moment)
    snakeContainer: HTMLElement; // conteneur relatif (canvas + overlay)
    canvas: HTMLCanvasElement;  // canvas de jeu (zone de dessin)
    overlay: HTMLElement;       // gestion de l'overlay
}

export function createSnakeView(): SnakeViewWindow {
    // 1) main layout: 1 colonne
    const main = el("div", `grid grid-cols-1 gap-4 p-2
        h-full
        place-items-center
        h-[300px]
        lg:h-[420px]
        xl:h-[648px]
        xxl:h-[900px]`); 
    // 2) Stage = conteneur relatif
    const snakeContainer = el("div", `relative flex justify-center items-center
        h-full max-h-full`);
    // Le canvas de jeu
    const canvas = createSnakeCanvas();
    // 3) Overlay = par-dessus le canvas
    const overlayRoot = el("div", "absolute inset-0 grid place-items-center pointer-events-none z-50");
    const overlayContainer = el("div", "pointer-events-auto");

    overlayRoot.append(overlayContainer);
    snakeContainer.append(canvas, overlayRoot);

    // 4) Assemble
    main.append(snakeContainer);

    return {
        main,
        snakeContainer,
        canvas,
        overlay: overlayContainer,
    };
}
