import { el, text } from "../home";

// Y : Dashboard related
type DailyMatchStat = {
  date: string;        // ex: "2025-12-09"
  totalMatches: number;
  wins: number;
};

export type RecentMatchAvgStats = {
    label: string;          // "Game 1", ou "M-1", ou une date
    avgRallyBounces: number;
    avgRallyTime: number;   // en secondes, par ex.
};

type RecentMatchSummary = {
    p1Username: string;
    p2Username: string;
    p1Score: number;
    p2Score: number;
    winnerUsername: string;
    playedAt?: string; // optionnel, si tu veux afficher la date plus tard
};

export async function loadDailyMatchesDashboard(dashboard: HTMLElement) {
	// 1. Appel à l'API pour récupérer les stats
	// const res = await apiFetch("/api/profile/dashboard/daily-matches", {
	//     credentials: "include",
	// });

	// 2. Vérifier si la réponse est OK (code 2xx)
	// if (!res.ok) {
	//     console.error("Failed to load daily matches stats", res.status);
	//     dashboard.innerHTML = "";
	//     const p = document.createElement("p");
	//     p.className = "article-base";
	//     p.textContent = "Unable to load match statistics.";
	//     dashboard.append(p);
	//     return;
	// }
		const fakeStats: DailyMatchStat[] = [
		{ date: "2025-12-04", totalMatches: 1, wins: 1 },
		{ date: "2025-12-05", totalMatches: 3, wins: 2 },
		{ date: "2025-12-06", totalMatches: 0, wins: 0 },
		{ date: "2025-12-07", totalMatches: 2, wins: 1 },
		{ date: "2025-12-08", totalMatches: 9, wins: 4 },
		{ date: "2025-12-09", totalMatches: 4, wins: 2 },
		{ date: "2025-12-10", totalMatches: 1, wins: 0 },
	];
	// 3. Lire le JSON de la réponse
	// const body = await res.json();

	// 4. Extraire le tableau de stats depuis body.data.stats
	// const stats = (body.data?.stats ?? []) as DailyMatchStat[];

	// 5. Appeler le renderer pour afficher le graph
	renderDailyMatchesChart(dashboard, fakeStats);
}



// Y : Pour afficher graph dashboard
export function renderDailyMatchesChart(
    dashboard: HTMLElement,
    stats: DailyMatchStat[]
) {
    // On vide le dashboard
    dashboard.innerHTML = "";

    // --- Titre ---
    const title = el("h2", "font-royalvogue text-3xl mb-4");
    title.textContent = "Matches (Last 7 days)";

    const MAX_HEIGHT = 120;

    // --- Conteneur des barres ---
	const bars = el("div", "flex items-end gap-2 w-full mt-4");
    (bars as HTMLDivElement).style.height = `${MAX_HEIGHT}px`;

    dashboard.append(title, bars);

    // --- Trouver le nombre max de matchs ---
    const maxMatches = stats.reduce(
        (max, day) => (day.totalMatches > max ? day.totalMatches : max),
        0
    );

    // Si aucun match sur la période
    if (maxMatches === 0) {
        const msg = el("p", "article-base mt-2");
        msg.textContent = "No matches played in the last 7 days.";
        dashboard.append(msg);
        return;
    }

    // --- Une colonne par jour ---
    for (const day of stats) {
        const heightPx = (day.totalMatches / maxMatches) * MAX_HEIGHT;

        // Colonne verticale
        const col = el(
            "div",
            "flex flex-col items-center gap-1 flex-1"
        );

        // Barre
        const bar = el(
            "div",
            "w-full bg-black/60 rounded-t-md transition-all duration-300"
        ) as HTMLDivElement;
        bar.style.height = `${heightPx}px`;

        // Tooltip au survol
        bar.title = `Matches: ${day.totalMatches} | Wins: ${day.wins}`;

        // Label de date (MM-DD)
        const dateLabel = el(
            "span",
            "text-xs font-modern-type"
        );
        dateLabel.textContent = day.date.slice(5); // "12-04"

        // Label numérique sous la date
        const statsLabel = el(
            "span",
            "text-[10px] font-modern-type text-stone-600"
        );
        statsLabel.textContent = `${day.totalMatches} M / ${day.wins} W`;

        col.append(bar, dateLabel, statsLabel);
        bars.append(col);
    }
	    // --- Section du 2e graph : "Last 3 matches – rallies" ---
    const ralliesSection = el("div", "w-full mt-6");
    dashboard.append(ralliesSection);

    // Fake data pour tester (on branchera le backend plus tard)
    const fakeRallies: RecentMatchAvgStats[] = [
        { label: "Game 1", avgRallyBounces: 6.2, avgRallyTime: 3.4 },
        { label: "Game 2", avgRallyBounces: 3.8, avgRallyTime: 2.1 },
        { label: "Game 3", avgRallyBounces: 9.1, avgRallyTime: 4.7 },
    ];

    renderRecentRalliesChart(ralliesSection, fakeRallies);

	    // --- Section du 3e bloc : "Last matches" ---
    const historySection = el("div", "w-full mt-6");
    dashboard.append(historySection);

    // Fake data pour tester (on branchera le backend plus tard)
    const fakeHistory: RecentMatchSummary[] = [
        {
            p1Username: "Alice",
            p2Username: "Bob",
            p1Score: 5,
            p2Score: 3,
            winnerUsername: "Alice",
        },
        {
            p1Username: "Charlie",
            p2Username: "Dana",
            p1Score: 2,
            p2Score: 5,
            winnerUsername: "Dana",
        },
        {
            p1Username: "Eve",
            p2Username: "Frank",
            p1Score: 4,
            p2Score: 4,
            winnerUsername: "Eve", 
        },
        {
            p1Username: "Grace",
            p2Username: "Heidi",
            p1Score: 1,
            p2Score: 5,
            winnerUsername: "Heidi",
        },
        {
            p1Username: "Ivan",
            p2Username: "Judy",
            p1Score: 5,
            p2Score: 0,
            winnerUsername: "Ivan",
        },
    ];

    renderRecentMatchesHistory(historySection, fakeHistory);
}


