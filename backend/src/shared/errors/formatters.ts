import { FastifyError } from 'fastify';
import { Prisma } from '@prisma/client';
import { AppError } from './AppError.js';
import { env } from '../config/environment.js';

/**
 * Interface pour le format de réponse d'erreur
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
    stack?: string;
  };
}

/**
 * Formater une erreur applicative (AppError)
 */
export function formatAppError(error: AppError): ErrorResponse {
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
export function formatPrismaError(error: Prisma.PrismaClientKnownRequestError): ErrorResponse {
  // Erreurs courantes Prisma
  const errorMap: Record<string, { message: string; statusCode: number }> = {
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
export function formatFastifyError(error: FastifyError): ErrorResponse {
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
export function formatGenericError(error: Error): ErrorResponse {
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