import { el, text }         from "../../home";

//// Structure DOM minimale (fini les “multi-boîtes”)
//  root (grid 2 colonnes, 1 colonne sur fenetre etroite)
//  ├─ stage (position: relative)   ← Le “plateau” du jeu
//  │  ├─ canvas                    ← Le rendu
//  │  └─ overlayRoot               ← L’overlay (position: absolute par-dessus le canvas)
//  │     └─ overlayContainer       ← Conteneur des éléments d’overlay
//  └─ terminal                     ← Le “terminal” / stats / logs


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

export interface GameViewWindow {
    main: HTMLElement;          // grid 2 cols
    stage: HTMLElement;         // conteneur relatif (canvas + overlay)
    canvas: HTMLCanvasElement;  // canvas de jeu (zone de dessin)
    overlay: HTMLElement;    // gestion de l'overlay
    terminal: HTMLElement;      // zone de droite (terminal)
}

export function createGameViewWindow(): GameViewWindow {
    // 1) main layout: 2 colonnes
    const main = el("div", "grid grid-cols-1 lg:grid-cols-[auto_auto] gap-4 p-2 " +
        "h-full " +
        "place-items-center " +
        "lg:justify-center lg:items-center " +
        "h-[300px] " +
        "lg:h-[420px] " +
        "xl:h-[648px] " +
        "xxl:h-[900px]"); 
    // 2) Stage = conteneur relatif
    const stage = el("div", "relative " +
        "w-[500px] h-[300px] " +
        "lg:w-[700px] lg:h-[420px] " +
        "xl:w-[1080px] xl:h-[648px] " +
        "xxl:w-[1500px] xxl:h-[900px]");
    // Le canvas de jeu
    const canvas = el("canvas", "absolute block bg-black/5 border-9 w-full h-full" ) as HTMLCanvasElement;
    // 3) Overlay = par-dessus le canvas
    const overlayRoot = el("div", "absolute inset-0 grid place-items-center pointer-events-none z-50");
    const overlayContainer = el("div", "pointer-events-auto");

    overlayRoot.append(overlayContainer);
    stage.append(canvas, overlayRoot);

    // 4) Terminal = zone de droite
    const terminal = el("div", "text-white bg-black min-w-0 " +
        "relative " +
        "w-[500px] h-[300px] " +
        "lg:w-[210px] lg:h-[420px] " +
        "xl:w-[324px] xl:h-[648px] " +
        "xxl:w-[450px] xxl:h-[900px] ");
    terminal.append(text("Terminal…"));

    // 5) Assemble
    main.append(stage, terminal);

    return {
        main,
        stage,
        canvas,
        overlay: overlayContainer,
        terminal,
    };
}

