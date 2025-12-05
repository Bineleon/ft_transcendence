/**
 * Models et types pour le module User
 */

import type { User } from '@prisma/client';

// ============================================
//  TYPES DE REQUÊTE (ce que le client envoie)
// ============================================

/**
 * Données pour mettre à jour son profil
 */
export interface UpdateProfileRequest {
  email?: string;
  username?: string;
  password?: string;
  avatarUrl?: string | null;
}

/**
 * Données pour changer uniquement le mot de passe
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Paramètres de recherche d'utilisateurs
 */
export interface SearchUsersQuery {
  search?: string;
}

// ============================================
//  TYPES DE RÉPONSE (ce que le serveur renvoie)
// ============================================

/**
 * Profil complet d'un utilisateur (son propre profil)
 * Contient l'email et l'avatarUrl
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Profil public d'un utilisateur (profil d'un autre)
 * Sans email mais avec avatarUrl
 */
export interface PublicUserProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

/**
 * Utilisateur dans une liste (recherche, leaderboard, etc.)
 * Version minimale avec avatarUrl
 */
export interface UserListItem {
  id: string;
  username: string;
  avatarUrl: string | null;
}

// ============================================
//  TYPES UTILITAIRES (usage interne)
// ============================================

/**
 * Utilisateur sans le password (type-safe)
 */
export type UserWithoutPassword = Omit<User, 'passwordHash'>;

/**
 * Données pour mettre à jour un utilisateur en DB
 * Version interne : password déjà hashé
 */
export interface UpdateUserData {
  email?: string;
  username?: string;
  passwordHash?: string;
  avatarUrl?: string | null;
}