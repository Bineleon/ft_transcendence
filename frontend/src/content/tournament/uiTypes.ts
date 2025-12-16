import type { tournamentMode } from "./tournament";
import type { MatchStatus } from "./apiTypes";

export type tStatus = "OPEN" | "RUNNING" | "CLOSED";

export interface User {
    userId: string;
    userName: string;
    alias?: string;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
    friendOf: Friend[];
    friends: Friend[];
    matchesWon: Match[];
    matchesAsP2: Match[];
    matchesAsP1: Match[];
    createdTournaments: Tournament[];
}

// Les FriendsOf sont toutes les fois ou on apparait en tant que friendId dans la table Friend
// Les Friends sont tout les friendId qui apparaissent pour notre userId dans la table Friend
export interface Friend {
    friendId: string;
    userId: string;             // demandeur d'ami
    friendToId: string;           // receveur de la demande // Les Friends du UserId
    status: string;
    createdAt: string;
    friend: User;
    user: User;
	online: boolean;
}

export interface MatchUser {
    user: User | null;
    score: number | null;
    maxSpeed: number | null;
    maxEffects: number | null;
    winner: boolean;
}

export interface Match {
    matchId: string;
    round: number | undefined;
    tournamentId: string | undefined;
    p1User: MatchUser | null;
    p2User: MatchUser | null;
    status: MatchStatus;
}

export interface Tournament {
    tCode: string;
    name: string;
    tMode: tournamentMode;
    status: tStatus;
    creatorName: string | null;
    maxParticipants: number;
    kingMaxTime?: number;
    kingMaxRounds?: number;
    matches: Match[];
}