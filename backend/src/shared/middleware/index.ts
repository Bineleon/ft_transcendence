/**
 * Export centralisé de tous les middlewares
 * Permet d'importer facilement : import { authenticate, setupErrorHandler } from '@/shared/middleware'
 */

// Error handler
export { setupErrorHandler } from './errorHandler.js';

// Authentication middlewares
export { authenticate } from './authentication.js';