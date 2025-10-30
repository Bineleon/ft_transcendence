/**
 * Données pour mettre à jour son profil
 */
export interface UpdateUserRequest {
  email?: string;
  username?: string;
  password?: string;
  avatarUrl?: string;
}

/**
 * Données pour mettre à jour en DB (interne)
 */
export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  avatarUrl?: string;
}

/**
 * Models pour le module User
 */

import type { User } from '@prisma/client';

// Requêtes
export interface UpdateProfileRequest {
  email?: string;
  username?: string;
  password?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SearchUsersQuery {
  search?: string;
}

// Réponses
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  avatarUrl: string;
  createdAt: string;
}

export interface UserListItem {
  id: string;
  username: string;
  avatarUrl: string;
}

// Utilitaires
export type UserWithoutPassword = Omit<User, 'password'>;