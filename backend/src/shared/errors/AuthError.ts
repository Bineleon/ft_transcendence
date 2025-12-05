import { AppError } from './AppError.js';

/**
 * Erreur d'authentification (401 Unauthorized)
 * Utilisée quand l'utilisateur n'est pas authentifié
 * ou que les credentials sont invalides
 * 
 * Exemples:
 * - Login/password incorrects
 * - Token JWT manquant ou invalide
 * - Session expirée
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}