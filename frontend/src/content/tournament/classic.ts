import { getRouteTail } from "../../router";
import { el, text } from "../home";
import { update } from "../pong/game/update";
import type { Tournament, User, Match } from "../utils/types";
import { renderTournamentBrackets } from "./brackets";
// import { getTournamentDatas } from "../utils/todb";

const tCode = getRouteTail("/tournament/classic");
// const tClassicDatas: Promise<Tournament> = getTournamentDatas(tCode); 

/// TEMP EN ATTENDANT LES ROUTES VALIDES
const tClassicDatas: Tournament = {
    tournamentId: tCode,
    name: "Classic Showdown",
    status: "OPEN",
    createdAt: "2024-01-15T10:00:00Z",
    creatorId: "Chatou",
    tMode: "CLASSIC",
    matches: [] as Match[],
    maxParticipants: 4,
    kingMaxTime: 300,
    kingMaxRounds: 5,
    players: [] as User[],
    creator: {} as User
};

const user1: User = {
    userId: "user1",
    userName: "PlayerOne",
    avatarUrl: null,
    createdAt: "2023-12-01T09:00:00Z",
    updatedAt: "2023-12-01T09:00:00Z",
    friendOf: [],
    friends: [],
    matchesWon: [],
    matchesAsP2: [],
    matchesAsP1: [],
    createdTournaments: []
};

const user2: User = {
    userId: "user2",
    userName: "PlayerTwo",
    avatarUrl: null,
    createdAt: "2023-12-02T10:00:00Z",
    updatedAt: "2023-12-02T10:00:00Z",
    friendOf: [],
    friends: [],
    matchesWon: [],
    matchesAsP2: [],
    matchesAsP1: [],
    createdTournaments: []
};
const user3: User = {
    userId: "user3",
    userName: "PlayerThree",
    avatarUrl: null,
    createdAt: "2023-12-03T11:00:00Z",
    updatedAt: "2023-12-03T11:00:00Z",
    friendOf: [],
    friends: [],
    matchesWon: [],
    matchesAsP2: [],
    matchesAsP1: [],
    createdTournaments: []
};
const user4: User = {
    userId: "user4",
    userName: "PlayerFour",
    avatarUrl: null,
    createdAt: "2023-12-04T12:00:00Z",
    updatedAt: "2023-12-04T12:00:00Z",
    friendOf: [],
    friends: [],
    matchesWon: [],
    matchesAsP2: [],
    matchesAsP1: [],
    createdTournaments: []
};

export function updateMatches(t: Tournament): Match[] {
    const matches: Match[] = [];
    if (t.players[0] && t.players[1]) {
        matches.push({
            matchId: "match1",
            tournamentId: t.tournamentId,
            gameCode: "game1",
            p1UserId: t.players[0].userId,
            p1Score: 0,
            p2UserId: t.players[1].userId,
            p2Score: 0,
            status: "OPEN",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            closedAt: "",
            p1User: t.players[0],
            p2User: t.players[1],
            winner: ""
        });
    }
    if (t.players[2] && t.players[3]) {
        matches.push({
            matchId: "match2",
            tournamentId: t.tournamentId,
            gameCode: "game2",
            p1UserId: t.players[2].userId,
            p1Score: 0,
            p2UserId: t.players[3].userId,
            p2Score: 0,
            status: "OPEN",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            closedAt: "",
            p1User: t.players[2],
            p2User: t.players[3],
            winner: ""
        });
    }
    return matches;
}


/// FIN TEMP

export function classicTournament(): HTMLElement {
/// Check Logged User a implementer plus tard

    const main = el("div", "");
    const tCodeTitle = el("h1", "article-base text-center");
    tCodeTitle.append(el("span", "", text("Welcome to Tournament: ")));
    tCodeTitle.append(el("span", "font-bold", text(tClassicDatas.name)));
    tCodeTitle.append(el("span", "", text(` (Code: ${tClassicDatas.tournamentId})`)));

// Creation des Matchs
    tClassicDatas.players = [user1, user2, user3, user4];
    tClassicDatas.matches = updateMatches(tClassicDatas);


// Brackets Tournoi Classic
    const tournamentBrackets = renderTournamentBrackets(tClassicDatas) as HTMLElement;


    main.append(tCodeTitle, tournamentBrackets);
    return main;
}