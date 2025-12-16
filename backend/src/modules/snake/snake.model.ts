import type { SnakeMatch, User } from '@prisma/client';

// DTO pour créer un match Snake
export interface CreateSnakeMatchDTO {
  p1Username: string;
  p2Username: string;
  p1IsGuest: boolean;
  p2IsGuest: boolean;
  p1Score: number;
  p1Collectibles: number;
  p2Score: number;
  p2Collectibles: number;
}

// Response type avec relations
export type SnakeMatchResponse = SnakeMatch & {
  p1?: Pick<User, 'id' | 'username' | 'avatarUrl'> | null;
  p2?: Pick<User, 'id' | 'username' | 'avatarUrl'> | null;
  winner?: Pick<User, 'id' | 'username' | 'avatarUrl'> | null;
};
