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
  userId: string;
  username: string;
  avatarUrl?: string | null;  // AJOUT : Avatar

  score: number;                  // 0 | 1 | 2 | 3
  maxWins: number;                // max points consécutifs
  totalBallSpins: number;         // Nombre total d'effets de balle sur le match
  maxBouncesInWonRally: number;   // Nombre max d'echanges en une partie
  maxEffectsInWonRally: number;   // Nombre max d'effets en une partie
  maxBallSpeedWon: number;        // Balle la plus rapide gagnee
  maxBallSpeedLost: number;       // Balle la plus rapide perdue
  fastestWonRally: number;        // Partie gagnee la plus rapidement
  fastestLostRally: number;       // Partie perdu le plus rapidement

  ralliesWon: number;
  ralliesLost: number;
}

export interface ApiMatch {
  id: string;
  tournamentCode?: string | null;
  status: string;
  createdAt: Date;
  closedAt: Date | null;

  // Joueurs
  p1UserName: string | null;
  p1Score: number | null;
  p1IsGuest: boolean;

  p2UserName: string | null;
  p2Score: number | null;
  p2IsGuest: boolean;

  // STATS GLOBALES DU MATCH
  totalPoints: number;        // 3 | 4 | 5
  winnerId: string;
  loserId: string;

  totalRallies: number;       // Nombre total d'échanges sur le match entier
  maxBounces: number;         // Nombre max d'échanges en une partie
  avgRallyBounces: number;    // Moyenne des échanges de toutes les parties
  totalMatchTime: number;     // Temps total du match (en secondes)
  avgRallyTime: number;       // Temps moyen par partie (en secondes)

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

export interface ApiMatchStatsDTO {
  p1Score: number;
  p2Score: number;
  totalPoints: number;
  totalRallies: number;
  maxBounces: number;
  avgRallyBounces: number;
  totalMatchTime: number;
  avgRallyTime: number;
}


export interface ApiPlayerStatsDTO {
  userId?: string;  // Optionnel pour createMatchWithStats (on utilise username)
  score: number;
  maxWins: number;
  totalBallSpins: number;
  maxBouncesInWonRally: number;
  maxEffectsInWonRally: number;
  maxBallSpeedWon: number;
  maxBallSpeedLost: number;
  fastestWonRally: number;
  fastestLostRally: number;
}

/// payload Fonction async finishMatch()
export interface ApiFinishMatchDTO {
  matchStats: ApiMatchStatsDTO;
  p1Stats: ApiPlayerStatsDTO
  p2Stats: ApiPlayerStatsDTO
}

/// payload Fonction async createMatchWithStats()
export interface ApiPlayedMatchDTO {
  p1Username: string;
  p2Username: string;
  p1IsGuest: boolean;
  p2IsGuest: boolean;
  matchStats: ApiMatchStatsDTO;
  p1Stats: ApiPlayerStatsDTO;
  p2Stats: ApiPlayerStatsDTO;
}

