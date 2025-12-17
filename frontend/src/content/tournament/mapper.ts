import type { ApiTournament, ApiMatch, ApiMatchUser,
  ApiMatchStatsDTO, ApiPlayerStatsDTO } from "./apiTypes";
import type { Tournament, Match, User, tStatus } from "./uiTypes";
import type { tournamentMode } from "../tournament/tournament";
import type { MatchStats, PlayerMatchStats, LiveMatchStats } from "../pong/game/uiTypes";

function userFromApi(apiUser: ApiMatchUser): User {
  return {
    userId: apiUser.userId,
    userName: apiUser.alias || apiUser.username,  // Utiliser l'alias en priorité
    alias: apiUser.alias || undefined,
    avatarUrl: apiUser.avatarUrl || null,
    createdAt: "",
    updatedAt: "",
    friendOf: [],
    friends: [],
    matchesWon: [],
    matchesAsP2: [],
    matchesAsP1: [],
    createdTournaments: [],
  };
}

function matchUserFromApi(apiMUser: ApiMatchUser | null, score: number | null, isWinner: boolean): Match["p1User"] | Match["p2User"] {
  if (!apiMUser) {
    return null;
  }
  const user: User = userFromApi(apiMUser);

  let win: boolean;
  if (score === 3) {
	win = true;
  } else {
	win = false;
  }

  return {
    user: user,
    score: score,
    maxSpeed: null,
    maxEffects: null,
    winner: win,
  };
}

export function matchFromApi(apiM: ApiMatch): Match {
  return {
    matchId: apiM.id,
    round: apiM.round,
    tournamentId: apiM.tournamentId,
    p1User: matchUserFromApi(
        apiM.p1 ?? null,
        apiM.p1Score ?? null, 
        apiM.winnerUserName === apiM.p1UserName),
    p2User: matchUserFromApi(
        apiM.p2 ?? null,
        apiM.p2Score ?? null, 
        apiM.winnerUserName === apiM.p2UserName),
    status: apiM.status,
  };
}

export function tournamentFromApi(apiT: ApiTournament): Tournament {

  const matchs: Match[] = (apiT.matches ?? []).map(matchFromApi);
  return {
    tCode: apiT.code,
    name: apiT.name,
    tMode: apiT.mode as tournamentMode,
    status: apiT.status as tStatus,
    creatorName: apiT.creator.username ?? "",
    maxParticipants: apiT.maxParticipants,
    kingMaxTime: apiT.kingMaxTime ?? undefined,
    kingMaxRounds: apiT.kingMaxRounds ?? undefined,
    matches: (apiT.matches ?? []).map(matchFromApi),
  };
}


export function playedMatchStatsToApi(matchStats: MatchStats, tCode?: string, tMode?: tournamentMode): ApiMatch {
  const { p1, p2 } = matchStats;

  const apiP1: ApiMatchUser = {
    username: p1.userName,
    score: p1.score,
    maxWins: p1.maxWins,
    totalBallSpins: p1.totalBallSpins,
    maxBouncesInWonRally: p1.maxBouncesInWonRally,
    maxEffectsInWonRally: p1.maxEffectsInWonRally,
    fastestWonRally: p1.fastestWonRally,
    fastestWonMatch: p1.fastestWonMatch,
    fastestLostRally: p1.fastestLostRally,
    fastestLostMatch: p1.fastestLostMatch,
    ralliesWon: p1.ralliesWon,
    ralliesLost: p1.ralliesLost,
  };

  const apiP2: ApiMatchUser = {
    username: p2.userName,
    score: p2.score,
    maxWins: p2.maxWins,
    totalBallSpins: p2.totalBallSpins,
    maxBouncesInWonRally: p2.maxBouncesInWonRally,
    maxEffectsInWonRally: p2.maxEffectsInWonRally,
    fastestWonRally: p2.fastestWonRally,
    fastestWonMatch: p2.fastestWonMatch,
    fastestLostRally: p2.fastestLostRally,
    fastestLostMatch: p2.fastestLostMatch,
    ralliesWon: p2.ralliesWon,
    ralliesLost: p2.ralliesLost,
  };

  return {
    id: matchStats.matchId,
    tournamentCode: tCode,
    gameCode: tMode,
    round: matchStats.round,
    gameIndex: matchStats.gameIndex,

    p1UserName: p1.userName,
    p1Score: p1.score,
    p1IsGuest: matchStats.p1IsGuest,

    p2UserName: p2.userName,
    p2Score: p2.score,
    p2IsGuest: matchStats.p2IsGuest,

    // Match stats
    totalPoints: matchStats.totalPoints,
    winnerName: matchStats.winnerName,
    loserName: matchStats.loserName,
    totalRallies: matchStats.totalRallies,
    maxBounces: matchStats.maxBounces,
    avgRallyBounces: matchStats.avgRallyBounces,
    totalMatchTime: matchStats.totalMatchTime,
    avgRallyTime: matchStats.avgRallyTime,

    p1: apiP1,
    p2: apiP2,
  };
}

