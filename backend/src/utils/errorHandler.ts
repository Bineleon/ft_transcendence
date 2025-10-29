import { FastifyError, FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
import { AppError, formatError } from './errors.js';
import { Prisma } from '@prisma/client';

export function setupErrorHandler(app: FastifyInstance): void {
  // Handler global d'erreurs
  app.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url;

    // Log l'erreur (en production, utiliser un vrai logger)
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', error);
    } else {
      // En production, logger seulement les erreurs 5xx
      if (!(error instanceof AppError) || error.statusCode >= 500) {
        console.error('Server error:', {
          message: error.message,
          stack: error.stack,
          path
        });
      }
    }

    // Gestion des erreurs Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return handlePrismaError(error, reply, path);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return reply.code(400).send(formatError(
        new AppError(400, 'Invalid data provided', 'VALIDATION_ERROR'),
        path
      ));
    }

    // Gestion des erreurs Fastify natives
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return reply.code(error.statusCode).send(formatError(
        new AppError(error.statusCode, error.message, 'FASTIFY_ERROR'),
        path
      ));
    }

    // Gestion des erreurs applicatives
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(formatError(error, path));
    }

    // Erreur inconnue (5xx)
    return reply.code(500).send(formatError(error, path));
  });

  // Handler pour les routes 404
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send(formatError(
      new AppError(404, `Route ${request.method} ${request.url} not found`, 'ROUTE_NOT_FOUND'),
      request.url
    ));
  });
}

function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  reply: FastifyReply,
  path?: string
): FastifyReply {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      return reply.code(409).send(formatError(
        new AppError(409, 'A record with this value already exists', 'DUPLICATE_ENTRY'),
        path
      ));
    
    case 'P2025': // Record not found
      return reply.code(404).send(formatError(
        new AppError(404, 'Record not found', 'NOT_FOUND'),
        path
      ));
    
    case 'P2003': // Foreign key constraint violation
      return reply.code(400).send(formatError(
        new AppError(400, 'Invalid reference to related record', 'INVALID_REFERENCE'),
        path
      ));
    
    default:
      // Ne jamais exposer les erreurs Prisma brutes
      return reply.code(500).send(formatError(
        new AppError(500, 'Database operation failed', 'DATABASE_ERROR'),
        path
      ));
  }
}