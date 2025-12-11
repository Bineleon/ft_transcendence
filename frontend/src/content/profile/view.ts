import { el, text } from "../home";
import type { RecentMatchAvgStats } from "./dashboard.ts"
import type { Tournament } from "../tournament/uiTypes";
import type { PlayerId } from "../pong/game/metrics";
import type { PlayerInfo, GameViewHooks } from "../pong/game/uiTypes";



// ------------------ Définitions de la vue Profil ---------------------
//
// root (élément <main> : conteneur global)
//  ---> Generale : Div grid grid-cols-2
// --- > Dashbord : --- col -> 2
// --- > PInfos   : --- col -> 1 -------- append Header, contentGRid
// ---->                en dessous col 1
//  ├─ header              
//  │   ├─ title
//  │   └─ subtitle
//  ├─ contentGrid
//  │   ├─ friendsColumn                    
//  │   │   ├─ friendsTitle
//  │   │   ├─ friendsList
//  │   │   └─ requestsBox
//  │   └─ articleColumn
//  │       ├─ picframe
//  │       │   ├─ picture
//  │       │   ├─ avatarInput
//  │       │   └─ hoverOverlay
//  │       └─ infoBox
//  │           ├─ loginLabel
//  │           ├─ emailLabel                 : IsSelf uniquement
//  │           └─ stats

// hors Generale
//  └─ editBox                  : IsSelf uniquement

export interface ProfileViewWindow {
    root: HTMLElement;
    generale: HTMLElement;
    dashboard: HTMLElement;
    header: HTMLElement;
    title: HTMLElement;
    subtitle: HTMLElement;
    friendsColumn: HTMLElement;
    friendsList: HTMLUListElement;
    requestsBox: HTMLElement;
    contentGrid: HTMLElement;
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
    const root = el("main", "p-4 space-y-6");

///   GRosse boite a gauche
    const generale = el("div", "grid grid-cols-[60%_40%] m-4");

//  Conteneur sur 3 rangees
    const pInfos = el("div", "grid grid-rows-3 items-start");

// --- HEADER  -------- 1ere rangee
    const header = el("header", "text-center");
    const title = el("h2", "title-profile font-nexa-rust-script");
    const subtitle = el("p", "subtitle-cat italic");
    header.append(title, subtitle);


///  --- CONTENT GRID  ---- > 2eme rangee --- Infos + Avatar
    const contentGrid = el("div", "flex flex-cols-1 md:grid-cols-[30%_60%] gap-6 items-start");

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


// --- FRIENDS ----- > 3eme rangee
    const friendsColumn = el("div", "space-y-6");
    const friendsTitle = el("h2", "font-royalvogue text-3xl mb-2");
    friendsTitle.append(text("Friends"));
    const friendsList = el(
        "ul",
        "list-disc list-inside font-modern-type text-lg space-y-1"
    ) as HTMLUListElement;
    const requestsBox = el("div", "space-y-2");
    friendsColumn.append(friendsTitle, friendsList, requestsBox);

    const editBox = el(
        "div",
        "pt-6 border-t border-stone-400 space-y-2 hidden"
    );
    // Put both columns into the grid
    contentGrid.append(infoBox, picframe);


    pInfos.append(header, contentGrid, friendsColumn);


    /// DASHBOARD
    const dashboard = el(
		"div", 
		"p-4 bg-white/80 mix-blend-multiply border border-stone-300 rounded-md shadow-sm flex flex-col gap-4"
		);
	const dashboardTitle = el("h2", "font-royalvogue text-3xl mb-2");
	dashboardTitle.append(text("Matches (Last 7 days)"));
    const dashboardChart = el(
		"div",
		"flex items-end gap-2 h-40 w-full"
	);
	dashboard.append(dashboardTitle, dashboardChart);
    generale.append(pInfos, dashboard)

    /// --- ISSELF STUFF --- SECRETS
    const isSelf = el("div", "");

    // Assemble all parts
    root.append(generale, isSelf);
    return {
        root,
        generale,
        dashboard,
        header,
        title,
        subtitle,
        friendsColumn,
        friendsList,
        requestsBox,
        contentGrid,
        picture,
        avatarInput,
        hoverOverlay,
        picframe,
        loginLabel,
        emailLabel,
        stats,
        editBox,
    };
};




