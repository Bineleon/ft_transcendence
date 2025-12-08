// utils/mappers.ts

import type { ApiTournament, ApiMatch, ApiMatchUser } from "./apiTypes";
import type { Tournament, Match, User, tStatus } from "./uiTypes";
import type { tournamentMode } from "../tournament/tournament";

function userFromApi(apiUser: ApiMatchUser): User {
  return {
    userId: apiUser.id,
    userName: apiUser.username,
    alias: undefined,
    avatarUrl: apiUser.avatarUrl,
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

  return {
    user: user,
    score: score,
    maxSpeed: null,
    maxEffects: null,
    winner: isWinner,
  };
}

function matchFromApi(apiM: ApiMatch): Match {
  return {
    matchId: apiM.id,
    round: apiM.round,
    tournamentId: apiM.tournamentId,
    p1User: matchUserFromApi(
        apiM.p1 ?? null,
        apiM.p1UserName,
        apiM.p1Score ?? null, 
        apiM.winnerUserName === apiM.p1UserName),
    p2User: matchUserFromApi(
        apiM.p2 ?? null,
        apiM.p2UserName,
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


export function playedMatchStatsToApi(
  matchStats: MatchStats,
  meta: MatchMeta
): ApiMatch {
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
    id: meta.id,
    tournamentId: meta.tournamentId,
    gameCode: meta.gameCode,
    round: meta.round,
    gameIndex: meta.gameIndex,

    p1UserName: p1.userName,
    p1Score: p1.score,
    p1IsGuest: meta.p1IsGuest,

    p2UserName: p2.userName,
    p2Score: p2.score,
    p2IsGuest: meta.p2IsGuest,

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
  const { p1Stats, p2Stats, totalBounces, totalRallies, lastScorer } = live;

  const totalPoints = p1Stats.score + p2Stats.score;

  let winnerName: string;
  let loserName: string;

  if (p1Stats.score > p2Stats.score) {
    winnerName = p1Stats.name;
    loserName = p2Stats.name;
  } else
    winnerName = p2Stats.name;
    loserName = p1Stats.name;


  const maxBounces = Math.max(p1Stats.maxBounces, p2Stats.maxBounces);
  const avgRallyBounces = totalRallies > 0 ? totalBounces / totalRallies : 0;

  const totalMatchTime = live.rallyDurationsMs.reduce((s, v) => s + v, 0);
  const avgRallyTime = live.rallyDurationsMs.length > 0 ? totalMatchTime / live.rallyDurationsMs.length : 0;

  // ----- Player Stats -----
  const p1: PlayerMatchStats = {
    userName: p1Stats.name,
    score: p1Stats.score,
    maxWins: p1Stats.currentWins,
    totalBallSpins: p1Stats.effects,
    maxBouncesInWonRally: p1Stats.maxBounces,
    maxEffectsInWonRally: p1Stats.maxEffects,

    fastestWonRally: 0,
    fastestLostRally: 0,

    ralliesWon: p1Stats.score,
    ralliesLost: p2Stats.score,
  };

  const p2: PlayerMatchStats = {
    userName: p2Stats.name,
    score: p2Stats.score,
    maxWins: p2Stats.currentWins,
    totalBallSpins: p2Stats.effects,
    maxBouncesInWonRally: p2Stats.maxBounces,
    maxEffectsInWonRally: p2Stats.maxEffects,

    fastestWonRally: 0,
    fastestLostRally: 0,

    ralliesWon: p2Stats.score,
    ralliesLost: p1Stats.score,
  };

  return {
    totalPoints,
    winnerName,
    loserName,

    totalRallies,
    maxBounces,
    avgRallyBounces,

    totalMatchTime,
    avgRallyTime,

    p1,
    p2,
  };
}
