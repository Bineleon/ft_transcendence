import type { Match, User, Tournament } from '@prisma/client';

export interface CreateMatchDTO {
  tournamentId?: string;
  round?: number;
  gameIndex?: number;
  p1UserId?: string;
  p2UserId?: string;
  txHash?: string;
}

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