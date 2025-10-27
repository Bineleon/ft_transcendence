import { el, text } from "../../home";
import type { GamePhase } from "../game/types";

export interface OverlayMode {
        setOverlayMode: (mode: GamePhase) => void;
        onPlay: (cb: () => void) => void;
        onPauseClick: (cb: () => void) => void;
        setCursorHidden: (hidden: boolean) => void;
        showPauseButton: (showBtn: boolean) => void;
        showStartButton?: (showBtn: boolean) => void;
        countdown: (seconds: number, done: () => void) => void;
    };

export interface GameViewWindow {
    main: HTMLElement;
    bigBox: HTMLElement;
    left: HTMLElement;
    right: HTMLElement;
    canvas: HTMLCanvasElement;
    overlay: OverlayMode;
}

export function createGameViewWindow(): GameViewWindow {
    // Le conteneur principal - pas de 'dvh' ou 'vh' pour que ça s'adapte au bloc parent
    const main = el("main",
        "relative flex items-center justify-center w-full");

    // Le canvas de jeu
    const pongCanvas = el("canvas",
        "absolute inset-0 w-full h-full block") as HTMLCanvasElement;
    main.append(pongCanvas);

    const overlay = el("div",
        "absolute inset-0 grid place-items-center pointer-events-none z-50");
    
    // Puis contenur de l'overlay :
    const overlayBox = el("div",
        "pointer-events-auto flex flex-col items-center gap-4");

    const startButton = el("button",
        "p-8 text-3xl font-bold bg-white/90 hover:bg-white transition") as HTMLButtonElement;
    startButton.append(text("START"));

    const waiting = el("div",
        "hidden bg-white/85 text-black p-6 text-center space-y-2");
    waiting.append(
        el("div", "text-2xl font-bold",),
        el("div", "",),
        el("div", "",));
    waiting.children[0].append(text("P1 and P2, get ready!"));
    waiting.children[1].append(text("waiting for player 1..."));
    waiting.children[2].append(text("waiting for player 2..."));

    const count = el("div",
        "hidden bg-white/85 text-black p-6 text-center text-6xl font-bold");
    count.append(text("3"));

    overlayBox.append(startButton, waiting, count);
    overlay.append(overlayBox);
    main.append(overlay);

    const pauseButton = el("button",
        "hidden absolute top-3 right-3 px-8 py-4 text-3xl font-bold bg-white/90 hover:bg-white transition" ) as HTMLButtonElement;
    pauseButton.append(text("PAUSE"));
    main.append(pauseButton);

    function hide(e: HTMLElement) { e.classList.add("hidden"); }
    function show(e: HTMLElement) { e.classList.remove("hidden"); }

    function setOverlayMode(mode: GamePhase) {
        if (mode === "START") {
        show(overlay);
        show(startButton);
        hide(waiting);
        hide(count);
        } else if (mode === "WAITING") {
        show(overlay);
        hide(startButton);
        show(waiting);
        hide(count);
        } else if (mode === "COUNTDOWN") {
        show(overlay);
        hide(startButton);
        hide(waiting);
        show(count);
        } else {
        // HIDDEN
        hide(overlay);
        hide(startButton);
        hide(waiting);
        hide(count);
        }
    }

    function setCursorHidden(hidden: boolean) {
        main.style.cursor = hidden ? "none" : "auto";
    }

    function showPauseButton(showBtn: boolean) {
        if (showBtn) {
        show(pauseButton);
        } else {
            hide(pauseButton);
        }
    }

    // Evenements simples (wiring propre)
    let onPlayCb: (() => void) | null = null;
    let onPauseCb: (() => void) | null = null;


    startButton.addEventListener("click", () => { if (onPlayCb) onPlayCb(); });
    pauseButton.addEventListener("click", () => { if (onPauseCb) onPauseCb(); });

    function onPlay(cb: () => void) { onPlayCb = cb; }
    function onPauseClick(cb: () => void) { onPauseCb = cb; }

    function countdown(seconds: number, done: () => void) {
        setOverlayMode("COUNTDOWN");
        let n = seconds;
        count.textContent = String(n);

        const id = setInterval(() => {
        n -= 1;
        if (n <= 0) {
            clearInterval(id);
            done();
            setOverlayMode("PLAYING");
            return;
        }
        count.textContent = String(n);
        }, 1000);
    }


    /**************************** RATIO 36:16 ****************************/
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
        canvas: pongCanvas,
        overlay: {
            setOverlayMode,
            setCursorHidden,
            showPauseButton,
            onPlay,
            onPauseClick,
            countdown
        },
    };
}