import { el, text }         from "../../home";
import type { GameState, LiveMatchStats } from "../game/uiTypes";
import type { Match, Tournament } from "../../tournament/uiTypes";
import { runAuthBox } from "../../utils/alertBox";
import { getLoggedName, getUserDatas } from "../../utils/todb";
import type { PlayerId, PlayerInfo } from "../game/uiTypes";
import { getTournamentDatas, notLoggedIn } from "../../utils/todb";

const currentPlayers: Record<PlayerId, PlayerInfo | null> = {
    p1: null,
    p2: null,
};

export function setPlayerInfo(id: PlayerId, info: PlayerInfo | null): void {
    currentPlayers[id] = info;
}

export function getPlayerInfo(id: PlayerId): PlayerInfo | null {
    return currentPlayers[id];
}

export function resetPlayersCache(): void {
    currentPlayers.p1 = null;
    currentPlayers.p2 = null;
}

export function arePlayersReady(state: GameState): { p1: boolean; p2: boolean } {
    return {
        p1: !!(state.ready.p1),
        p2: !!(state.ready.p2),
    };
}

export function areBothPlayersReady(state: GameState): boolean {
    const r = arePlayersReady(state);
    return r.p1 && r.p2;
}

export function arePlayersRegistered(state: GameState): { p1: boolean; p2: boolean } {
    return {
        p1: !!(state.p1 && state.p1.userName && state.p1.userName !== "P1"),
        p2: !!(state.p2 && state.p2.userName && state.p2.userName !== "P2"),
    };
}

export function areBothPlayersRegistered(state: GameState): boolean {
    const r = arePlayersRegistered(state);
    return r.p1 && r.p2;
}

export function areAllMatchesClosed(m?: Match[]): boolean {
    while (m && m.length > 0) 
    {
        m = m.filter((match) => match.status !== "CLOSED");
        if (m.length > 0) return false;
    }
    
    return true;
}


function applyPlayerInfoToBox(box: HTMLDivElement, info: PlayerInfo, player: "p1" | "p2", state: GameState): void {
    const img = document.createElement("img");
    img.src = info.avatarUrl || "/imgs/avatar.png";
    img.alt = `${info.userName} avatar`;
    img.className = "w-[8rem] h-[8rem] img-newspaper object-cover grayscale contrast-150 mix-blend-multiply";

    const userName = el("h1", "font-houston-sport text-6xl") as HTMLHeadingElement;
    userName.textContent = info.userName;

    box.innerHTML = "";
    if (player === "p1") {
        box.classList.add("items-start")
        box.append(img, userName);
    } else {
        userName.classList.add("text-right");
        box.classList.add("items-start")
        box.append(userName, img);
    }
    
    setPlayerInfo(player, { id: info.id, userName: info.userName, avatarUrl: info.avatarUrl });
    if (player === "p1") {
        state.p1.id = info.id;
        state.p1.userName = info.userName;
        state.p1.avatarUrl = info.avatarUrl ?? "";
    } else {
        state.p2.id = info.id;
        state.p2.userName = info.userName;
        state.p2.avatarUrl = info.avatarUrl ?? "";
    }

    // notify application that players changed (controller listens and will refresh terminal)
    document.dispatchEvent(new CustomEvent("playersUpdated", { detail: { state } }));
}

