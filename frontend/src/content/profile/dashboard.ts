import { el } from "../home";
import { apiFetch } from "../utils/apiFetch";

// Y : Dashboard related
type DailyMatchStat = {
  date: string;
  totalMatches: number;
  wins: number;
};

export type RecentMatchAvgStats = {
  label: string;
  avgRallyBounces: number;
  avgRallyTime: number;
};

type RecentMatchSummary = {
  p1Username: string;
  p2Username: string;
  p1Score: number;
  p2Score: number;
  winnerUsername: string;
  playedAt?: string;
};

type RecentSnakeMatchSummary = {
  p1Username: string;
  p2Username: string;
  p1Score: number;
  p2Score: number;
  p1Collectibles: number;
  p2Collectibles: number;
  winnerUsername: string;
  playedAt: string;
};

export async function loadDailyMatchesDashboard(dashboard: HTMLElement) {
  // 1) Graph 1 : daily matches
  const res = await apiFetch("/api/profile/dashboard/daily-matches", {
    credentials: "include",
  });

  if (!res.ok) {
    console.error("Failed to load daily matches stats", res.status);
    dashboard.innerHTML = "";
    const p = document.createElement("p");
    p.className = "article-base";
    p.textContent = "Unable to load match statistics.";
    dashboard.append(p);
    return;
  }

  const body = await res.json();
  const stats = (body.data?.stats ?? []) as DailyMatchStat[];

  // 2) Graph 2 : recent rallies
  const resRallies = await apiFetch("/api/profile/dashboard/recent-rallies", {
    credentials: "include",
  });

  let rallies: RecentMatchAvgStats[] = [];

  if (resRallies.ok) {
    const bodyRallies = await resRallies.json();
    rallies = (bodyRallies.data?.stats ?? []) as RecentMatchAvgStats[];
  } else {
    console.error("Failed to load recent rallies", resRallies.status);
  }

  // 3) Graph 3 : recent matches history
  const resRecentMatches = await apiFetch("/api/profile/dashboard/recent-matches", {
    credentials: "include",
  });

  let recentMatches: RecentMatchSummary[] = [];

  if (resRecentMatches.ok) {
    const bodyRecentMatches = await resRecentMatches.json();
    recentMatches = (bodyRecentMatches.data?.matches ?? []) as RecentMatchSummary[];
  } else {
    console.error("Failed to load recent matches", resRecentMatches.status);
  }

  // Render tout le dashboard
  renderDailyMatchesChart(dashboard, stats, rallies, recentMatches);
}

// Nouveau mode (layout en 4 colonnes) : on remplit chaque box séparément.
export async function loadProfileDashboardSections(
  last7days: HTMLElement,
  lastScores: HTMLElement,
  last3Matches: HTMLElement,
  snakeStats: HTMLElement,
  username?: string
) {
  // Build query string if username is provided
  const queryParam = username ? `?username=${encodeURIComponent(username)}` : '';
  
  // 1) Graph 1 : daily matches
  const res = await apiFetch(`/api/profile/dashboard/daily-matches${queryParam}`, {
    credentials: "include",
  });

  if (!res.ok) {
    console.error("Failed to load daily matches stats", res.status);
    last7days.innerHTML = "";
    const p = document.createElement("p");
    p.className = "article-base";
    p.textContent = "Unable to load match statistics.";
    last7days.append(p);
    // On laisse les autres sections tranquilles.
    return;
  }

  const body = await res.json();
  const stats = (body.data?.stats ?? []) as DailyMatchStat[];

  // 2) Graph 2 : recent rallies
  const resRallies = await apiFetch(`/api/profile/dashboard/recent-rallies${queryParam}`, {
    credentials: "include",
  });

  let rallies: RecentMatchAvgStats[] = [];
  if (resRallies.ok) {
    const bodyRallies = await resRallies.json();
    rallies = (bodyRallies.data?.stats ?? []) as RecentMatchAvgStats[];
  } else {
    console.error("Failed to load recent rallies", resRallies.status);
  }

  // 3) Graph 3 : recent matches history
  const resRecentMatches = await apiFetch(
    `/api/profile/dashboard/recent-matches${queryParam}`,
    {
      credentials: "include",
    }
  );

  let recentMatches: RecentMatchSummary[] = [];
  if (resRecentMatches.ok) {
    const bodyRecentMatches = await resRecentMatches.json();
    recentMatches = (bodyRecentMatches.data?.matches ?? []) as RecentMatchSummary[];
  } else {
    console.error("Failed to load recent matches", resRecentMatches.status);
  }

  // 4) Graph 4 : recent Snake matches
  console.log('[Dashboard] Fetching recent Snake matches...');
  const resSnakeMatches = await apiFetch(
    `/api/profile/dashboard/recent-snake-matches${queryParam}`,
    {
      credentials: "include",
    }
  );

  let snakeMatches: RecentSnakeMatchSummary[] = [];
  if (resSnakeMatches.ok) {
    const bodySnakeMatches = await resSnakeMatches.json();
    console.log('[Dashboard] Snake matches response body:', bodySnakeMatches);
    console.log('[Dashboard] Snake matches data:', bodySnakeMatches.data);
    console.log('[Dashboard] Snake matches array:', bodySnakeMatches.data?.matches);
    snakeMatches = (bodySnakeMatches.data?.matches ?? []) as RecentSnakeMatchSummary[];
    console.log('[Dashboard] Parsed Snake matches:', snakeMatches);
    console.log('[Dashboard] Number of Snake matches:', snakeMatches.length);
  } else {
    console.error("[Dashboard] Failed to load recent snake matches. Status:", resSnakeMatches.status);
    console.error("[Dashboard] Response:", await resSnakeMatches.text());
  }

  // Render par section
  renderLast7DaysChart(last7days, stats);
  renderRecentRalliesChart(lastScores, rallies);
  renderRecentMatchesHistory(last3Matches, recentMatches);
  renderRecentSnakeMatchesHistory(snakeStats, snakeMatches);
}

