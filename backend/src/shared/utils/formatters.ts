/**
 * Utilitaires de formatage pour les réponses API
 */

import type { User } from '@prisma/client';
import type { SuccessResponse } from '../types/common.js';

/**
 * Formater un utilisateur complet (sans password)
 * Utilisé pour le profil de l'utilisateur connecté
 * 
 * @param user - Utilisateur Prisma
 * @returns Utilisateur formaté pour l'API (avec email, sans password)
 */
export function formatUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

/**
 * Formater un profil public (sans email ni password)
 * Utilisé pour afficher le profil d'un autre utilisateur
 * 
 * @param user - Utilisateur Prisma (ou objet partiel)
 * @returns Profil public (id + username)
 */
export function formatPublicUser(user: {
  id: string;
  username: string;
  avatarUrl?: string;
}) {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl
  };
}

/**
 * Formater une date en ISO string
 * 
 * @param date - Date à formater
 * @returns Date au format ISO 8601
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Formater une réponse de succès
 * 
 * @param data - Données à retourner (optionnel)
 * @param message - Message de succès (optionnel)
 * @returns Réponse formatée
 */
export function formatSuccess<T>(data?: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    ...(message && { message }),
    ...(data && { data })
  };
}