function createPlayerInfosBox(player: PlayerId, state: GameState): HTMLDivElement {
    const PBox = el("div", `grid gap-2 h-[8rem] w-full`) as HTMLDivElement;

    if (player === "p1") PBox.classList.add("grid-cols-[auto_1fr]");
    else PBox.classList.add("grid-cols-[1fr_auto]");

    const syncProfileBtn = el("button", "btn-click text-xs px-2 py-1 h-[2rem]") as HTMLButtonElement;
    syncProfileBtn.textContent = "Sync Profile";

    const guestBtn = el("button", "btn-click text-xs px-2 py-1 h-[2rem]") as HTMLButtonElement;
    guestBtn.textContent = "Guest";

    const btnRow = el(
        "div",
        "col-span-2 flex gap-2 items-center " + (player === "p1" ? "justify-start" : "justify-end")
    ) as HTMLDivElement;

    btnRow.append(syncProfileBtn, guestBtn);
    PBox.append(btnRow);

    if (state.tournamentCode) {
        const existing = getPlayerInfo(player);
        if (existing) applyPlayerInfoToBox(PBox, existing, player, state);
    } else {
        const existing = getPlayerInfo(player);
        if (existing) applyPlayerInfoToBox(PBox, existing, player, state);


        if (player === "p1") {
            notLoggedIn().then((isNotLoggedIn) => {
                if (!isNotLoggedIn) {
                    getLoggedName().then((name) => {
                        if (!name) return; // personne log → on garde les boutons
                        
                        getUserDatas(name).then((user) => {
                            if (!user) return;
                            // Robustly handle either: User OR { data: { user: User } }
                            const resolvedUser: any = (user as any)?.data?.user ?? user;
                            const id = resolvedUser?.id ?? resolvedUser?.id ?? "";
                            const username = resolvedUser?.username ?? resolvedUser?.userName ?? name;
                            const avatar   = resolvedUser?.avatarUrl ?? resolvedUser?.avatar ?? "";

                            state.p1.id = id;
                            state.p1.userName = username;
                            state.p1.avatarUrl = avatar || "";
                            state.stats.p1.name = username;
                            state.stats.p1.isGuest = false;
                            applyPlayerInfoToBox(PBox, state.p1, player, state);
                            document.dispatchEvent(new CustomEvent("playersUpdated", { detail: { state } }));
                        }).catch((err) => {
                            console.error("getUserDatas error:", err);
                        });
                    }).catch((err) => {
                        console.error("getLoggedName error:", err);
                    });
                }
            });
        }
    }

syncProfileBtn.onclick = async () => { 
        const info = await runAuthBox("M_SYNC");
        // guard: ensure the returned object actually contains the properties we need
        if (!info || !("userName" in info) || !("avatarUrl" in info)) return;

        const id = (info as any).id as string;
        const userName = (info as any).userName as string;
        const avatarUrl = ((info as any).avatarUrl as string) ?? "/imgs/avatar.png";

        state.stats[player].name = userName;
        state.stats[player].isGuest = false;
        applyPlayerInfoToBox(PBox, { id, userName, avatarUrl }, player, state);
    };

    guestBtn.onclick = async () => { 
        const info = await runAuthBox("M_GUEST");
        if (!info || !("userName" in info)) return;

        const id = (info as any).id as string;
        const userName = (info as any).userName as string;
        const avatarUrl = ((info as any).avatarUrl as string) ?? "/imgs/avatar.png";

        state.stats[player].name = userName;
        state.stats[player].isGuest = true;
        applyPlayerInfoToBox(PBox, { id, userName, avatarUrl }, player, state);
    };
    return PBox;
}

function createMatchTitle(state: GameState): HTMLDivElement {
    const main = el("div", `w-auto h-[50px] grid grid-cols-[20%_60%_20%] h-[100px] border-2`);

    const tCode = el("div", `flex flex-col items-end justify-center font-arcade-italic`, text(`Code :`), el("br"), text(`${state.stats.tournamentCode}`));

    const middle = el("div", `flex flex-col items-center justify-center font-arcade`, 
        el("h1", `text-4xl xl:text-6xl xxl:text-8xl`, text(`${state.stats.tournamentName}`)), el("br"), el("h3", "text-sm", text(`A ${state.stats.tournamentMode} Tournament !`)));

    const status = el("div", `flex flex-col items-start text-right justify-center font-arcade-italic`, text(`ROUND : ${state.stats.matchRound}`), el("br"), text(`${state.stats.matchStatus}`));

    main.append(tCode, middle, status);
    return main;
    }