export function renderRecentRalliesChart(
    container: HTMLElement,
    stats: RecentMatchAvgStats[]
) {
    // On vide uniquement ce sous-container, pas tout le dashboard
    container.innerHTML = "";

    // --- Titre ---
    const title = el("h3", "font-royalvogue text-2xl mt-6 mb-3");
    title.textContent = "Last 3 matches";

    const MAX_HEIGHT = 100;

    // Conteneur vertical pour les colonnes
    const rows = el("div", "flex gap-4 w-full mt-4");

    container.append(title, rows);

    // Trouver les max pour normaliser les hauteurs
    const maxBounces = stats.reduce(
        (max, m) => (m.avgRallyBounces > max ? m.avgRallyBounces : max),
        0
    );
    const maxTime = stats.reduce(
        (max, m) => (m.avgRallyTime > max ? m.avgRallyTime : max),
        0
    );

    // Si tout est à 0 → petit message
    if (maxBounces === 0 && maxTime === 0) {
        const msg = el("p", "article-base mt-2");
        msg.textContent = "No rally data available for the last matches.";
        container.append(msg);
        return;
    }

    // Une "colonne" par match
    for (const match of stats) {
        const col = el(
            "div",
            "flex flex-col items-center gap-1 flex-1"
        );

        // Conteneur des 2 barres (bounces + time)
        const barGroup = el(
            "div",
            "flex items-end gap-1 w-full h-[100px]"
        ) as HTMLDivElement;

        // Hauteurs relatives
        const bouncesHeight =
            maxBounces === 0
                ? 0
                : (match.avgRallyBounces / maxBounces) * MAX_HEIGHT;
        const timeHeight =
            maxTime === 0
                ? 0
                : (match.avgRallyTime / maxTime) * MAX_HEIGHT;

        // Barre Bounces (gauche)
        const bounceBar = el(
            "div",
            "flex-1 bg-black/70 rounded-t-md transition-all duration-300"
        ) as HTMLDivElement;
        bounceBar.style.height = `${bouncesHeight}px`;
        bounceBar.title = `Avg bounces: ${match.avgRallyBounces.toFixed(1)}`;

        // Barre Time (droite)
        const timeBar = el(
            "div",
            "flex-1 bg-black/30 rounded-t-md transition-all duration-300"
        ) as HTMLDivElement;
        timeBar.style.height = `${timeHeight}px`;
        timeBar.title = `Avg time: ${match.avgRallyTime.toFixed(1)}s`;

        barGroup.append(bounceBar, timeBar);

        // Label du match
        const matchLabel = el(
            "span",
            "text-xs font-modern-type"
        );
        matchLabel.textContent = match.label;

        // Petit label numérique en dessous
        const numbers = el(
            "span",
            "text-[10px] font-modern-type text-stone-600"
        );
        numbers.textContent = `Bounces: ${match.avgRallyBounces.toFixed(1)} | Game length : ${match.avgRallyTime.toFixed(1)}s`;

        col.append(barGroup, matchLabel, numbers);
        rows.append(col);
    }
}

export function renderRecentMatchesHistory(
    container: HTMLElement,
    matches: RecentMatchSummary[]
) {
    // On nettoie le conteneur
    container.innerHTML = "";

    // Titre de la section
    const title = el("h3", "font-royalvogue text-2xl mt-6 mb-3");
    title.textContent = "Last matches";

    // Liste des matchs
    const list = el(
        "ul",
        "w-full space-y-2 font-modern-type text-sm"
    ) as HTMLUListElement;

    // Si aucun match
    if (!matches.length) {
        const li = document.createElement("li");
        li.className = "italic text-stone-500";
        li.textContent = "No recent matches.";
        list.append(li);
    } else {
        // On limite à 5 matches (au cas où on en reçoit plus)
        const sliced = matches.slice(0, 5);

        for (const match of sliced) {
            const li = document.createElement("li");
            li.className =
                "flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-300 pb-1";

            // Partie gauche : p1 vs p2 + score
            const players = el(
                "div",
                "flex flex-wrap items-baseline gap-2"
            );
            const names = el("span", "font-semibold");
            names.textContent = `${match.p1Username} vs ${match.p2Username}`;

            const score = el(
                "span",
                "text-xs text-stone-700"
            );
            score.textContent = `Score: ${match.p1Score} - ${match.p2Score}`;

            players.append(names, score);

            // Partie droite : winner (+ éventuellement date)
            const meta = el(
                "div",
                "text-xs text-stone-600 mt-1 sm:mt-0 text-right"
            );
            meta.textContent = `Winner: ${match.winnerUsername}`;

            li.append(players, meta);
            list.append(li);
        }
    }

    container.append(title, list);
}
