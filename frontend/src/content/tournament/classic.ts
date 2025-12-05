import { getRouteTail } from "../../router";
import { el, text } from "../home";
import { pongAlert, runAuthBox} from "../utils/alertBox";
import { addUserAsPlayerToTournament, getLoggedName, getTournamentDatas } from "../utils/todb";
import type { Tournament } from "./uiTypes";
import { renderTournamentBrackets } from "./brackets";
import { apiFetch } from "../utils/apiFetch";


/// ---- VIEW RENDERING ---- ///
function renderRegisterButtons(t: Tournament): HTMLElement {

    let tCode = getRouteTail("/tournament/classic");

    const div = el("div", "flex justify-center mb-4 gap-4");

    const joinTournamentBtn = el("button", "btn-click flex mb-4");
    joinTournamentBtn.textContent = "Join Tournament";
    joinTournamentBtn.addEventListener("click", () => { runAuthBox("JOIN"); });


    const unregisterFromTournamentBtn = el("button", "btn-click flex mb-4");
    getLoggedName().then((who) => {
        if (!who) {
            unregisterFromTournamentBtn.textContent = "Log in to Unregister";
            unregisterFromTournamentBtn.addEventListener("click", () => {
                runAuthBox("LOGIN", { tCode: t.tCode });
            });
        } else {
            unregisterFromTournamentBtn.textContent = `Unregister as ${who}`;
            unregisterFromTournamentBtn.addEventListener("click", async () => {
                try {
                    const response = await apiFetch(`/api/tournaments/${t.tCode}/join`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: who }),
                        credentials: "include"
                    });
                    const data = await response.json();
                    if (response.ok) {
                        pongAlert("You have been unregistered from the tournament.");
                        window.location.href = `#/tournament`;
                    } else {
                        pongAlert(`Failed to unregister from tournament: ${data.error?.message || data.message || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error("Unregister error:", error);
                    pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`);
                }
            });
        }
    });
    unregisterFromTournamentBtn.textContent = "Unregister from Tournament";

    div.append(joinTournamentBtn, unregisterFromTournamentBtn);
    return div;
}

function renderTournamentState(t: Tournament): HTMLElement {
    const head = el("div", "grid grid-rows-2");
    const up = el("h1", "font-vintage text-6xl flex justify-center mb-3", text(`${t.name}`));
    const down = el("div", "font-modern-type grid grid-cols-3 place-items-center");
    const infos = el("div", "item-start");
    
    let nbPlayers = getNbRegisteredPlayers(getAllPlayerNames(t));
    infos.append(el("p", "", text(`Type: ${t.tMode}`)));
    infos.append(el("p", "", text(`Participants: ${nbPlayers} / ${t.maxParticipants}`)));
    // infos.append(el("p", "", text(`Matches: ${t.matches.length}`)));
    const code = el("p", "item-center font-origin-athletic text-3xl", text(`${t.tCode}`));

    let newStatus: string = t.status;
    if (newStatus === "OPEN") newStatus = "Waiting for Players";
    if (newStatus === "RUNNING") newStatus = "Tournament Open";
    const play = el("div", "grid grid-rows-2");
    const status = el("p", "item-end", text(`${newStatus}`));
    const playBtn = el("button", "btn-click p-0");
    playBtn.textContent = "Play";
    playBtn.onclick = () => {
        window.location.href = `#/playpong/${t.tCode}`;
    }

    if (t.status !== "RUNNING") {
        playBtn.disabled = true;
        playBtn.classList.add("bg-stone-300", "cursor-not-allowed");
    }

    play.append(status, playBtn);
    down.append(infos, code, play);
    head.append(up, down);
    return head;
}

function renderTournamentView(t: Tournament): HTMLElement {
    const main = el("div", "border-tournament");
    const tournamentState = renderTournamentState(t) as HTMLElement;
    const tournamentBrackets = renderTournamentBrackets(t) as HTMLElement;
    const registerUnregisterDiv = renderRegisterButtons(t) as HTMLElement;
    

    main.append(tournamentState, tournamentBrackets, registerUnregisterDiv);
    return main;
}

/// ---- Helpers ---- ///
function getAllPlayerNames(t: Tournament): string[] {
    const allPlayers: string[] = [];

    for (const match of t.matches) {
        allPlayers.push(match.p1User?.user?.userName ?? "Unassigned");
        allPlayers.push(match.p2User?.user?.userName ?? "Unassigned");
    }
    return allPlayers;
}

function getFirstPlayerName(t: Tournament): string | null {
    for (const match of t.matches) {
        if (match.p1User?.user?.userName) {
            return match.p1User.user.userName;
        }
    }
    return null;
}

function getNbRegisteredPlayers(players: string[]): number {
    return players.filter(name => name !== "Unassigned").length;
}
/// ---- Main Function ---- ///
export function classicTournament(): HTMLElement {
    // 1) On crée un container immédiat
    let tCode = getRouteTail("/tournament/classic");
    const container = el("div", "");
    const loading = el("p", "article-base text-center", text("Loading tournament..."));
    container.append(loading);

    // Attach listener early so we don't miss events
    document.addEventListener("tournamentUpdated", async () => {
        try {
            const updated = await getTournamentDatas(tCode);
            container.innerHTML = "";
            container.append(renderTournamentView(updated));
        } catch (err) {
            console.error("Failed to refresh tournament after update:", err);
        }
    });

    // 2) On lance le fetch en async, mais SANS rendre la fonction async
    getTournamentDatas(tCode).then((tClassicDatas) => {
        container.innerHTML = "";

        if (!tClassicDatas) {
            const errorDiv = el("div", "article-base text-center");
            errorDiv.append(text("Tournament not found."));
            container.append(errorDiv);
            return;
        }
        console.log("creator2:", tClassicDatas);
        console.log("creator2:", tClassicDatas.creatorId);

        // On Add le user loggué en tant que joueur du tournoi
        // rendre la callback async permet d'utiliser await ici sans rendre classicTournament async
        getLoggedName().then(async (name) => {
            if (!name) return;
            if (tClassicDatas.creatorId) return;

            try {
                await addUserAsPlayerToTournament(tCode, name, tClassicDatas);
                // re-fetch et re-render immédiatement après ajout
                tClassicDatas.creatorName = name;
                const updated = await getTournamentDatas(tCode);
                container.innerHTML = "";
                container.append(renderTournamentView(updated));
            } catch (err) {
                console.error("Error adding user to tournament:", err);
            }
        });

        const view = renderTournamentView(tClassicDatas);
        container.append(view);

    }).catch((err) => {
        console.error(err);
        container.innerHTML = "";
        container.append(text("Error while loading tournament."));
    });

    return container;
}