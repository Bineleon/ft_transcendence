import { el, text }         from "../../home";
import type { GamePhase }   from "../game/types";

//// Structure DOM minimale (fini les “multi-boîtes”)
//  root (grid 2 colonnes)
//  ├─ stage (position: relative)   ← Le “plateau” du jeu
//  │  ├─ canvas                    ← Le rendu
//  │  └─ overlayRoot               ← L’overlay (position: absolute par-dessus le canvas)
//  │     └─ overlayContainer       ← Conteneur des éléments d’overlay
//  └─ terminal                     ← Le “terminal” / stats / logs


//// Logique d’overlay
// START   -> CLIC -> WAITING (non cliquable, souris masquee, attend P1/P2 READY)
// P1READY -> WAITING (idem)
// P2READY -> WAITING (idem)
// BOTHREADY -> COUNTDOWN -> auto -> PLAYING (overlay caché, touche PAUSE possible)
//// 
// SpaceBar -> PAUSED (souris visible, bouton PAUSE cliquable, event touche PAUSE possible)
////
// GAMEOVER -> Winner affiché, bouton RESTART cliquable -> START

export interface GameViewWindow {
    main: HTMLElement;          // grid 2 cols
    stage: HTMLElement;         // conteneur relatif (canvas + overlay)
    canvas: HTMLCanvasElement;  // canvas de jeu (zone de dessin)
    overlay: {                  // gestion de l'overlay
        selectOverlay: (phase: GamePhase) => HTMLElement;
        applyOverlay: (opts: any) => void;
        onPlay: (cb: () => void) => void;
        onPause: (cb: () => void) => void;
    };
    terminal: HTMLElement;      // zone de droite (terminal)
}

// export function selectOverlay(phase: GamePhase): HTMLElement {

//     const startBtn = el("button", "px-4 py-2 border pointer-events-auto hover:bg-white/100 hidden");
//     startBtn.append(text("START"));

//     const pauseBtn = el("button", "px-4 py-2 border pointer-events-auto hover:bg-white/100 hidden");
//     pauseBtn.append(text("PAUSE"));

//     const waiting = el("button", "text-center pointer-events-none hidden");
//     waiting.append(text("Waiting players…"));

//     const countdown = createCountdown(3);

//     switch (phase) {
//         case "START": {
//             startBtn.classList.remove("hidden");
//             startBtn.disabled = false;
//             return startBtn;
//         }
//         case "WAITING": {
//             startBtn.classList.add("hidden");
//             waiting.classList.remove("hidden");
//             return waiting;
//         }
//         case "COUNTDOWN":
//             return countdown;
//         case "PAUSED":
//             return pauseBtn;
//         default:
//             return document.createElement("div"); // empty
//     }
// }

export function createGameViewWindow(): GameViewWindow {
    // 1) main layout: 2 colonnes
    const main = el("div", "grid grid-cols-1 grid-cols-[auto_auto] gap-4 p-2 " +
        "justify-center items-center" +
         "h-[300px] lg:h-[400px] xl:h-[540px] xxl:h-[900px]"
    );

    // 2) Stage = conteneur relatif
    const stage = el("div", "relative h-full w-full" +
        "w-[400px] h-[300px] " +
        "lg:w-[600px] lg:h-[400px] " +
        "xl:w-[900px] xl:h-[540px] " +
        "xxl:w-[1500px] xxl:h-[900px]"
    );
    // Le canvas de jeu
    const canvas = el("canvas", "absolute block bg-black/5 border-9" +
        " w-full h-full"
    ) as HTMLCanvasElement;
    // 3) Overlay = par-dessus le canvas
    const overlayRoot = el("div", "absolute inset-0 grid place-items-center pointer-events-none z-50");
    const overlayContainer = el("div", "pointer-events-auto");

    let onPlayCallback: () => void = () => {};
    let onPauseCallback: () => void = () => {};

    function createStartBtn() {
        const b = el("button", "px-4 py-2 border pointer-events-auto hover:bg-white/100");
        b.textContent = "START";
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            onPlayCallback?.();
        });
        return b;
    }

    function createPauseBtn() {
        const b = el("button", "px-4 py-2 border pointer-events-auto hover:bg-white/100");
        b.textContent = "PAUSE";
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            onPauseCallback?.();
        });
        return b;
    }

    function createWaiting(p1Ready?: boolean, p2Ready?: boolean) {
        const wrap = el("div", "text-center");
        const lbl = el("div", "text-xl mb-2");
        lbl.append(text("Waiting players…"));

        const status = el("div", "text-sm");
        status.append(text(`P1: ${p1Ready ? "Ready" : "Not ready"} — P2: ${p2Ready ? "Ready" : "Not ready"}`));
        wrap.append(lbl, status);
        
        return wrap;
    }

    function createCountdown(secondsLeft: number) {
        const c = el("div", "text-6xl font-bold pointer-events-none");
        c.textContent = String(secondsLeft);
        return c;
    }

    function applyOverlay(opts: any) {
        const phase: GamePhase = opts.phase ?? (canvas.dataset.phase as GamePhase) ?? "START";
        canvas.dataset.phase = phase;
        // pointer-events sur le root : désactiver si en jeu
        overlayRoot.classList.toggle("pointer-events-none", phase === "PLAYING");

        // reconstruire le container
        overlayContainer.replaceChildren();

        switch (phase) {
            case "START":
                overlayContainer.appendChild(createStartBtn());
                break;
            case "WAITING":
                overlayContainer.appendChild(createWaiting(opts.p1Ready, opts.p2Ready));
                break;
            case "COUNTDOWN":
                overlayContainer.appendChild(createCountdown(opts.countdown?.secondsLeft ?? 3));
                break;
            case "PAUSED":
                overlayContainer.appendChild(createPauseBtn());
                break;
            default:
                break;
        }
    }


    overlayRoot.append(overlayContainer);
    stage.append(canvas, overlayRoot);

    // 4) Terminal = zone de droite
    const terminal = el("div", "text-white bg-black h-full w-full min-w-0" +
        "relative" +
        "w-[200px] h-[300px] " +
        "lg:w-[300px] lg:h-[400px] " +
        "xl:w-[350px] xl:h-[540px] " +
        "xxl:w-[450px] xxl:h-[900px] ");
    terminal.append(text("Terminal…"));

    // 5) Assemble
    main.append(stage, terminal);

    return {
        main,
        stage,
        canvas,
        overlay: {
            selectOverlay: (phase: GamePhase) => {
                applyOverlay({ phase });
                return overlayContainer.firstElementChild as HTMLElement;
            },
            applyOverlay: applyOverlay,
            onPlay: (cb: () => void) => { onPlayCallback = cb; },
            onPause: (cb: () => void) => { onPauseCallback = cb; }
        },
        terminal,
    };
}
 