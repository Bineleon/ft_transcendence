import type { Tournament } from "../utils/types";
import { el, text } from "../home";

/// HELPERS ///

function spanCirlcle(): HTMLSpanElement {
    const span = el("span", `w-4 h-4 ml-1 mr-3
        inline-block rounded-full bg-gray-500`) as HTMLSpanElement;
    return span;
}

function listFt(label: string, extraClass = "", whithId?: string): HTMLLIElement {
    const li = el("li", `flex items-center leading-relaxed
        m-2 p-1
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

/// RENDERING FUNCTIONS ///
export function renderBracket(tClassicDatas: Tournament): HTMLElement {
    const wrapper = el("div", "flex mr-3");

    // for (let i = tClassicDatas.maxParticipants * 2; i > 1; i /= 2) {
    //     const roundID = `round-${i}`;
    //     const roundColumn = renderFirstRoundColumn(roundID, i / 2, tClassicDatas, {
    //         markAnchorOnIndex: 0,
    //         extraLiClass: i === tClassicDatas.maxParticipants * 2 ? "first-round" : ""
    //     });
    //     wrapper.append(roundColumn);
    // }
    const firstRound = renderFirstRoundColumn("round-1", tClassicDatas, {
        markAnchorOnIndex: 0,
        extraLiClass: "first-round"
    });
    wrapper.append(firstRound);

    let roundsLeft = tClassicDatas.maxParticipants / 2;
    for (let i = roundsLeft; i > 1; i /= 2) {
        const roundID = `round-${i}`;
        const roundColumn = renderNextRoundsColumns(roundID, i / 2, tClassicDatas, {
            markAnchorOnIndex: 0,
            extraLiClass: ""
        });
        wrapper.append(roundColumn);
    }
    return wrapper;
}

function renderNextRoundsColumns(roundId: string, matchCount:number, t: Tournament,options?:
{ markAnchorOnIndex?: number, extraLiClass?: string } ): HTMLOListElement {
    const ol = el("ol", `flex flex-1 flex-col justify-around mx-5 round`);
    
    for (let i = 0; i <= matchCount; i++) {
        const isAnchor = options?.markAnchorOnIndex === i;
        const liId = isAnchor && roundId ? roundId : undefined;
        let userName = t.players[i] ? t.players[i].userName : "TBD";
        const li = listFt(userName, `font-royalvogue ${options?.extraLiClass ?? ""}`, liId);
        ol.append(li);
    }
    return ol;
}

function renderFirstRoundColumn(roundId: string, t: Tournament,options?:
{ markAnchorOnIndex?: number, extraLiClass?: string } ): HTMLOListElement {
    const ol = el("ol", `flex flex-1 flex-col justify-around mx-5 round`);

    for (let i = 0; i < t.maxParticipants; i++) {
        const isAnchor = options?.markAnchorOnIndex === i;
        const liId = isAnchor && roundId ? roundId : undefined;

        let userName = t.players[i] ? t.players[i].userName : "TBD";
        const li = listFt(userName, `font-royalvogue ${options?.extraLiClass ?? ""}`, liId);
        ol.append(li);
    }    
    return ol;
}

export function renderTournamentBrackets(tClassicDatas: Tournament): HTMLElement {
    // Implémentation du rendu des brackets du tournoi
    const brackets = el("div", "brackets");

    brackets.append(renderBracket(tClassicDatas));

    return brackets;
}