// export function renderLast7DaysChart(container: HTMLElement, stats: DailyMatchStat[]) {
//   container.innerHTML = "";

//   const title = el("h2", "font-minecraft tracking-widest text-2xl mt-6 mb-3");
//   title.textContent = "Matches (Last 7 days)";

//   const MAX_HEIGHT = 120;
//   const bars = el("div", "flex items-end gap-2 w-full mt-4") as HTMLDivElement;
//   bars.style.height = "170px";

//   container.append(title, bars);

//   const maxMatches = stats.reduce(
//     (max, day) => (day.totalMatches > max ? day.totalMatches : max),
//     0
//   );

//   if (maxMatches === 0) {
//     const msg = el("p", "article-base mt-2");
//     msg.textContent = "No matches played in the last 7 days.";
//     container.append(msg);
//     return;
//   }

//   for (const day of stats) {
//     const heightPx = (day.totalMatches / maxMatches) * MAX_HEIGHT;

//     const col = el("div", "flex flex-col items-center gap-1 flex-1");
//     const bar = el(
//       "div",
//       "w-full bg-black/60 rounded-t-md transition-all duration-300"
//     ) as HTMLDivElement;
//     bar.style.height = `${heightPx}px`;
//     bar.title = `Matches: ${day.totalMatches} | Wins: ${day.wins}`;

//     const dateLabel = el("span", "text-xs font-modern-type");
//     dateLabel.textContent = day.date.slice(5);

//     const statsLabel = el("span", "text-[10px] font-modern-type text-stone-600");
//     statsLabel.textContent = `${day.totalMatches} M / ${day.wins} W`;

//     col.append(bar, dateLabel, statsLabel);
//     bars.append(col);
//   }
// }

function renderLast7DaysChart(container: HTMLElement, stats: DailyMatchStat[]) {
  container.innerHTML = "";

  const title = el("h2", "font-minecraft tracking-widest text-2xl mt-6 mb-3");
  title.textContent = "Matches (Last 7 days)";

  const MAX_HEIGHT = 120;

  // Wrapper qui autorise le scroll horizontal si l'écran devient trop petit
  const scrollWrap = el("div", "w-full overflow-x-auto") as HTMLDivElement;

  // Le graphe : on empêche l'écrasement en autorisant un min-width total
  const bars = el("div", "flex items-end gap-2 w-full mt-4 min-w-[420px]") as HTMLDivElement;

  scrollWrap.append(bars);
  container.append(title, scrollWrap);

  const maxMatches = stats.reduce(
    (max, day) => (day.totalMatches > max ? day.totalMatches : max),
    0
  );

  for (const day of stats) {
    const heightPx =
      maxMatches === 0 ? 0 : Math.round((day.totalMatches / maxMatches) * MAX_HEIGHT);

    // IMPORTANT :
    // - flex-1 => partage l'espace
    // - min-w-[52px] => garde assez de place pour les labels
    const col = el(
      "div",
      "flex flex-col items-center gap-1 flex-1 min-w-[52px]"
    ) as HTMLDivElement;

    const bar = el(
      "div",
      "w-full bg-black/60 rounded-t-md transition-all duration-300"
    ) as HTMLDivElement;

    bar.style.height = `${heightPx}px`;
    bar.title = `Matches: ${day.totalMatches} | Wins: ${day.wins}`;

    // Labels lisibles : pas de truncate, on garde du nowrap
    const dateLabel = el("span", "text-xs font-modern-type whitespace-nowrap leading-tight");
    dateLabel.textContent = day.date.slice(5);

    const statsLabel = el(
      "span",
      "text-[10px] font-modern-type text-stone-600 whitespace-nowrap leading-tight"
    );
    statsLabel.textContent = `${day.totalMatches} M / ${day.wins} W`;

    col.append(bar, dateLabel, statsLabel);
    bars.append(col);
  }
}


