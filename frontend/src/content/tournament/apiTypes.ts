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
  username: string;
  avatarUrl: string | null;

  score: number;                  // 0 | 1 | 2 | 3
  maxWins: number;                // max points consécutifs
  totalBallSpins: number;         // Nombre total d'effets de balle sur le match
  maxBouncesInWonRally: number;   // Nombre max d'echanges en une partie
  maxEffectsInWonRally: number;   // Nombre max d'effets en une partie

  ralliesWon: number;
  ralliesLost: number;
}

export interface ApiMatch {
  id: string;
  tournamentId: string | null;
  gameCode: string;
  round: number | null;
  gameIndex: number | null;

  p1UserName: string | null;
  p1Ref: string | null;
  p1Score: number | null;

  p2UserName: string | null;
  p2Ref: string | null;
  p2Score: number | null;

/// Match Stats
  totalPoints: number;        // 3 | 4 | 5
  winnerName: string;
  loserName: string;

  totalRallies: number;       // Nombre total d'echanges sur le match entier
  maxBounces: number;         // Nombre max d'echanges en une partie      
  avgRallyBounces: number;    // Moyenne des echanges de tout les matchs par partie

  startedAt: string;     // ISO
  finishedAt: string;    // ISO
  durationMs: number;         // Temps total du match

////
  status: MatchStatus;
  txHash: string | null;
  onchainAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;

  p1?: ApiMatchUser | null;
  p2?: ApiMatchUser | null;
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
