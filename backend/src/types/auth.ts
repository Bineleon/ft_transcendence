/**
 * Models pour le module Auth
 */

import type { User } from '@prisma/client';

// Requêtes
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Réponses
export interface FormattedUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
}

export interface AuthResponse {
  user: FormattedUser;
  token: string;
}

// Utilitaires
export type UserWithoutPassword = Omit<User, 'password'>;