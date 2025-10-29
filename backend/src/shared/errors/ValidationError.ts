import { AppError } from './AppError.js';

/**
 * Erreur de validation des données (400 Bad Request)
 * Utilisée quand les données envoyées sont invalides
 * 
 * Exemples:
 * - Email invalide
 * - Mot de passe trop court
 * - Champs requis manquants
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}