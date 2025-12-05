export type TournamentStatus = "OPEN" | "RUNNING" | "CLOSED";
export type TournamentMode = "CLASSIC" | "GAUNTLET" | "KING";

export type MatchStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "CLOSED"
  | "DB_ONLY"
  | "CONFIRMED"
  | "FAILED";

export interface ApiMatchUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  playerRef: string | null;
}

export interface ApiMatch {
  id: string;
  tournamentId: string | null;
  gameCode: string;
  round: number | null;
  gameIndex: number | null;

  p1UserId: string | null;
  p1Ref: string | null;
  p1Score: number | null;

  p2UserId: string | null;
  p2Ref: string | null;
  p2Score: number | null;

  winnerUserId: string | null;
  winnerRef: string | null;

  status: MatchStatus;
  txHash: string | null;
  onchainAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;

  p1?: ApiMatchUser | null;
  p2?: ApiMatchUser | null;
  winner?: ApiMatchUser | null;
}

export interface ApiTournament {
  id: string;
  code: string;
  name: string;
  mode: TournamentMode;
  status: TournamentStatus;
  maxParticipants: number;
  kingMaxTime: number | null;
  kingMaxRounds: number | null;
  createdBy: string | null;
  createdAt: string;
  creator?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  matches?: ApiMatch[];
}
