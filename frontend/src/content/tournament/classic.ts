import { getRouteTail } from "../../router";
import { getTournamentDatas } from "../utils/todb";
import type { Tournament } from "../utils/types";

const tCode = getRouteTail("/tournament/classic");
// const tClassicDatas: Promise<Tournament> = getTournamentDatas(tCode); 

/// TEMP EN ATTENDANT LES ROUTES VALIDES
const tClassicDatas: Tournament = {
    code: tCode,
    name: "Classic Showdown",
    creatorID: "user_001",
    mode: "CLASSIC",
    maxParticipants: 16,
    participants: [
        { id: "user_002", username: "PlayerOne", avatarUrl: "/public/imgs/player1.jpg" },
        { id: "user_003", username: "GamerGal", avatarUrl: "/public/imgs/player2.jpg" },
        // ... autres participants
    ],
    status: "ONGOING",
    createdAt: "2024-11-01T10:00:00.000Z",
    updatedAt: "2024-11-05T15:30:00.000Z"
};
/// FIN TEMP

export function classicTournament(): HTMLElement {
    // if (notLoggedIn()) {
    //     return redirectToLogin();
    // }


    const container = document.createElement("div");
    container.innerHTML = `
        <h1>Classic Tournament</h1>
        <p>Welcome to the Classic Tournament! Compete against other players in a traditional knockout format.</p>
        <button id="join-tournament">Join Tournament</button>
    `;
    return container;
}