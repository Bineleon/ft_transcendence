import { AppError } from './AppError.js';

/**
 * Erreur de conflit (409 Conflict)
 * Utilisée quand il y a un conflit avec l'état actuel des données
 * 
 * Exemples:
 * - Email déjà utilisé lors de l'inscription
 * - Username déjà pris
 * - Tentative de création d'un doublon
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}