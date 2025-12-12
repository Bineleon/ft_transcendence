import type { Match, User, Tournament, PlayerMatchStats } from '@prisma/client';

export interface CreateMatchDTO {
  tournamentId?: string;
  round?: number;
  gameIndex?: number;
  p1UserId?: string;
  p2UserId?: string;
  txHash?: string;
}

export type PlayerIdResponse = "p1" | "p2";

export interface UpdateMatchDTO {
  status?: string;
  p1Score?: number | null;
  p2Score?: number | null;
  winnerUserId?: string | null;
  onchainAt?: Date | null;
  txHash?: string | null;
  
  // NOUVELLES STATS GLOBALES
  totalPoints?: number | null;
  totalRallies?: number | null;
  maxBounces?: number | null;
  avgRallyBounces?: number | null;
  totalMatchTime?: number | null;
  avgRallyTime?: number | null;
}

// Response de base (utilisé par les routes génériques)
export type MatchResponse = Match & {
  p1?: Pick<User, 'id' | 'username' | 'avatarUrl' | 'playerRef'> | null;
  p2?: Pick<User, 'id' | 'username' | 'avatarUrl' | 'playerRef'> | null;
  winner?: Pick<User, 'id' | 'username' | 'avatarUrl'> | null;
  tournament?: Pick<Tournament, 'id' | 'code' | 'name' | 'mode'> | null;
  playerStats?: PlayerMatchStats[];  // AJOUT : stats individuelles
};

////////////////////////////////////////////////////////////////
//////////         FELIX - Stats détaillées    ////////////////
////////////////////////////////////////////////////////////////

// Stats d'un joueur dans un match
export interface PlayedMatchUserResponse {
  userId: string;  // AJOUT : ID du joueur
  username: string;
  avatarUrl?: string | null;  // AJOUT : Avatar

  score: number;                  // 0 | 1 | 2 | 3
  maxWins: number;                // max points consécutifs
  totalBallSpins: number;         // Nombre total d'effets de balle sur le match
  maxBouncesInWonRally: number;   // Nombre max d'échanges en une partie
  maxEffectsInWonRally: number;   // Nombre max d'effets en une partie
  maxBallSpeedWon: number;        // Balle la plus rapide gagnée
  maxBallSpeedLost: number;       // Balle la plus rapide perdue
  fastestWonRally: number;        // Partie gagnée la plus rapidement
  fastestLostRally: number;       // Partie perdue le plus rapidement

  ralliesWon: number;
  ralliesLost: number;
}

// Match complet avec toutes les stats
export interface PlayedMatchResponse {
  id: string;
  tournamentId: string | null;
  status: string;
  createdAt: Date;
  closedAt: Date | null;

  // Joueurs
  p1UserId: string | null;
  p1Score: number | null;
  p1IsGuest: boolean;  // Changé : pas null si calculé côté service

  p2UserId: string | null;
  p2Score: number | null;
  p2IsGuest: boolean;  // Changé : pas null si calculé côté service

  // STATS GLOBALES DU MATCH
  totalPoints: number;        // 3 | 4 | 5
  winnerId: string;           // Changé : peut être null si match pas fini
  loserId: string;            // Changé : peut être null si match pas fini

  totalRallies: number;       // Nombre total d'échanges sur le match entier
  maxBounces: number;         // Nombre max d'échanges en une partie
  avgRallyBounces: number;    // Moyenne des échanges de toutes les parties
  totalMatchTime: number;     // Temps total du match (en secondes)
  avgRallyTime: number;       // Temps moyen par partie (en secondes)

  // STATS INDIVIDUELLES DES JOUEURS
  p1?: PlayedMatchUserResponse;
  p2?: PlayedMatchUserResponse;
}

export interface MatchStatsDTO {
  p1Score: number;
  p2Score: number;
  totalPoints: number;
  totalRallies: number;
  maxBounces: number;
  avgRallyBounces: number;
  totalMatchTime: number;
  avgRallyTime: number;
}


// Stats individuelles d'un joueur

export interface PlayerStatsDTO {
  userId: string;  // Optionnel pour createMatchWithStats (on utilise username)
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


// Body pour terminer un match de tournoi
export interface FinishMatchDTO {
  tournamentId: string | null;
  matchStats: MatchStatsDTO;
  p1Stats: PlayerStatsDTO & { userId: string };  // userId obligatoire
  p2Stats: PlayerStatsDTO & { userId: string };  // userId obligatoire
}

// Body pour créer un match hors tournoi
export interface PlayedMatchDTO {
  p1Username: string;
  p2Username: string;
  p1IsGuest: boolean;
  p2IsGuest: boolean;
  matchStats: MatchStatsDTO;
  p1Stats: PlayerStatsDTO;
  p2Stats: PlayerStatsDTO;
}


export type RecentRallyStat = {
  label: string;          // ex: "Game 1" ou "2025-12-10"
  avgRallyBounces: number;
  avgRallyTime: number;
};
