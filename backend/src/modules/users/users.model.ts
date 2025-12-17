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
  alias?: string | null;
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
//  STATS D'UN JOUEUR
// ============================================

/**
 * Stats globales d'un joueur (tous matchs confondus)
 */
export interface PlayerStatsResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
  
  // Stats générales
  totalMatches: number;           // Nombre total de matchs joués
  totalWins: number;              // Nombre de victoires
  totalLosses: number;            // Nombre de défaites
  winRate: number;                // Taux de victoire (0-100)
  
  // Stats en tournoi
  tournamentsPlayed: number;      // Nombre de tournois joués
  tournamentsWon: number;         // Nombre de tournois gagnés
  
  // Records personnels
  longestWinStreak: number;       // Plus longue série de victoires
  currentWinStreak: number;       // Série de victoires actuelle
  
  maxBouncesInMatch: number;      // Plus long échange de tous les matchs
  maxBallSpeedEver: number;       // Vitesse de balle max jamais atteinte
  totalBallSpins: number;         // Nombre total d'effets utilisés
  
  fastestWinEver: number;         // Victoire la plus rapide (secondes)
  avgMatchDuration: number;       // Durée moyenne d'un match
  
  // Stats de performances
  avgScorePerMatch: number;       // Score moyen par match
  avgBouncesPerRally: number;     // Moyenne d'échanges par partie
}

/**
 * Un match dans l'historique d'un joueur
 */
export interface PlayerMatchItem {
  id: string;
  createdAt: Date;
  closedAt: Date | null;
  
  // Informations du joueur dans ce match
  playerScore: number;            // Score du joueur
  isWinner: boolean;              // Le joueur a-t-il gagné ?
  
  // Informations de l'adversaire
  wasP1: boolean;                 // Le joueur était-il P1 ?
  p1UserId: string | null;        // ID de P1 (null si guest)
  p1Username: string;             // Username de P1
  p1AvatarUrl: string | null;     // Avatar de P1
  p1Score: number;                // Score de P1
  
  p2UserId: string | null;        // ID de P2 (null si guest)
  p2Username: string;             // Username de P2
  p2AvatarUrl: string | null;     // Avatar de P2
  p2Score: number;                // Score de P2
  
  // Stats du match
  duration: number;               // Durée du match
  longestRally: number;           // Plus long échange
  maxBallSpeed: number;           // Vitesse max de balle
  effectsUsed: number;            // Effets utilisés par le joueur
  
  // Tournoi (si applicable)
  tournamentId: string | null;
  tournamentName: string | null;
  round: number | null;
}

/**
 * Historique de matchs d'un joueur avec pagination
 */
export interface PlayerMatchHistoryResponse {
  userId: string;
  username: string;
  totalMatches: number;           // Nombre total de matchs (pour pagination)
  matches: PlayerMatchItem[];     // Liste des matchs
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

export type DailyMatchStats = {
  date: string;
  totalMatches: number;
  wins: number;
}

export type RecentMatchRallyStat = {
    date: string;          // "Game 1", ou "M-1", ou une date
    avgRallyBounces: number;
    avgRallyTime: number;   // en secondes, par ex.
};
