// src/middleware/authentication.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt.js';
import { UserService } from '../../modules/users/users.service.js';

const userService = new UserService();

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const bearerToken =
    request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.split(' ')[1]
      : null;

  const token = bearerToken ?? request.cookies.token ?? null;

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

    if (decoded.userId) {
      const exists = await userService.existsById(decoded.userId);
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


