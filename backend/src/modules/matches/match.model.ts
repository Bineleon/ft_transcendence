import type { Match, User, Tournament } from '@prisma/client';

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
}

// ⬇️ Utiliser le type Prisma + les relations
export type MatchResponse = Match & {
  p1?: Pick<User, 'id' | 'username' | 'avatarUrl' | 'playerRef'> | null;
  p2?: Pick<User, 'id' | 'username' | 'avatarUrl' | 'playerRef'> | null;
  winner?: Pick<User, 'id' | 'username' | 'avatarUrl'> | null;
  tournament?: Pick<Tournament, 'id' | 'code' | 'name' | 'mode'> | null;
};


////////////////////////////////////////////////////////////////
//////////         FELIX              ////////////////////////

export interface PlayedMatchUserResponse {
  username: string;

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

export interface PlayedMatchResponse {
  id: string;
  tournamentId: string | null;
  gameCode: string;
  round: number | null;
  gameIndex: number | null;

  p1UserName: string | undefined;
  p1Score: number | null;
  p1IsGuest: boolean | null;

  p2UserName: string | undefined;
  p2Score: number | null;
  p2IsGuest: boolean | null;

/// Match Stats
  totalPoints: number;        // 3 | 4 | 5
  winnerName: string;
  loserName: string;

  totalRallies: number;       // Nombre total d'echanges sur le match entier
  maxBounces: number;         // Nombre max d'echanges en une partie      
  avgRallyBounces: number;    // Moyenne des echanges de tout les matchs par partie

  totalMatchTime: number;         // Temps total du match
  avgRallyTime: number;       // Temps Moyen par partie

  p1?: PlayedMatchUserResponse | null;
  p2?: PlayedMatchUserResponse | null;
}