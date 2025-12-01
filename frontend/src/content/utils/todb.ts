import { getRouteTail } from "../../router.ts";
import type { TournamentFormDatas } from "../tournament/tournament.ts";
import { pongAlert } from "./logchecks.ts";
import type { Tournament, User } from "./types.ts";


/// ------        ADD ADD ADD        ------ //
export async function addUserAsPlayerToTournament(tCode: string, userName: string): Promise<void> {
    const payload = {
        tCode: tCode,
        userId: userName,
    };    try {
        const response = await fetch(`/api/tournaments/${tCode}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        const data = await response.json();

        if (!response.ok) {
            pongAlert(`Failed to add player to tournament: ${data.error?.message || data.message || 'Unknown error'}`, { title: "Add Player Error" });
        }
        pongAlert(`Successfully joined tournament ${tCode}!`, { title: "Success" });
    }
    catch (error) {
        console.error("Add player error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Add Player Error" });
        throw error;
    }
}

// -----        MATCH MATCH MATCH        ------ //

export async function startMatch(matchId: string): Promise<void> {
  try {
    const response = await fetch(`/api/matches/${matchId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      pongAlert(`Failed to start match: ${data.error?.message || 'Unknown error'}`, { 
        title: "Start Match Error" 
      });
      throw new Error(data.error?.message);
    }
    
    pongAlert('Match started!', { title: "Success" });
  } catch (error) {
    console.error("Start match error:", error);
    throw error;
  }
}


export async function finishMatch(
  matchId: string, 
  winnerUserId: string, 
  p1Score?: number, 
  p2Score?: number
): Promise<void> {
  try {
    const response = await fetch(`/api/matches/${matchId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerUserId, p1Score, p2Score }),
      credentials: "include"
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      pongAlert(`Failed to finish match: ${data.error?.message || 'Unknown error'}`, { 
        title: "Finish Match Error" 
      });
      throw new Error(data.error?.message);
    }
    
    pongAlert('Match finished! Winner advanced to next round.', { 
      title: "Success" 
    });
  } catch (error) {
    console.error("Finish match error:", error);
    throw error;
  }
}

/// ------        CREATE CREATE CREATE        ------ //
export async function createDBTournament(code: string, datas: TournamentFormDatas): Promise<void> {
    const payload = {
        code: code,
        name: datas.tName,
        creatorID: datas.creatorID,
        mode: datas.tMode,
        maxParticipants: datas.maxParticipants,
    };
    try {
        const response = await fetch("/api/tournaments/form", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        const data = await response.json();
        console.log("Code created:", code);
        console.log("tMode:", datas.tMode.toLocaleLowerCase());
        if (response.ok) {
            window.location.hash = `#/tournament/${datas.tMode.toLowerCase()}/${code}`;
        } else {
            pongAlert(`Failed to create tournament: ${data.error?.message || data.message || 'Unknown error'}`, { title: "Tournament Creation Error" });
        }
    }
    catch (error) {
        console.error("Tournament creation error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Tournament Creation Error" });
    }
}

// export async function createMatches(tournamentCode: string, datas: TournamentFormDatas): Promise<void> {
//     const payload = {
//         tournamentCode: tournamentCode,
//         mode: datas.tMode,
//         maxParticipants: datas.maxParticipants,
//     };
//     try {
//         const response = await fetch("/api/tournament/matches", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(payload),
//             credentials: "include"
//         });
//         const data = await response.json();

//         if (!response.ok) {
//             pongAlert(`Failed to create matches: ${data.error?.message || data.message || 'Unknown error'}`, { title: "Match Creation Error" });
//         }
//     }
//     catch (error) {
//         console.error("Match creation error:", error);
//         pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Match Creation Error" });
//     }
// }



// ------        GET GET GET        ------ //
export function getUserNameByIdTEMP(id: string, users: User[]): string {
    // TEMPORAIRE EN ATTENDANT LES VRAIES ROUTES
    const user = users.find((u) => u.userId === id);
    return user ? user.userName : "Unknown User";
}

export async function getLoggedID(): Promise<string> {
    const userDatas = await fetch ("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    });
    if (!userDatas.ok) {
        // reLogAlert();
        return "";
    }
    return (await userDatas.json()).id;
}

export async function getLoggedName(): Promise<string> {
    const userDatas = await fetch ("/api/auth/publicme", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    });
    if (!userDatas.ok) {
        // reLogAlert();
        return "";
    }
    return (await userDatas.json()).username;
}


export async function getUserNameById(id: string): Promise<string> {
    const IDHere = getRouteTail("/profile");
    try {
        const response = await fetch(`/api/profile/${IDHere}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await response.json();

        if (response.ok) {
            return data.username as string;
        } else {
            pongAlert(`Failed to fetch username: ${data.error?.message || data.message || 'Unknown error'}`, { title: "Username Fetch Error" });
            throw new Error(data.error?.message || data.message || 'Unknown error');
        }
    } catch (error) {
        console.error("Username fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Username Fetch Error" });
        throw error;
    }
}

export async function getUserDatas(id: string): Promise<User> {
    try {
        const response = await fetch(`/api/profile/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await response.json();

        if (response.ok) {
            return data as User;
        } else {
            pongAlert(`Failed to fetch profile: ${data.error?.message || data.message || 'Unknown error'}`, { title: "Profile Fetch Error" });
            throw new Error(data.error?.message || data.message || 'Unknown error');
        }
    } catch (error) {
        console.error("Profile fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Profile Fetch Error" });
        throw error;
    }
}

export async function getTournamentDatas(code: string): Promise<Tournament> {
    try {
        const response = await fetch(`/api/tournaments/${code}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const raw = await response.text();

        let data: any;
        try { data = raw ? JSON.parse(raw) : {}; } catch (e) { data = { raw }; }

        if (response.ok) {
            // unwrappe le wrapper standard { success, message, data }
            return data?.data ?? data;
        } else {
            pongAlert(`Failed to fetch profile: ${data.error?.message || data.message || raw || 'Unknown error'}`, { title: "Profile Fetch Error" });
            throw new Error(data.error?.message || data.message || raw || 'Unknown error');
        }
    } catch (error) {
        console.error("Tournament fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Tournament Fetch Error", onClose: () => { window.location.hash = "#/tournament"; } });    
        throw error;
    }
}


/*

model Tournament {
  id        String           @id @default(cuid())

  code      String           @unique
  name      String
  creator   User?            @relation("UserCreatedTournaments", fields: [createdBy], references: [id])
  mode      TournamentMode
  maxParticipants Int        @map("max_participants")
  
  status    TournamentStatus @default(OPEN)
  createdBy String?          @map("created_by")
  createdAt DateTime         @default(now()) @map("created_at")
  matches   Match[]

  @@index([status])
}


*/