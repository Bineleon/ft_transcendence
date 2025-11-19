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
        // if (response.ok) {
            window.location.hash = `#/tournament/${datas.tMode.toLowerCase()}/${code}`;
        // } else {
        //     pongAlert(`Failed to create tournament: ${data.error?.message || data.message || 'Unknown error'}`, { title: "Tournament Creation Error" });
        // }
    }

    catch (error) {
        console.error("Tournament creation error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, { title: "Tournament Creation Error" });
    } finally {
        // Any cleanup if necessary
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