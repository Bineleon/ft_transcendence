import type { TournamentMode, TournamentStatus } from "@prisma/client";
import type { MatchResponse } from "../matches/match.model.js";

export interface CreateTournamentDTO {
  code: string;
  name: string;
  creatorName: string;
  mode: TournamentMode | string;
  maxParticipants: number;
  kingMaxTime: number | null;
  kingMaxRounds: number | null;
}

export interface TournamentResponse {
  id: string;
  code: string;
  name: string;
  mode: TournamentMode;
  status: TournamentStatus;
  maxParticipants: number;
  kingMaxTime: number | null;
  kingMaxRounds: number | null;
  createdBy: string | null;
  createdAt: Date;
  creator: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;                       
  matches?: MatchResponse[];
  // _count?: {                      // AJOUTER pour findAll()
  //   matches: number;
  // };
}