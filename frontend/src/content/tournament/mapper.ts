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

function matchhUserFromApi(apiMUser: ApiMatchUser | null, score: number | null, isWinner: boolean): Match["p1User"] | Match["p2User"] {
  if (!apiMUser) {
    return null;
  }

  return {
    user: userFromApi(apiMUser),
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
    p1User: matchhUserFromApi(
        apiM.p1 ?? null, 
        apiM.p1Score ?? null, 
        apiM.winnerUserName === apiM.p1UserName),
    p2User: matchhUserFromApi(
        apiM.p2 ?? null, 
        apiM.p2Score ?? null, 
        apiM.winnerUserName === apiM.p2UserName),
    status: apiM.status,
  };
}

export function tournamentFromApi(apiT: ApiTournament): Tournament {
  return {
    tCode: apiT.code,
    name: apiT.name,
    tMode: apiT.mode as tournamentMode,
    status: apiT.status as tStatus,
    creatorId: apiT.createdBy ?? "",
    maxParticipants: apiT.maxParticipants,
    kingMaxTime: apiT.kingMaxTime ?? undefined,
    kingMaxRounds: apiT.kingMaxRounds ?? undefined,
    matches: (apiT.matches ?? []).map(matchFromApi),
  };
}
