import { el }         from "../../home";
import type { GameState } from "../game/types";
import { matchAlert } from "../../utils/logchecks";
import { getLoggedName, getUserDatas } from "../../utils/todb";
import type { PlayerId, PlayerInfo } from "../game/types";

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

function applyPlayerInfoToBox(box: HTMLDivElement, info: PlayerInfo, player: "p1" | "p2", state: GameState): void {
    const img = document.createElement("img");
    img.src = info.avatarUrl || "/imgs/avatar.png";
    img.alt = `${info.userName} avatar`;
    img.className = "w-[8rem] h-[8rem] img-newspaper object-cover grayscale contrast-150 mix-blend-multiply";

    const userName = el("h1", "font-houston-sport text-6xl truncate") as HTMLHeadingElement;
    userName.textContent = info.userName;

    box.innerHTML = "";
    if (player === "p1") {
        userName.classList.add("text-left");
        box.append(img, userName);
    } else {
        userName.classList.add("text-right");
        box.append(userName, img);
    }
    
    setPlayerInfo(player, { userName: info.userName, avatarUrl: info.avatarUrl });
    if (player === "p1") {
        state.p1.userName = info.userName;
        state.p1.avatarUrl = info.avatarUrl ?? "";
    } else {
        state.p2.userName = info.userName;
        state.p2.avatarUrl = info.avatarUrl ?? "";
    }

    // notify application that players changed (controller listens and will refresh terminal)
    document.dispatchEvent(new CustomEvent("playersUpdated", { detail: { state } }));
}

function createPlayerInfosBox(player: PlayerId, state: GameState): HTMLDivElement {
    const PBox = el("div", `grid gap-2 h-[8rem]`) as HTMLDivElement;

    const syncProfileBtn = el("button", "btn-click text-xs px-2 py-1") as HTMLButtonElement;
    syncProfileBtn.textContent = "Sync Profile";

    const guestBtn = el("button", "btn-click text-xs px-2 py-1") as HTMLButtonElement;
    guestBtn.textContent = "Guest";

    PBox.append(syncProfileBtn, guestBtn);

    const existing = getPlayerInfo(player);
    if (existing) applyPlayerInfoToBox(PBox, existing, player, state);


    if (player === "p1" && arePlayersRegistered(state).p1 === false) {
        getLoggedName().then((name) => {
            if (!name) return; // personne log → on garde les boutons
            
            getUserDatas(name).then((user) => {
                if (!user) return;
                state.p1.userName = user.data.user.username;
                state.p1.avatarUrl = user.data.user.avatarUrl || "";
                applyPlayerInfoToBox(PBox, state.p1, player, state);

                document.dispatchEvent(new CustomEvent("playersUpdated", { detail: { state } }));
            }).catch((err) => {
                console.error("getUserDatas error:", err);
            });
        }).catch((err) => {
            console.error("getLoggedName error:", err);
        });
    }

    if (player === "p1") {
        PBox.classList.add("grid-cols-[1fr_1fr]", "items-center");

    } else {
        PBox.classList.add("grid-cols-[1fr_1fr]", "items-center");
    }

    syncProfileBtn.onclick = async () => { 
        const info = await matchAlert("sync");
        if (!info) return;
        applyPlayerInfoToBox(PBox, info, player, state);

    };
    guestBtn.onclick = async () => { 
        const info = await matchAlert("guest");
        if (!info) return;
        applyPlayerInfoToBox(PBox, info, player, state);
    };


    return PBox;
}

export function createPlayersBox(state: GameState): HTMLDivElement {
    const playersBox = el("div", `w-full 
        grid grid-cols-2 
        px-4 
        lg:w-[910px] 
        xl:w-[1404px]
        xxl:w-[1950px]`) as HTMLDivElement;

    const P1Box: HTMLDivElement = createPlayerInfosBox("p1", state);
    P1Box.classList.add("justify-self-start");
    const P2Box: HTMLDivElement = createPlayerInfosBox("p2", state);
    P2Box.classList.add("justify-self-end");
    playersBox.append(P1Box, P2Box);
        
    return playersBox;
}