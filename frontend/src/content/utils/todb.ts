import { getRouteTail } from "../../router.ts";
import type { TournamentFormDatas } from "../tournament/tournament.ts";
import { pongAlert } from "./logchecks.ts";
import type { User } from "./types.ts";


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

    // createMatches(code, datas);
}

export async function createMatches(tournamentCode: string, datas: TournamentFormDatas): Promise<void> {
    const payload = {
        tournamentCode: tournamentCode,
        mode: datas.tMode,
        maxParticipants: datas.maxParticipants,
    };
    try {
        const response = await fetch("/api/tournament/matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        const data = await response.json();

        if (!response.ok) {
            pongAlert(`Failed to create matches: ${data.error?.message || data.message || 'Unknown error'}`, { title: "Match Creation Error" });
        }
    }
    catch (error) {
        console.error("Match creation error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Match Creation Error" });
    }
}

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

export async function getTournamentDatas(code: string): Promise<any> {
    try {
        const response = await fetch(`/api/tournaments/${code}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            pongAlert(`Failed to fetch tournament: ${data.error?.message || data.message || 'Unknown error'}`, { title: "Tournament Fetch Error" });
            throw new Error(data.error?.message || data.message || 'Unknown error');
        }
    } catch (error) {
        console.error("Tournament fetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Tournament Fetch Error" });
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