import { FastifyError, FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
import { AppError, formatError } from './errors.js';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url;

    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', error);
    } else if (!(error instanceof AppError) || (error as any).statusCode >= 500) {
      console.error('Server error:', { message: error.message, stack: error.stack, path });
    }

    // --- Ajout : gestion explicite des erreurs Zod ---
    if (error instanceof ZodError) {
      const firstError = error.issues[0]?.message || 'Invalid input data';
      return reply.code(400).send(formatError(
        new AppError(400, firstError, 'VALIDATION_ERROR'),
        path
      ));
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return handlePrismaError(error, reply, path);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return reply.code(400).send(formatError(
        new AppError(400, 'Invalid data provided', 'VALIDATION_ERROR'),
        path
      ));
    }

    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return reply.code(error.statusCode).send(formatError(
        new AppError(error.statusCode, error.message, 'FASTIFY_ERROR'),
        path
      ));
    }

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(formatError(error, path));
    }

    return reply.code(500).send(formatError(error, path));
  });

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
    case 'P2002':
      return reply.code(409).send(formatError(
        new AppError(409, 'A record with this value already exists', 'DUPLICATE_ENTRY'),
        path
      ));
    case 'P2025':
      return reply.code(404).send(formatError(
        new AppError(404, 'Record not found', 'NOT_FOUND'),
        path
      ));
    case 'P2003':
      return reply.code(400).send(formatError(
        new AppError(400, 'Invalid reference to related record', 'INVALID_REFERENCE'),
        path
      ));
    default:
      return reply.code(500).send(formatError(
        new AppError(500, 'Database operation failed', 'DATABASE_ERROR'),
        path
      ));
  }
}