export function renderDailyMatchesChart(
  dashboard: HTMLElement,
  stats: DailyMatchStat[],
  rallies: RecentMatchAvgStats[],
  recentMatches: RecentMatchSummary[]
) {
  dashboard.innerHTML = "";

  // --- Title graph 1 ---
  const title = el("h2", "font-minecraft tracking-widest text-2xl mt-6 mb-3");
  title.textContent = "Matches (Last 7 days)";

  const MAX_HEIGHT = 120;

  const bars = el("div", "flex items-end gap-2 w-full mt-4");
  (bars as HTMLDivElement).style.height = `${MAX_HEIGHT}px`;

  dashboard.append(title, bars);

  const maxMatches = stats.reduce(
    (max, day) => (day.totalMatches > max ? day.totalMatches : max),
    0
  );

  if (maxMatches === 0) {
    const msg = el("p", "article-base mt-2");
    msg.textContent = "No matches played in the last 7 days.";
    dashboard.append(msg);
    return;
  }

  for (const day of stats) {
    const heightPx = (day.totalMatches / maxMatches) * MAX_HEIGHT;

    const col = el("div", "flex flex-col items-center gap-1 flex-1");

    const bar = el(
      "div",
      "w-full bg-black/60 rounded-t-md transition-all duration-300"
    ) as HTMLDivElement;
    bar.style.height = `${heightPx}px`;
    bar.title = `Matches: ${day.totalMatches} | Wins: ${day.wins}`;

    const dateLabel = el("span", "text-xs font-modern-type");
    dateLabel.textContent = day.date.slice(5);

    const statsLabel = el("span", "text-[10px] font-modern-type text-stone-600");
    statsLabel.textContent = `${day.totalMatches} M / ${day.wins} W`;

    col.append(bar, dateLabel, statsLabel);
    bars.append(col);
  }

  // --- Graph 2 : rallies ---
  const ralliesSection = el("div", "w-full mt-6");
  dashboard.append(ralliesSection);
  renderRecentRalliesChart(ralliesSection, rallies);

  // --- Graph 3 : history ---
  const historySection = el("div", "w-full mt-6");
  dashboard.append(historySection);
  renderRecentMatchesHistory(historySection, recentMatches);
}

export function renderRecentRalliesChart(
  container: HTMLElement,
  stats: RecentMatchAvgStats[]
) {
  container.innerHTML = "";

  const title = el("h3", "font-minecraft tracking-widest text-2xl mt-6 mb-3");
  title.textContent = "Last 3 matches";

  const MAX_HEIGHT = 100;

  const rows = el("div", "flex gap-4 w-full mt-4");
  container.append(title, rows);

  const maxBounces = stats.reduce(
    (max, m) => (m.avgRallyBounces > max ? m.avgRallyBounces : max),
    0
  );
  const maxTime = stats.reduce(
    (max, m) => (m.avgRallyTime > max ? m.avgRallyTime : max),
    0
  );

  if (maxBounces === 0 && maxTime === 0) {
    const msg = el("p", "article-base mt-2");
    msg.textContent = "No rally data available for the last matches.";
    container.append(msg);
    return;
  }

  for (const match of stats) {
    const col = el("div", "flex flex-col items-center gap-1 flex-1");

    const barGroup = el("div", "flex items-end gap-1 w-full h-[100px]") as HTMLDivElement;

    const bouncesHeight =
      maxBounces === 0 ? 0 : (match.avgRallyBounces / maxBounces) * MAX_HEIGHT;
    const timeHeight =
      maxTime === 0 ? 0 : (match.avgRallyTime / maxTime) * MAX_HEIGHT;

    const bounceBar = el(
      "div",
      "flex-1 bg-black/70 rounded-t-md transition-all duration-300"
    ) as HTMLDivElement;
    bounceBar.style.height = `${bouncesHeight}px`;
    bounceBar.title = `Avg bounces: ${match.avgRallyBounces.toFixed(1)}`;

    const timeBar = el(
      "div",
      "flex-1 bg-black/30 rounded-t-md transition-all duration-300"
    ) as HTMLDivElement;
    timeBar.style.height = `${timeHeight}px`;
    timeBar.title = `Avg time: ${match.avgRallyTime.toFixed(1)}s`;

    barGroup.append(bounceBar, timeBar);

    const matchLabel = el("span", "text-xs font-modern-type");
    matchLabel.textContent = match.label;

    const numbers = el("span", "text-[10px] font-modern-type text-stone-600");
    numbers.textContent = `Bounces: ${match.avgRallyBounces.toFixed(1)} | Game length : ${match.avgRallyTime.toFixed(1)}s`;

    col.append(barGroup, matchLabel, numbers);
    rows.append(col);
  }
}