export function liveStatsToMatchStats(live: LiveMatchStats): MatchStats {
  console.log("STATS :", live);
  const { p1, p2, totalBounces, totalRallies, lastScorer } = live;

  const totalPoints = live.p1.score + live.p2.score;

  let winnerName: string;
  let loserName: string;
  let winnerUserId: string;

  if (live.p1.score > live.p2.score) {
    winnerName = live.p1.name;
    loserName = live.p2.name;
    winnerUserId = live.p1.userId;
  } else {
    winnerName = live.p2.name;
    loserName = live.p1.name;
    winnerUserId = live.p2.userId;
  }


  const maxBounces = Math.max(live.p1.maxBounces, live.p2.maxBounces);
  const avgRallyBounces = totalRallies > 0 ? totalBounces / totalRallies : 0;

  const totalMatchTime = live.rallyDurationsMs.reduce((s, v) => s + v, 0);
  // const avgRallyTime = live.rallyDurationsMs.length > 0 ? totalMatchTime / live.rallyDurationsMs.length : 0;

  let avgRallyTime = 0;

  if (live.rallyDurationsMs.length > 0) {
      const totalRallyTimeMs = live.rallyDurationsMs.reduce((a: number, b: number) => a + b, 0);
      avgRallyTime = (totalRallyTimeMs / live.rallyDurationsMs.length) / 1000; 
  }


  // ----- Player Stats -----
  const p1St: PlayerMatchStats = {
    userName: p1.name,
    score: p1.score,
    maxWins: p1.currentWins,
    totalBallSpins: p1.effects,
    maxBouncesInWonRally: p1.maxBounces,
    maxEffectsInWonRally: p1.maxEffects,
    maxBallSpeedWon: p1.maxBallSpeedWon,
    maxBallSpeedLost: p1.maxBallSpeedLost,

    fastestWonRally: 0,
    fastestLostRally: 0,

    ralliesWon: p1.score,
    ralliesLost: p2.score,
  };

  const p2St: PlayerMatchStats = {
    userName: p2.name,
    score: p2.score,
    maxWins: p2.currentWins,
    totalBallSpins: p2.effects,
    maxBouncesInWonRally: p2.maxBounces,
    maxEffectsInWonRally: p2.maxEffects,
    maxBallSpeedWon: p2.maxBallSpeedWon,
    maxBallSpeedLost: p2.maxBallSpeedLost,

    fastestWonRally: 0,
    fastestLostRally: 0,

    ralliesWon: p2.score,
    ralliesLost: p1.score,
  };

  return {
    matchId: "",
    totalPoints,
    winnerName,
    winnerUserId,
    loserName,

    totalRallies,
    maxBounces,
    avgRallyBounces,

    totalMatchTime,
    avgRallyTime,

    p1: p1St,
    p2: p2St,
  };
}

export function fromMatchStatsToApiMatchStatsDTO(match: MatchStats): ApiMatchStatsDTO {
  return {
    p1Score: match.p1.score,
    p2Score: match.p2.score,
    totalPoints: match.totalPoints,
    totalRallies: match.totalRallies,
    maxBounces: match.maxBounces,
    avgRallyBounces: match.avgRallyBounces,
    totalMatchTime: match.totalMatchTime,
    avgRallyTime: match.avgRallyTime,
  }
}

export function fromPlayerMatchStatsToApiPlayerStatsBase(pStats: PlayerMatchStats): ApiPlayerStatsDTO {

  return {
    score: pStats.score,
    maxWins: pStats.maxWins,
    totalBallSpins: pStats.totalBallSpins, 
    maxBouncesInWonRally: pStats.maxBouncesInWonRally,
    maxEffectsInWonRally: pStats.maxEffectsInWonRally,
    maxBallSpeedWon: pStats.maxBallSpeedWon,
    maxBallSpeedLost: pStats.maxBallSpeedLost,
    fastestWonRally: pStats.fastestWonRally,
    fastestLostRally: pStats.fastestLostRally,
  };
}