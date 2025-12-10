import { el, text } from "../home";
import type { RecentMatchAvgStats } from "./load.ts"
import type { Tournament } from "../tournament/uiTypes";
import type { PlayerId } from "../pong/game/metrics";
import type { PlayerInfo, GameViewHooks } from "../pong/game/uiTypes";

// Y : Dashboard related
type DailyMatchStat = {
  date: string;        // ex: "2025-12-09"
  totalMatches: number;
  wins: number;
};

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

// Y : Pour afficher graph dashboard
export function renderDailyMatchesChart(
    dashboard: HTMLElement,
    stats: DailyMatchStat[]
) {
    // On vide le dashboard
    dashboard.innerHTML = "";

    // --- Titre ---
    const title = el("h2", "font-royalvogue text-3xl mb-4");
    title.textContent = "Matches (Last 7 days)";

    const MAX_HEIGHT = 120;

    // --- Conteneur des barres ---
	const bars = el("div", "flex items-end gap-2 w-full mt-4");
    (bars as HTMLDivElement).style.height = `${MAX_HEIGHT}px`;

    dashboard.append(title, bars);

    // --- Trouver le nombre max de matchs ---
    const maxMatches = stats.reduce(
        (max, day) => (day.totalMatches > max ? day.totalMatches : max),
        0
    );

    // Si aucun match sur la période
    if (maxMatches === 0) {
        const msg = el("p", "article-base mt-2");
        msg.textContent = "No matches played in the last 7 days.";
        dashboard.append(msg);
        return;
    }

    // --- Une colonne par jour ---
    for (const day of stats) {
        const heightPx = (day.totalMatches / maxMatches) * MAX_HEIGHT;

        // Colonne verticale
        const col = el(
            "div",
            "flex flex-col items-center gap-1 flex-1"
        );

        // Barre
        const bar = el(
            "div",
            "w-full bg-black/60 rounded-t-md transition-all duration-300"
        ) as HTMLDivElement;
        bar.style.height = `${heightPx}px`;

        // Tooltip au survol
        bar.title = `Matches: ${day.totalMatches} | Wins: ${day.wins}`;

        // Label de date (MM-DD)
        const dateLabel = el(
            "span",
            "text-xs font-modern-type"
        );
        dateLabel.textContent = day.date.slice(5); // "12-04"

        // Label numérique sous la date
        const statsLabel = el(
            "span",
            "text-[10px] font-modern-type text-stone-600"
        );
        statsLabel.textContent = `${day.totalMatches} M / ${day.wins} W`;

        col.append(bar, dateLabel, statsLabel);
        bars.append(col);
    }
	    // --- Section du 2e graph : "Last 3 matches – rallies" ---
    const ralliesSection = el("div", "w-full mt-6");
    dashboard.append(ralliesSection);

    // Fake data pour tester (on branchera le backend plus tard)
    const fakeRallies: RecentMatchAvgStats[] = [
        { label: "Game 1", avgRallyBounces: 6.2, avgRallyTime: 3.4 },
        { label: "Game 2", avgRallyBounces: 3.8, avgRallyTime: 2.1 },
        { label: "Game 3", avgRallyBounces: 9.1, avgRallyTime: 4.7 },
    ];

    renderRecentRalliesChart(ralliesSection, fakeRallies);
}

export function renderRecentRalliesChart(
    container: HTMLElement,
    stats: RecentMatchAvgStats[]
) {
    // On vide uniquement ce sous-container, pas tout le dashboard
    container.innerHTML = "";

    // --- Titre ---
    const title = el("h3", "font-royalvogue text-2xl mt-6 mb-3");
    title.textContent = "Last 3 matches";

    const MAX_HEIGHT = 100;

    // Conteneur vertical pour les colonnes
    const rows = el("div", "flex gap-4 w-full mt-4");

    container.append(title, rows);

    // Trouver les max pour normaliser les hauteurs
    const maxBounces = stats.reduce(
        (max, m) => (m.avgRallyBounces > max ? m.avgRallyBounces : max),
        0
    );
    const maxTime = stats.reduce(
        (max, m) => (m.avgRallyTime > max ? m.avgRallyTime : max),
        0
    );

    // Si tout est à 0 → petit message
    if (maxBounces === 0 && maxTime === 0) {
        const msg = el("p", "article-base mt-2");
        msg.textContent = "No rally data available for the last matches.";
        container.append(msg);
        return;
    }

    // Une "colonne" par match
    for (const match of stats) {
        const col = el(
            "div",
            "flex flex-col items-center gap-1 flex-1"
        );

        // Conteneur des 2 barres (bounces + time)
        const barGroup = el(
            "div",
            "flex items-end gap-1 w-full h-[100px]"
        ) as HTMLDivElement;

        // Hauteurs relatives
        const bouncesHeight =
            maxBounces === 0
                ? 0
                : (match.avgRallyBounces / maxBounces) * MAX_HEIGHT;
        const timeHeight =
            maxTime === 0
                ? 0
                : (match.avgRallyTime / maxTime) * MAX_HEIGHT;

        // Barre Bounces (gauche)
        const bounceBar = el(
            "div",
            "flex-1 bg-black/70 rounded-t-md transition-all duration-300"
        ) as HTMLDivElement;
        bounceBar.style.height = `${bouncesHeight}px`;
        bounceBar.title = `Avg bounces: ${match.avgRallyBounces.toFixed(1)}`;

        // Barre Time (droite)
        const timeBar = el(
            "div",
            "flex-1 bg-black/30 rounded-t-md transition-all duration-300"
        ) as HTMLDivElement;
        timeBar.style.height = `${timeHeight}px`;
        timeBar.title = `Avg time: ${match.avgRallyTime.toFixed(1)}s`;

        barGroup.append(bounceBar, timeBar);

        // Label du match
        const matchLabel = el(
            "span",
            "text-xs font-modern-type"
        );
        matchLabel.textContent = match.label;

        // Petit label numérique en dessous
        const numbers = el(
            "span",
            "text-[10px] font-modern-type text-stone-600"
        );
        numbers.textContent = `Bounces: ${match.avgRallyBounces.toFixed(1)} | Game length : ${match.avgRallyTime.toFixed(1)}s`;

        col.append(barGroup, matchLabel, numbers);
        rows.append(col);
    }
}


