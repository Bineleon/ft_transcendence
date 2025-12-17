// import { getRouteTail } from "../../router.ts";
import type { TournamentFormDatas } from "../tournament/tournament.ts";
import { apiFetch } from "./apiFetch";
import { aliasBox, pongAlert, runAuthBox } from "./alertBox.ts";
import type { Tournament, User } from "../tournament/uiTypes.ts";
import type { ApiTournament, ApiFinishMatchDTO, ApiPlayedMatchDTO } from "../tournament/apiTypes.ts";
import { tournamentFromApi } from "../tournament/mapper.ts";
import { areAllMatchesClosed } from "../pong/ui/players.ts";
import type { SnakeMatchDTO } from "../snake/game/apiTypes.ts";


/// ------      CHECK CHECK CHECK       ------ ///
export async function notLoggedIn(): Promise<boolean> {
  try {
    const resp = await fetch(`/api/auth/loggedIn`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!resp.ok) return true;

    const data = await resp.json();
    return data as boolean;
  } catch (error) {
    console.warn("notLoggedIn: network error (treated as not logged)", error);
    return true;
  }
}


/// ------        ADD ADD ADD        ------ //
export async function addUserAsPlayerToTournament(tCode: string, userName: string, t: Tournament): Promise<void> {
    console.log("Adding user to tournament:", tCode, userName);
    const payload = {
        userName: userName,
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
            const alias = aliasBox(`You have been added to the tournament, you may choose an Alias now.`, "success", { title: "Player Added" });
            if (alias) {
                localStorage.setItem(userName, alias);
            }
        }
    }
    catch (error) {
        console.error("Add player error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, "error" , { title: "Add Player Error" });
        throw error;
    }
}

// -----        MATCH MATCH MATCH        ------ //
export async function finishMatch(
  matchId: string, 
  tCode: string,
  payload: ApiFinishMatchDTO): Promise<void> {
  try {
    const resp = await apiFetch(`/api/matches/${matchId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    
    const data = await resp.json();
    if (!resp.ok) {
      pongAlert(`Failed to finish match: ${data.error?.message || 'Unknown error'}`, "error", { title: "Finish Match Error" });
      throw new Error(data.error?.message);
    }
    
    if (tCode) {
        getTournamentDatas(tCode).then((t) => {
            if (!t) {
                console.error("Tournament not found after finishing match");
                return;
            }
            console.log("Tournament fetched after finishing match:", t);
            if (areAllMatchesClosed(t.matches)) {
                console.log("All matches closed, closing tournament:", tCode);
                closeTournament(tCode).catch((err) => {
                    console.error("Error closing tournament after finishing match:", err);
                });
                pongAlert('Tournament completed! All matches are closed.', "success");
            }
        }).catch((err) => {
            console.error("Error fetching tournament after finishing match:", err);
        });

    }
    pongAlert('Match finished! Winner advanced to next round.', "success", { title: "Match Finished", onClose: () => { window.location.reload(); } });
    } catch (error) {
      console.error("Finish match error:", error);
      throw error;
  }
}

export async function createMatchWithStats(payload: ApiPlayedMatchDTO) {
    try {
        const resp = await apiFetch(`/api/matches/played`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        console.log("payload", payload);

        const data = await resp.json();
        if (resp.ok) {
            console.log("are guest :", payload.p1IsGuest, payload.p2IsGuest);
            if (payload.p1IsGuest === false || payload.p2IsGuest === false) {
                pongAlert("Stats updated with synchronized accounts", "success");
            }
        } else if (!resp.ok) {
            pongAlert(`Failed to create Regular Match Stats: ${data.error?.message || data.message || 'Unknown error'}`, "error", { title: "Regular Match Stats Creation Error" });
        }
    } catch (error) {
        console.error("Failed to create and update Regular Match Stats");
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : `Regular Match Stats creation`, "error"}`)
    }
}

/// ------     TOURNAMENT TOURNAMENT TOURNAMENT      ------ ///
export async function closeTournament(tCode: string): Promise<void> {
    try {
        const resp = await apiFetch(`/api/tournaments/${tCode}/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tCode),
            credentials: "include"
        });
        const data = await resp.json();

        if (resp.ok) {
            document.dispatchEvent(new CustomEvent("tournamentUpdated"));
            pongAlert(`Tournament closed successfully.`, "success",  { title: "Tournament Completed", onClose: () => { window.location.hash = `#/tournament/classic/${tCode}`; } });
        } else {
            pongAlert(`Failed to close tournament: ${data.error?.message || data.message || 'Unknown error'}`, "error", { title: "Close Tournament Error" });
        }
    }
    catch (error) {
        console.error("Close tournament error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, "error" , { title: "Close Tournament Error" });
        throw error;
    }
}


/// ------        CREATE CREATE CREATE        ------ //
export async function createDBTournament(code: string, datas: TournamentFormDatas): Promise<void> {
    const payload = {
        code: code,
        name: datas.tName,
        creatorName: datas.creatorName,
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
  const res = await apiFetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) return "";

  const body = await res.json();
  return body?.data?.user?.id ?? "";
}


export async function getLoggedName(): Promise<string> {
  const res = await apiFetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) return "";

  const body = await res.json();
  return body?.data?.user?.username ?? "";
}

// export async function getUserIdByName(userName: string): Promise<string | null> {
//     try {
//         const user = await getUserDatas(userName);
//         console.log("USERRRR : ", user);
//         return user.data.user.id;
//     } catch {
//         return null;
//     }
// }

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

        return data;
    } catch (error) {
        console.error("Tournament fetch error:", error);
        if (window.location.hash === "#/playpong") {
            window.location.hash = "#/playpong";
        } else {
            pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`, "error", { title: "Tournament Fetch Error", onClose: () => { window.location.hash = "#/tournament"; } });    
        }
        throw error;
    }
}

/// ------     SNAKE SNAKE SNAKE      ------ ///

export async function createSnakeMatchWithStats(payload: SnakeMatchDTO) {
    try {
        const resp = await apiFetch(`/api/snake/matches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        console.log("Snake match payload", payload);

        const data = await resp.json();
        if (resp.ok) {
            console.log("are guest :", payload.p1IsGuest, payload.p2IsGuest);
            if (payload.p1IsGuest === false || payload.p2IsGuest === false) {
                pongAlert("Snake match stats updated with synchronized accounts", "success");
            }
        } else if (!resp.ok) {
            pongAlert(`Failed to create Snake Match Stats: ${data.error?.message || data.message || 'Unknown error'}`, "error", { title: "Snake Match Stats Creation Error" });
        }
    } catch (error) {
        console.error("Failed to create and update Snake Match Stats");
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Snake Match Stats creation error'}`, "error");
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