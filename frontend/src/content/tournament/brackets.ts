import type { Tournament } from "../utils/types";
import { el, text } from "../home";

/// HELPERS ///

function spanCirlcle(): HTMLSpanElement {
    const span = el("span", `w-4 h-4 ml-1 mr-3
        inline-block rounded-full bg-black`) as HTMLSpanElement;
    return span;
}

function listFt(label: string, extraClass = "", whithId?: string): HTMLLIElement {
    const li = el("li", `flex items-center leading-relaxed
        m-2 p-1 pr-2
        text-stone-800
        border-2 border-stone-300 rounded-full relative with-connector
        ${extraClass}`);
        if (whithId) li.id = whithId;

    const userLink = el("a", "flex-1") as HTMLAnchorElement;
    userLink.href = `#/profile/${label}`;
    userLink.append(text(label));
    li.append(spanCirlcle(), userLink);
    return li;
}

// RENDERING FUNCTIONS ///
export function renderBracket(t: Tournament): HTMLElement {
    const wrapper = el("div", "flex mr-3");

    const firstRound = renderFirstRoundColumn("round-1", 16, t, {
        markAnchorOnIndex: 0,
        extraLiClass: "first-round"
    });
    wrapper.append(firstRound);

    for (let players = 16 / 2; players >= 1; players /= 2) {
        // tu peux garder ton ID basé sur le nombre de joueurs restants si tu veux
        const roundID = `round-${players}`;
        console.log(`Rendering round: ${roundID} with ${players} slots`);

        const roundColumn = renderNextRoundsColumns(
            roundID,
            players - 1,          // ⬅ nombre de slots à dessiner pour CE round
            t,
            {
                markAnchorOnIndex: 0,
                extraLiClass: ""
            }
        );
        wrapper.append(roundColumn);
    }

    return wrapper;
}

function renderNextRoundsColumns(roundId: string, playersCount:number, t: Tournament,options?:
{ markAnchorOnIndex?: number, extraLiClass?: string } ): HTMLOListElement {
    const ol = el("ol", `flex flex-1 flex-col justify-around round`);
    
    for (let i = 0; i <= playersCount; i++) {
        const isAnchor = options?.markAnchorOnIndex === i;
        const liId = isAnchor && roundId ? roundId : undefined;
        let userName = "  'soon'  ";
        const li = listFt(userName, `font-royalvogue ${options?.extraLiClass ?? ""}`, liId);
        ol.append(li);
    }
    return ol;
}

function renderFirstRoundColumn(roundId: string, playersCount: number, t: Tournament, options?:
{ markAnchorOnIndex?: number, extraLiClass?: string } ): HTMLOListElement {
    const ol = el("ol", `flex flex-1 flex-col justify-around round`);

    for (let i = 0; i < playersCount; i++) {
        const isAnchor = options?.markAnchorOnIndex === i;
        const liId = isAnchor && roundId ? roundId : undefined;
        
        let userName = "Unassigned";
        const li = listFt(userName, `font-royalvogue ${options?.extraLiClass ?? ""}`, liId);
        ol.append(li);
    }    
    return ol;
}

export function renderTournamentBrackets(tClassicDatas: Tournament): HTMLElement {
    // Implémentation du rendu des brackets du tournoi
    const brackets = el("div", "brackets mt-4");

    brackets.append(renderBracket(tClassicDatas));

    return brackets;
}
