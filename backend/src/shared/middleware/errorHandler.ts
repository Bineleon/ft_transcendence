import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { formatAppError, formatPrismaError, formatGenericError } from '../errors/formatters.js';

/**
 * Configure le gestionnaire d'erreurs global pour Fastify
 */
export function setupErrorHandler(app: FastifyInstance): void {
  
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    
    // Log l'erreur avec contexte
    console.error('Error:', {
      message: error.message,
      route: `${request.method} ${request.url}`
    });

    // 🔵 Erreur custom (ValidationError, AuthError, etc.)
    if (error instanceof AppError) {
      const formatted = formatAppError(error);
      return reply.status(error.statusCode).send(formatted);
    }

    // 🔵 Erreur Prisma (base de données)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const formatted = formatPrismaError(error);
      return reply.status(formatted.error.statusCode).send(formatted);
    }

    // 🔵 Erreur JWT
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return reply.status(401).send({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          statusCode: 401
        }
      });
    }

    // 🔵 Erreur générique (fallback)
    const formatted = formatGenericError(error);
    return reply.status(500).send(formatted);
  });

  // 🔵 Route 404 (Not Found)
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
        statusCode: 404
      }
    });
  });
}