/**
 * Export centralisé de toutes les classes d'erreurs
 * Permet d'importer facilement : import { ValidationError, AuthError } from '@/shared/errors'
 */

// Classes d'erreurs
export { AppError } from './AppError.js';
export { ValidationError } from './ValidationError.js';
export { AuthError } from './AuthError.js';
export { ForbiddenError } from './ForbiddenError.js';
export { NotFoundError } from './NotFoundError.js';
export { ConflictError } from './ConflictError.js';

// Formateurs
export {
  formatAppError,
  formatPrismaError,
  formatFastifyError,
  formatGenericError,
  type ErrorResponse
} from './formatters.js';