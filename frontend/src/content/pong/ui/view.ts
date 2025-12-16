import { el }         from "../../home";
import type { GameViewHooks } from "../game/uiTypes";

//// Structure DOM minimale (fini les “multi-boîtes”)
//  root (grid 2 colonnes, 1 colonne sur fenetre etroite)
//  ├─ stage (position: relative)   ← Le “plateau” du jeu
//  │  ├─ canvas                    ← Le rendu
//  │  └─ overlayRoot               ← L’overlay (position: absolute par-dessus le canvas)
//  │     └─ overlayContainer       ← Conteneur des éléments d’overlay
//  └─ terminal                     ← Le “terminal” / stats / logs



export interface GameViewWindow {
    root: HTMLElement;          // root grid 2 rows
    playersBox: HTMLDivElement;  // conteneur des infos joueurs
    main: HTMLElement;          // grid 2 cols
    stage: HTMLElement;         // conteneur relatif (canvas + overlay)
    canvas: HTMLCanvasElement;  // canvas de jeu (zone de dessin)
    overlay: HTMLElement;    // gestion de l'overlay
    terminal: HTMLDivElement;      // zone de droite (terminal)
}

export function createGameViewWindow(hooks?: GameViewHooks): GameViewWindow {
    // 1) main layout: 2 colonnes
    const root = el("div", `grid grid-rows-[auto_auto] gap-4 justify-items-center`);

////// PLAYERS 
    const playersBox = el("div", `grid grid-cols-2 items-center gap-2
        w-[500px]
        lg:w-[910px] 
        xl:w-[1404px]
        xxl:w-[1950px]`) as HTMLDivElement;

//////  GAME VIEW WINDOW STRUCTURE
    const main = el("div", `grid grid-cols-1 lg:grid-cols-[auto_auto] gap-4 p-2 items-start`); 
    // 2) Stage = conteneur relatif
    const stage = el("div", `relative
        w-[500px] h-[300px] 
        lg:w-[700px] lg:h-[420px] 
        xl:w-[1080px] xl:h-[648px] 
        xxl:w-[1500px] xxl:h-[900px]`);
    // Le canvas de jeu
    const canvas = el("canvas", "absolute block bg-black/5 border-9 w-full h-full" ) as HTMLCanvasElement;
    // 3) Overlay = par-dessus le canvas
    const overlayRoot = el("div", "absolute inset-0 grid place-items-center pointer-events-none z-50");
    const overlayContainer = el("div", "pointer-events-auto");

    overlayRoot.append(overlayContainer);
    stage.append(canvas, overlayRoot);

    // 4) Terminal = zone de droite
    const terminal = el("div", `text-white bg-black min-w-0
        relative mix-blend-multiply
        w-[500px] h-[700px]
        lg:w-[210px] lg:h-[420px]
        xl:w-[324px] xl:h-[648px]
        xxl:w-[450px] xxl:h-[900px] `);
        
    // 5) Assemble
    main.append(stage, terminal);
    root.append(playersBox, main);

    return {
        root,
        playersBox,
        main,
        stage,
        canvas,
        overlay: overlayContainer,
        terminal,
    };
}

//// Logique d’overlay
/// au boot: mouse visible, bouton START cliquable
// 'START' -> *CLIC*    -> 'WAITING'
///                     : mouse masquée, non cliquable, ecoute event clavier (P1READY/P2READY)
///                     attend P1/P2 READY 
// P1READY 'w'          -> 'WAITING for P2'
// /                     : ** idem ** 
// /                     attend P2 READY                   
// P2READY 'ArrowUp'    -> 'WAITING for P1'
// /                     : ** idem **
// /                     attend P1 READY

// BOTHREADY            -> 'COUNTDOWN'
///                     : mouse masquée, non cliquable, lance countdown
// 3..2..1              -> 'PLAYING'
///                     : overlay caché, ecoute event clavier (PAUSE)
///                     lance la boucle de jeu
// SpaceBar             -> 'PAUSED'
///                     : mouse visible, 2 boutons cliquables, ecoute event clavier (PAUSE)
// UN'PAUSED'           -> 'COUNTDOWN'
///                     : mouse masquée, non cliquable, relance countdown
// 'RESTART' -> *CLIC*  -> --premiere etape--
