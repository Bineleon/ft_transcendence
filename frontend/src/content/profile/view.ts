import { el, text } from "../home";
import type { Tournament } from "../tournament/uiTypes";
import type { PlayerId } from "../game/metrics";
import type { PlayerInfo, GameViewHooks } from "../game/types";


// ------------------ Profile View Definitions ---------------------
// root (main container)
//  ├─ section (two columns: avatar + info box)
//  │   ├─ picframe (container for avatar image and file input)
//  │   │   ├─ picture (user avatar)
//  │   │   ├─ avatarInput (hidden file input for avatar upload)
//  │   │   └─ hoverOverlay (overlay text for avatar change)
//  │   └─ infoBox (user info and stats)
//  │       ├─ loginLabel
//  │       ├─ emailLabel
//  │       └─ stats (textarea)
//  └─ friendsSection (two columns: friends list + friend requests)
//      ├─ friendsContainer (contains friends title and list)
//      └─ requestsBox (container for friend requests)

export interface ProfileViewWindow {
    root: HTMLElement;
    header: HTMLElement;
    title: HTMLElement;
    subtitle: HTMLElement;
    friendsColumn: HTMLElement;
    friendsList: HTMLUListElement;
    requestsBox: HTMLElement;
    articleColumn: HTMLElement;
    picture: HTMLImageElement;
    avatarInput: HTMLInputElement;
    hoverOverlay: HTMLElement;
    picframe: HTMLElement;
    loginLabel: HTMLElement;
    emailLabel: HTMLElement;
    stats: HTMLElement;
    editBox: HTMLElement;
}

export function createProfileViewWindow(): ProfileViewWindow {
    const root = el(
        "main",
        "p-4 space-y-6"
    );

// --- HEADER
    const header = el("header", "text-center space-y-2");
    const title = el("h2", "title-profile");
    const subtitle = el("p", "subtitle-cat italic");
    header.append(title, subtitle);

    const contentGrid = el("div", "grid grid-cols-1 md:grid-cols-[30%_70%] gap-6");

// --- COLUMNS
    // Left column: friends list + requests
    const friendsColumn = el("div", "space-y-6");
    const friendsTitle = el("h2", "font-royalvogue text-3xl mb-2");
    friendsTitle.append(text("Friends"));
    const friendsList = el(
        "ul",
        "list-disc list-inside font-modern-type text-lg space-y-1"
    ) as HTMLUListElement;
    const requestsBox = el("div", "space-y-2");
    friendsColumn.append(friendsTitle, friendsList, requestsBox);

    // Right column: avatar + article (login/email/stats)
    const articleColumn = el("div", "space-y-4");

    // Avatar figure
    const picframe = el(
        "div",
        "relative flex items-center justify-center group"
    ) as HTMLDivElement;
    const picture = el(
        "img",
        "img-newspaper cursor-pointer max-w-full"
    ) as HTMLImageElement;
    picture.src = "/imgs/avatar.png";
    picture.alt = "Avatar utilisateur";
    picture.loading = "lazy";
    picture.tabIndex = 0;
    picture.setAttribute("role", "img");
    picture.dataset.fallback = "false";
    picture.addEventListener("error", () => {
        if (picture.dataset.fallback === "false") {
            picture.src = "/imgs/avatar.png";
            picture.dataset.fallback = "true";
        }
    });
    // Hidden file input for avatar upload
    const avatarInput = document.createElement("input") as HTMLInputElement;
    avatarInput.type = "file";
    avatarInput.accept = "image/*";
    avatarInput.className = "hidden";
    // Overlay text shown on hover to hint avatar editing (only for self)
    const hoverOverlay = el(
        "div",
        [
            "absolute inset-0 flex items-center justify-center",
            "font-jmh text-2xl text-stone-100",
            "bg-black/50",
            "opacity-0 transition-opacity duration-200",
            "pointer-events-none group-hover:opacity-100",
        ].join(" ")
    );
    hoverOverlay.textContent = "Click to change avatar";
    picframe.append(picture, avatarInput, hoverOverlay);

    // Info article: contains username, email and stats (structured as
    // paragraphs rather than a textarea for a more newspaper feel)
    const infoBox = el("article", "p-4 space-y-3 bg-white/80 border border-stone-300 rounded-md shadow-sm");
    // Login label (username) - styled as a heading
    const loginLabel = el("h3", "font-im-great text-3xl tracking-widest");
    // Email label - smaller subtitle
    const emailLabel = el("p", "font-modern-type text-md italic");
    // Stats container - will be filled with paragraphs by loadProfileData
    const stats = el(
        "div",
        "space-y-2 font-ocean-type text-md whitespace-pre-line"
    );
    infoBox.append(loginLabel, emailLabel, stats);

    articleColumn.append(picframe, infoBox);

    // Put both columns into the grid
    contentGrid.append(friendsColumn, articleColumn);

    // -----------------------------------------------------------------
    // Edit box: appears at the bottom only when viewing your own profile.
    // Initially empty; will be populated by setupSelfMode. We add
    // some separation with a border-top to match the newspaper aesthetic.
    const editBox = el(
        "div",
        "pt-6 border-t border-stone-400 space-y-2 hidden"
    );

    // Assemble all parts
    root.append(header, contentGrid, editBox);

    return {
        root,
        header,
        title,
        subtitle,
        friendsColumn,
        friendsList,
        requestsBox,
        articleColumn,
        picture,
        avatarInput,
        hoverOverlay,
        picframe,
        loginLabel,
        emailLabel,
        stats,
        editBox,
    };
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