export function renderRecentMatchesHistory(
  container: HTMLElement,
  matches: RecentMatchSummary[]
) {
  container.innerHTML = "";

  const title = el("h3", "font-minecraft tracking-widest text-2xl mt-6 mb-3");
  title.textContent = "Last matches";

  const list = el("ul", "w-full space-y-2 font-modern-type text-sm") as HTMLUListElement;

  if (!matches.length) {
    const li = document.createElement("li");
    li.className = "italic text-stone-500";
    li.textContent = "No recent matches.";
    list.append(li);
  } else {
    const sliced = matches.slice(0, 5);

    for (const match of sliced) {
      const li = document.createElement("li");
      li.className =
        "flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-300 pb-1";

      const players = el("div", "flex flex-wrap items-baseline gap-2");
      const names = el("span", "font-semibold");
      names.textContent = `${match.p1Username} vs ${match.p2Username}`;

      const score = el("span", "text-xs text-stone-700");
      score.textContent = `Score: ${match.p1Score} - ${match.p2Score}`;

      players.append(names, score);

      const meta = el("div", "text-xs text-stone-600 mt-1 sm:mt-0 text-right");
      meta.textContent = `Winner: ${match.winnerUsername}`;

      li.append(players, meta);
      list.append(li);
    }
  }

  container.append(title, list);
}

export function renderRecentSnakeMatchesHistory(
  container: HTMLElement,
  matches: RecentSnakeMatchSummary[]
) {
  console.log('[renderRecentSnakeMatchesHistory] Called with', matches.length, 'matches');
  console.log('[renderRecentSnakeMatchesHistory] Matches data:', JSON.stringify(matches, null, 2));
  
  container.innerHTML = "";

  const title = el("h3", "font-minecraft tracking-widest text-2xl mt-6 mb-3");
  title.textContent = "Snake - Last 3 matches";

  const list = el("ul", "w-full space-y-2 font-modern-type text-sm") as HTMLUListElement;

  if (!matches.length) {
    console.log('[renderRecentSnakeMatchesHistory] No matches to display');
    const li = document.createElement("li");
    li.className = "italic text-stone-500";
    li.textContent = "No recent snake matches.";
    list.append(li);
  } else {
    console.log('[renderRecentSnakeMatchesHistory] Rendering', matches.length, 'matches');
    for (const match of matches) {
      console.log('[renderRecentSnakeMatchesHistory] Rendering match:', match);
      
      const li = document.createElement("li");
      li.className =
        "flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-300 pb-1";

      const players = el("div", "flex flex-wrap items-baseline gap-2");
      const names = el("span", "font-semibold");
      names.textContent = `${match.p1Username} vs ${match.p2Username}`;

      const score = el("span", "text-xs text-stone-700");
      score.textContent = `Score: ${match.p1Score} - ${match.p2Score}`;

      const collectibles = el("span", "text-xs text-stone-500");
      collectibles.textContent = `Collectibles: ${match.p1Collectibles} - ${match.p2Collectibles}`;

      players.append(names, score, collectibles);

      const meta = el("div", "text-xs text-stone-600 mt-1 sm:mt-0 text-right");
      meta.textContent = `Winner: ${match.winnerUsername}`;

      li.append(players, meta);
      list.append(li);
    }
  }

  console.log('[renderRecentSnakeMatchesHistory] Rendering complete');
  container.append(title, list);
}
