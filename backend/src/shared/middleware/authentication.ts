// src/middleware/authentication.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt.js';
import { AuthError, ForbiddenError } from '../errors/index.js';
import { UserService } from '../../modules/users/users.service.js';

// On instancie le service utilisateur une seule fois
const userService = new UserService();

/**
 * Middleware : Vérifie que l'utilisateur est authentifié via JWT
 * + met à jour lastSeen
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token =
    request.cookies.token ||
    (request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    return reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing authentication token',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  try {
    const decoded = verifyToken(token);
    // typé grâce à fastify.d.ts
    request.user = decoded;

    // 🔥 Mise à jour lastSeen en "fire and forget"
    if (decoded.userId) {
      userService.updateLastSeen(decoded.userId).catch((err) => {
        request.log?.error({ err }, 'Failed to update lastSeen');
      });
    }
  } catch {
    return reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}

/**
 * Middleware : Vérifie que l'utilisateur accède à sa propre ressource
 */
export async function requireOwner(
  request: FastifyRequest<{ Params: { id: string } }>
): Promise<void> {
  if (!request.user) {
    throw new AuthError('Authentication required');
  }

  if (request.params.id !== request.user.userId) {
    throw new ForbiddenError('Access denied');
  }
}
