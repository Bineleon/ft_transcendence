import { getRouteTail } from "../../router.ts";
import type { TournamentFormDatas } from "../tournament/tournament.ts";
import { apiFetch } from "./apiFetch";
import { pongAlert } from "./alertBox.ts";
import type { Tournament, User } from "../tournament/uiTypes.ts";
import type { ApiTournament } from "../tournament/apiTypes.ts";
import { tournamentFromApi } from "../tournament/mapper.ts";


/// ------      CHECK CHECK CHECK       ------ ///
export async function notLoggedIn(): Promise<boolean> {
    try {
        const resp = await fetch(`/api/auth/loggedIn`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await resp.json();

        if (resp.ok) {
            return data as boolean;
        } else {
            return true;
        }
    } catch (error) {
        console.error("Profile fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`);
        throw error;
    }
}

/// ------        ADD ADD ADD        ------ //
export async function addUserAsPlayerToTournament(tCode: string, userName: string, t: Tournament): Promise<void> {

    const payload = {
        tCode: tCode,
        userId: userName,
    };    try {
        const resp = await apiFetch(`/api/tournaments/${tCode}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        const data = await resp.json();

        if (!resp.ok) {
            pongAlert(`Failed to add player to tournament: ${data.error?.message || data.message || 'Unknown error'}`, "error", { title: "Add Player Error" });
        } else {
            pongAlert(`You have been added to the tournament.`, "success");
            document.dispatchEvent(new CustomEvent("tournamentUpdated"));
        }
    }
    catch (error) {
        console.error("Add player error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, "error" , { title: "Add Player Error" });
        throw error;
    }
}

// -----        MATCH MATCH MATCH        ------ //

export async function startMatch(matchId: string): Promise<void> {
  try {
    const resp = await apiFetch(`/api/matches/${matchId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
    
    const data = await resp.json();
    
    if (!resp.ok) {
      pongAlert(`Failed to start match: ${data.error?.message || 'Unknown error'}`, "error", { title: "Start Match Error" });
      throw new Error(data.error?.message);
    }
    
    pongAlert('Match started!', "success");
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
    const resp = await apiFetch(`/api/matches/${matchId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerUserId, p1Score, p2Score }),
      credentials: "include"
    });
    
    const data = await resp.json();
    
    if (!resp.ok) {
      pongAlert(`Failed to finish match: ${data.error?.message || 'Unknown error'}`, "error", { title: "Finish Match Error" });
      throw new Error(data.error?.message);
    }
    
    pongAlert('Match finished! Winner advanced to next round.', "success");
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
        const resp = await apiFetch("/api/tournaments/form", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("Code created:", code);
        console.log("tMode:", datas.tMode.toLocaleLowerCase());
        if (resp.ok) {
            window.location.hash = `#/tournament/${datas.tMode.toLowerCase()}/${code}`;
        } else {
            pongAlert(`Failed to create tournament: ${data.error?.message || data.message || 'Unknown error'}`, "error", { title: "Tournament Creation Error" });
        }
    }
    catch (error) {
        console.error("Tournament creation error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, "error", { title: "Tournament Creation Error" });
    }
}

// ------        GET GET GET        ------ //
export function getUserNameByIdTEMP(id: string, users: User[]): string {
    // TEMPORAIRE EN ATTENDANT LES VRAIES ROUTES
    const user = users.find((u) => u.userId === id);
    return user ? user.userName : "Unknown User";
}

export async function getLoggedID(): Promise<string> {
    const userDatas = await apiFetch ("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    });
    if (!userDatas.ok) {
        return "";
    }
    return (await userDatas.json()).id;
}

export async function getLoggedName(): Promise<string> {
    const userDatas = await apiFetch ("/api/auth/publicme", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    });
    if (!userDatas.ok) {
        return "";
    }
    return (await userDatas.json()).username;
}


export async function getUserNameById(id: string): Promise<string> {
    const IDHere = getRouteTail("/profile");
    try {
        const resp = await apiFetch(`/api/profile/${IDHere}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await resp.json();

        if (resp.ok) {
            return data.username as string;
        } else {
            pongAlert(`Failed to fetch username: ${data.error?.message || data.message || 'Unknown error'}`, "error", { title: "Username Fetch Error" });
            throw new Error(data.error?.message || data.message || 'Unknown error');
        }
    } catch (error) {
        console.error("Username fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, "error", { title: "Username Fetch Error" });
        throw error;
    }
}

export async function getUserDatas(userName: string): Promise<User> {
    try {
        const resp = await apiFetch(`/api/profile/${userName}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await resp.json();

        if (resp.ok) {
            return data as User;
        } else {
            pongAlert(`Failed to fetch profile: ${data.error?.message || data.message || 'Unknown error'}`, "error", { title: "Profile Fetch Error" });
            throw new Error(data.error?.message || data.message || 'Unknown error');
        }
    } catch (error) {
        console.error("Profile fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, "error", { title: "Profile Fetch Error" });
        throw error;
    }
}

export async function getTournamentDatas(code: string): Promise<Tournament> {
    try {
        const resp = await apiFetch(`/api/tournaments/${code}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const raw = await resp.json();

        if (!resp.ok) {
            throw new Error(raw.error?.message || raw.message || 'Unknown error');
        }

        const apiT: ApiTournament = raw.data ?? raw;
        const data: Tournament = tournamentFromApi(apiT);

        console.log("Fetched tournament data:", data);
        console.log("API tournament data:", apiT);
        return data;
    } catch (error) {
        console.error("Tournament fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, "error", { title: "Tournament Fetch Error", onClose: () => { window.location.hash = "#/tournament"; } });    
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