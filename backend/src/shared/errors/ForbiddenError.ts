import { AppError } from './AppError.js';

/**
 * Erreur de permission (403 Forbidden)
 * Utilisée quand l'utilisateur est authentifié mais n'a pas les droits
 * 
 * Exemples:
 * - Accès à un profil d'un autre utilisateur
 * - Action réservée aux admins
 * - Modification d'une ressource protégée
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}