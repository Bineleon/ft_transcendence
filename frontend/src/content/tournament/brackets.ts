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
    if (label === "Unassigned" || label === `soon`) {
        userLink.clickable = false;
    } else {
        userLink.href = `#/profile/${label}`;
    }
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

    let roundNb = 2;
    for (let nbPlayers = t.maxParticipants / 2; nbPlayers >= 1; nbPlayers /= 2) {
        // tu peux garder ton ID basé sur le nombre de joueurs restants si tu veux

        const roundColumn = renderNextRoundsColumns(
            roundNb,
            nbPlayers - 1,          // ⬅ nombre de slots à dessiner pour CE round
            { markAnchorOnIndex: 0, extraLiClass: "", t: t }
        );
        wrapper.append(roundColumn);
        roundNb++;
    }

    return wrapper;
}

function renderNextRoundsColumns(
  roundNb: number,
  playersCount: number,
  options?: { markAnchorOnIndex?: number; extraLiClass?: string; t: Tournament }
): HTMLOListElement {
  const ol = el("ol", "flex flex-1 flex-col justify-around round");

  const prevMatches = options?.t.matches.filter(m => m.round === roundNb - 1) ?? [];
  const nextMatches = options?.t.matches.filter(m => m.round === roundNb) ?? [];

  for (let i = 0; i <= playersCount; i++) {
    const isAnchor = options?.markAnchorOnIndex === i;
    const liId = isAnchor ? `round-${roundNb}` : undefined;

    const prev = prevMatches[i];
    let userName = "soon";
    let border = "";

    if (prev && prev.status === "CLOSED") {
		console.log("prev :", prev);
      userName = getWinnerNameFromMatch(prev);
		console.log("winnerName : ", userName);

      // Le match suivant correspondant à ce slot:
      const next = nextMatches[Math.floor(i / 2)];

      if (next && next.status === "CLOSED") {
        const nextWinner = getWinnerNameFromMatch(next);
        if (nextWinner === userName) {
          border = "border-6 border-double border-stone-400";
        }
      }
    }
    const lastMatchRound = Math.max(...(options?.t.matches ?? []).map(m => m.round));
    const isChampionColumn = (roundNb === lastMatchRound + 1) && (playersCount === 0);

    if (isChampionColumn) {
        if (userName !== "soon") {
            border = "border-8 border-double border-yellow-500 shadow-lg scale-105";
        }
    }
    const li = listFt(
      userName,
      `font-royalvogue ${options?.extraLiClass ?? ""} ${border}`,
      liId
    );
    ol.append(li);
  }

  return ol;
}

function getWinnerNameFromMatch(m: any): string {
    if (m.status !== "CLOSED") return "soon";

    if ((m.p1User?.winner ?? 0) > (m.p2User?.winner ?? 0)) {
        return m.p1User?.user?.userName ?? "soon";
    } else {
        return m.p2User?.user?.userName ?? "soon";
    }
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
    
        let border = "";

        if (t.matches) {
            for (const m of t.matches) {
                if (m.status === "CLOSED") {
                    const winnerName = getWinnerNameFromMatch(m);
                    if (winnerName === userName) {
                        border = "border-6 border-double border-stone-400";
                    }
                }
            }
        }

        const li = listFt(
            userName,
            `font-royalvogue ${options?.extraLiClass ?? ""} ${border}`,
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
