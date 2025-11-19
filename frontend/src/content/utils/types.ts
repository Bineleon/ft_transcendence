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
}


interface Match {
    matchId: string;
    tournamentId: string | null;
    gameCode: string;
    p1UserId: string;
    p1Score: number;
    p2UserId: string;
    p2Score: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    closedAt: string;
    p1User: User;
    p2User: User;
    winner: String;
}

export interface Tournament {
    tournamentId: string;
    name: string;
    status: string;
    createdAt: string;
    createdBy: string;
    matches: Match[];
    creator: User;
}