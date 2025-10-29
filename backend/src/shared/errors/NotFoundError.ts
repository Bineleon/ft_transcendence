import { AppError } from './AppError.js';

/**
 * Erreur ressource non trouvée (404 Not Found)
 * Utilisée quand une ressource demandée n'existe pas
 * 
 * Exemples:
 * - Utilisateur avec ID inexistant
 * - Route inexistante
 * - Partie de jeu introuvable
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}