// src/middleware/authentication.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt.js';
import { UserService } from '../../modules/users/users.service.js';

const userService = new UserService();

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
    request.user = decoded;

    // ✅ NOUVEAU : vérifier que l'utilisateur existe encore en DB
    // (après make clean, cookie reste mais user n'existe plus)
    if (decoded.userId) {
      const exists = await userService.existsById(decoded.userId); // <-- on ajoute ça
      if (!exists) {
        return reply.status(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Session invalid (user not found)',
            statusCode: 401,
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        });
      }

      // Mise à jour lastSeen en "fire and forget"
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

