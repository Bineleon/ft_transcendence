import type { tournamentMode } from "../tournament/tournament";

export interface User {
    userId: string;
    userName: string;
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
interface Friend {
    friendId: string;
    userId: string;             // demandeur d'ami
    friendToId: string;           // receveur de la demande // Les Friends du UserId
    status: string;
    createdAt: string;
    friend: User;
    user: User;
	online: boolean;
}


export interface Match {
    matchId: string;
    tournamentId: string | null;
    p1User?: User;
    p2User?: User;
    p1Score?: number;
    p2Score?: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
    winner?: String;
}

export type tStatus = "OPEN" | "RUNNING" | "CLOSED";
export interface Tournament {
    tCode: string;
    name: string;
    creatorId: string;
    tMode: tournamentMode;
    status: tStatus;
    createdAt: string;
    maxParticipants: number;
    kingMaxTime?: number;
    kingMaxRounds?: number;
    matches: Match[];
}