function updateGameStateWithPlayersInfoFromMatch(state: GameState, match: Match): void {
    if (match.p1User && match.p1User.user) {
        const p1Info: PlayerInfo = {
            id: match.p1User.user.userId,
            userName: match.p1User.user.userName,
            avatarUrl: match.p1User.user.avatarUrl || "/imgs/avatar.png",
        };
        state.stats.p1.name = p1Info.userName;
        setPlayerInfo("p1", p1Info);
    }
    if (match.p2User && match.p2User.user) {
        const p2Info: PlayerInfo = {
            id: match.p2User.user.userId,
            userName: match.p2User.user.userName,
            avatarUrl: match.p2User.user.avatarUrl || "/imgs/avatar.png",
        };
        state.stats.p2.name = p2Info.userName;
        setPlayerInfo("p2", p2Info);
    }
}

function updateTitle(state: GameState, t: Tournament, m: Match): void {
    state.stats.tournamentCode = t.tCode;
    state.stats.tournamentId = m.tournamentId;
    state.stats.tournamentMode = t.tMode;
    state.stats.tournamentName = t.name;
    state.stats.matchRound = m.round;
    state.stats.matchStatus = m.status;
}

function handleTournamentPlayersInfo(mainBox: HTMLDivElement, playersBox: HTMLDivElement, state: GameState): LiveMatchStats | undefined {
    if (!state) return;

    if (state.matchId) return;
    /// Find Next Match (status = "schedueled")

    const tCode = state.tournamentCode || "";
    getTournamentDatas(tCode).then((t) => {
        if (!t) {
            console.error("Tournament data not found for code:", state.tournamentCode);
            return;
        }
        const nextMatch = t.matches?.find((m) => m.status === "SCHEDULED");

        if (!nextMatch) return;


        state.matchId = nextMatch.matchId;
        state.stats.p1.isGuest = false;
        state.stats.p2.isGuest = false;
        state.p1.id = nextMatch.p1User?.user?.userId || "";
        state.p2.id = nextMatch.p2User?.user?.userId || "";

        updateTitle(state, t, nextMatch);
        updateGameStateWithPlayersInfoFromMatch(state, nextMatch);
        const matchStats: LiveMatchStats = state.stats;

        const title: HTMLDivElement = createMatchTitle(state);
        const P1Box: HTMLDivElement = createPlayerInfosBox("p1", state);
        const P2Box: HTMLDivElement = createPlayerInfosBox("p2", state);
        playersBox.append(P1Box, P2Box);

        mainBox.append(title, playersBox);
        return matchStats;
    }).catch((err) => {
        console.error("Error fetching tournament data for players box:", err);
        return;
    });
}


export function createPlayersBox(state: GameState): HTMLDivElement {
    const playersBox = el("div", `w-full grid grid-cols-2`) as HTMLDivElement;

    if (state.tournamentCode) {
        const tournamentPlayersBox = el("div", `mt-4 grid grid-rows-2
            w-full
            lg:w-[910px] 
            xl:w-[1404px]
            xxl:w-[1950px]`);
        
        const matchStats = handleTournamentPlayersInfo(tournamentPlayersBox, playersBox, state);
        return tournamentPlayersBox;
    } else {
        const tournamentPlayersBox = el("div", `mt-4
            w-full
            lg:w-[910px] 
            xl:w-[1404px]
            xxl:w-[1950px]`);
        const P1Box: HTMLDivElement = createPlayerInfosBox("p1", state);
        P1Box.classList.add("justify-self-start");
        const P2Box: HTMLDivElement = createPlayerInfosBox("p2", state);
        P2Box.classList.add("justify-self-end");
        playersBox.append(P1Box, P2Box);
        tournamentPlayersBox.append(playersBox);
        console.log("state without tournament :", state);
        return tournamentPlayersBox;
    }
        
}