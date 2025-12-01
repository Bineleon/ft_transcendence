import { getRouteTail } from "../../router";
import { el, text } from "../home";
import { pongAlert, registerAlertBox, reLogAlert } from "../utils/logchecks";
import { addUserAsPlayerToTournament, getLoggedName, getTournamentDatas } from "../utils/todb";
import type { Tournament } from "../utils/types";
import { renderTournamentBrackets } from "./brackets";

function renderRegisterButtons(t: Tournament): HTMLElement {

    let tCode = getRouteTail("/tournament/classic");

    const div = el("div", "flex justify-center mb-4 gap-4");
    const registerTournamentBtn = el("button", "btn-click flex mb-4");
    registerTournamentBtn.textContent = "Register for Tournament";
    registerTournamentBtn.addEventListener("click", () => {
        registerAlertBox(tCode);
    });
    const unregisterFromTournamentBtn = el("button", "btn-click flex mb-4");
    getLoggedName().then((who) => {
        if (!who) {
            unregisterFromTournamentBtn.textContent = "Log in to Unregister";
            unregisterFromTournamentBtn.addEventListener("click", () => {
                reLogAlert("Please Log in to unregister from a tournament.");
            });
        } else {
            unregisterFromTournamentBtn.textContent = `Unregister as ${who}`;
            unregisterFromTournamentBtn.addEventListener("click", async () => {
                try {
                    const response = await fetch("/api/tournament/players", {
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

export function classicTournament(): HTMLElement {
    // 1) On crée un container immédiat
	let tCode = getRouteTail("/tournament/classic");
    const container = el("div", "");
    const loading = el("p", "article-base text-center", text("Loading tournament..."));
    container.append(loading);

	console.log("tCode", tCode);
    // 2) On lance le fetch en async, mais SANS rendre la fonction async
    getTournamentDatas(tCode).then((tClassicDatas) => {
        container.innerHTML = "";

        if (!tClassicDatas) {
            const errorDiv = el("div", "article-base text-center");
            errorDiv.append(text("Tournament not found."));
            container.append(errorDiv);
            return;
        }
        console.log("Tournament datas loaded:", tClassicDatas);

        // On Add le user loggué en tant que joueur du tournoi
        getLoggedName().then((name) => {
            if (name) {
                // addUserAsPlayerToTournament(tClassicDatas.tCode, name)
                //     .catch((err) => {
                //         console.error("Error adding user to tournament:", err);
                //     });
            }
        }).catch((err) => {
            console.error("Error getting logged name:", err);
        });

        const view = renderTournamentView(tClassicDatas);
        container.append(view);
    }).catch((err) => {
        console.error(err);
        container.innerHTML = "";
        container.append(text("Error while loading tournament."));
    });


    // 3) On renvoie un DOM SYNCHRONE
    return container;
}