import type { Tournament } from "./uiTypes";
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
    const wrapper = el("div", "flex mr-3 mt-8");

    const firstRound = renderFirstRoundColumn(t, "round-1", t.maxParticipants, {
        markAnchorOnIndex: 0,
        extraLiClass: "first-round"
    });
    wrapper.append(firstRound);

    for (let nbPlayers = t.maxParticipants / 2; nbPlayers >= 1; nbPlayers /= 2) {
        // tu peux garder ton ID basé sur le nombre de joueurs restants si tu veux
        const roundID = `round-${nbPlayers}`;

        const roundColumn = renderNextRoundsColumns(
            roundID,
            nbPlayers - 1,          // ⬅ nombre de slots à dessiner pour CE round
            { markAnchorOnIndex: 0, extraLiClass: "" }
        );
        wrapper.append(roundColumn);
    }

    return wrapper;
}

function renderNextRoundsColumns(roundId: string, playersCount:number,options?:
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

function renderFirstRoundColumn(t: Tournament, roundId: string, playersCount: number,
    options?: { markAnchorOnIndex?: number; extraLiClass?: string }): HTMLOListElement {
    const ol = el("ol", "flex flex-1 flex-col justify-around round");

    // 1. On ne prend que les matchs du round 1 (ou le round que tu veux)
    const firstRoundMatches = t.matches.filter((m) => m.round === 1);

    // 2. On prépare une liste "flat" de slots (un slot = un joueur potentiel)
    const slots: string[] = [];

    for (const match of firstRoundMatches) {
        slots.push(match.p1User?.user?.userName ?? "Unassigned");
        slots.push(match.p2User?.user?.userName ?? "Unassigned");
    }

    // Si on n’a pas assez de slots, on complète
    while (slots.length < playersCount) {
        slots.push("Unassigned");
    }

    // 3. On génère les <li> à partir de slots[i]
    for (let i = 0; i < playersCount; i++) {
        const isAnchor = options?.markAnchorOnIndex === i;
        const liId = isAnchor && roundId ? roundId : undefined;

        const userName = slots[i] ?? "Unassigned";

        const li = listFt(
            userName,
            `font-royalvogue ${options?.extraLiClass ?? ""}`,
            liId
        );

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
