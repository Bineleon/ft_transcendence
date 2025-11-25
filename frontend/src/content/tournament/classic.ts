import { getRouteTail } from "../../router";
import { el, text } from "../home";
import { getTournamentDatas } from "../utils/todb";
import type { Tournament } from "../utils/types";
import { renderTournamentBrackets } from "./brackets";
// import { getTournamentDatas } from "../utils/todb";

const tCode = getRouteTail("/tournament/classic");
// const tClassicDatas: Promise<Tournament> = getTournamentDatas(tCode); 
/// FIN TEMP

function renderTournamentView(t: Tournament): HTMLElement {
    const main = el("div", "");
    const tCodeTitle = el("h1", "article-base text-center");
    tCodeTitle.append(el("span", "", text("Welcome to Tournament: ")));
    tCodeTitle.append(el("span", "font-bold", text(t.name)));
    tCodeTitle.append(el("span", "", text(` (Code: ${tCode})`)));
    const tournamentBrackets = renderTournamentBrackets(t) as HTMLElement;


    main.append(tCodeTitle, tournamentBrackets);
    return main;
}

export function classicTournament(): HTMLElement {
    // 1) On crée un container immédiat
    const container = el("div", "");
    const loading = el("p", "article-base text-center", text("Loading tournament..."));
    container.append(loading);

    const tCode = getRouteTail("/tournament/classic");

    // 2) On lance le fetch en async, mais SANS rendre la fonction async
    getTournamentDatas(tCode).then((tClassicDatas) => {
        container.innerHTML = "";

        if (!tClassicDatas) {
            const errorDiv = el("div", "article-base text-center");
            errorDiv.append(text("Tournament not found."));
            container.append(errorDiv);
            return;
        }

        const view = renderTournamentView(tClassicDatas);
        // On met la vue dans notre container
        container.append(view);
    }).catch((err) => {
        console.error(err);
        container.innerHTML = "";
        container.append(text("Error while loading tournament."));
    });

    // 3) On renvoie un DOM SYNCHRONE
    return container;
}