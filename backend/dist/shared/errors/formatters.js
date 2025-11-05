import { env } from '../config/environment.js';
/**
 * Formater une erreur applicative (AppError)
 */
export function formatAppError(error) {
    return {
        error: {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            // Stack trace seulement en développement
            ...(env.NODE_ENV === 'development' && { stack: error.stack })
        }
    };
}
/**
 * Formater une erreur Prisma (base de données)
 */
export function formatPrismaError(error) {
    // Erreurs courantes Prisma
    const errorMap = {
        'P2002': {
            message: 'A record with this value already exists',
            statusCode: 409
        },
        'P2025': {
            message: 'Record not found',
            statusCode: 404
        },
        'P2003': {
            message: 'Foreign key constraint failed',
            statusCode: 400
        }
    };
    const mappedError = errorMap[error.code] || {
        message: 'Database error',
        statusCode: 500
    };
    return {
        error: {
            code: `PRISMA_${error.code}`,
            message: mappedError.message,
            statusCode: mappedError.statusCode,
            ...(env.NODE_ENV === 'development' && {
                details: error.meta,
                stack: error.stack
            })
        }
    };
}
/**
 * Formater une erreur Fastify (validation, etc.)
 */
export function formatFastifyError(error) {
    return {
        error: {
            code: error.code || 'FASTIFY_ERROR',
            message: error.message,
            statusCode: error.statusCode || 500,
            ...(env.NODE_ENV === 'development' && {
                validation: error.validation,
                stack: error.stack
            })
        }
    };
}
/**
 * Formater une erreur générique
 */
export function formatGenericError(error) {
    return {
        error: {
            code: 'INTERNAL_ERROR',
            message: env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : error.message,
            statusCode: 500,
            ...(env.NODE_ENV === 'development' && { stack: error.stack })
        }
    };
}
