import { getRouteTail } from "../../router";
import { el, text } from "../home";
import { pongAlert, runAuthBox} from "../utils/alertBox";
import { addUserAsPlayerToTournament, getLoggedName, getTournamentDatas } from "../utils/todb";
import type { Tournament } from "./uiTypes";
import { renderTournamentBrackets } from "./brackets";
import { apiFetch } from "../utils/apiFetch";

function renderRegisterButtons(t: Tournament): HTMLElement {

    let tCode = getRouteTail("/tournament/classic");

    const div = el("div", "flex justify-center mb-4 gap-4");

    const registerTournamentBtn = el("button", "btn-click flex mb-4");
    registerTournamentBtn.textContent = "Join Tournament";
    //// Join instead of Register ////
    registerTournamentBtn.addEventListener("click", () => { runAuthBox("JOIN"); });


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
                    const response = await apiFetch("/api/tournament/players", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tournamentCode: t.tCode }),
                        credentials: "include"
                    });
                    const data = await response.json();
                    if (response.ok) {
                        pongAlert("You have been unregistered from the tournament.");
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

    div.append(registerTournamentBtn, unregisterFromTournamentBtn);
    return div;
}

function renderTournamentView(t: Tournament): HTMLElement {
    let tCode = getRouteTail("/tournament/classic");

    const main = el("div", "");
    const tCodeTitle = el("h1", `whitespace-pre-line title-hed text-center mb-6`);
    tCodeTitle.append(el("span", "", text("Welcome to Tournament:")));
    tCodeTitle.append(el("br"));
    tCodeTitle.append(el("span", "font-bold", text(t.name)));
    tCodeTitle.append(el("span", "", text(` (Code: ${tCode})`)));

    const tournamentBrackets = renderTournamentBrackets(t) as HTMLElement;
    const registerUnregisterDiv = renderRegisterButtons(t) as HTMLElement;
    

    main.append(tCodeTitle, tournamentBrackets, registerUnregisterDiv);
    return main;
}

function getAllPlayerNames(t: Tournament): string[] {
    const allPlayers: string[] = [];

    for (const match of t.matches) {
        allPlayers.push(match.p1User?.user?.userName ?? "Unassigned");
        allPlayers.push(match.p2User?.user?.userName ?? "Unassigned");
    }
    return allPlayers;
}

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
            console.log("Tournament updated event received.");
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

        // On Add le user loggué en tant que joueur du tournoi
        // rendre la callback async permet d'utiliser await ici sans rendre classicTournament async
        getLoggedName().then(async (name) => {
            if (!name) return;
            if (getAllPlayerNames(tClassicDatas).includes(name)) return;

            try {
                await addUserAsPlayerToTournament(tCode, name, tClassicDatas);
                // Optionnel : re-fetch et re-render immédiatement après ajout
                const updated = await getTournamentDatas(tCode);
                container.innerHTML = "";
                container.append(renderTournamentView(updated));
            } catch (err) {
                console.error("Error adding user to tournament:", err);
            }
        });

        const view = renderTournamentView(tClassicDatas);
        container.append(view);

        // NOTE: listener already attached above (ne le ré-attache pas ici)
    }).catch((err) => {
        console.error(err);
        container.innerHTML = "";
        container.append(text("Error while loading tournament."));
    });

    return container;
}