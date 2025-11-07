import type { FastifyInstance } from 'fastify';
import type { AuthService } from './auth.service.js';
import type { UserService } from '../users/users.service.js';
import type { RegisterRequest, LoginRequest } from './auth.model.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { authenticate } from '../../shared/middleware/index.js';
import { validateUserData } from './auth.policies.js';

export function authController(
  app: FastifyInstance,
  authService: AuthService,
  userService: UserService
) {
  app.post<{ Body: RegisterRequest }>('/api/auth/register', async (request, reply) => {
    const validated = await validateUserData(request, reply);
    if (!validated) return;

    const result = await authService.register(validated);

    reply.setCookie('token', result.token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60
    });

    return formatSuccess(result, 'Registration successful');
  });

  app.post<{ Body: LoginRequest }>('/api/auth/login', async (request, reply) => {
    try {
      const validated: LoginRequest = request.body; // username + password
      const result = await authService.login(validated);

      reply.setCookie('token', result.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60
      });

      return formatSuccess(result, 'Login successful');
    } catch (err) {
      return reply.code(401).send({
        error: {
          code: 'AUTH_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
          statusCode: 401,
          timestamp: new Date().toISOString(),
          path: request.url
        }
      });
    }
  });

  app.post('/api/auth/logout', { preHandler: authenticate }, async (_req, reply) => {
    reply.clearCookie('token', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return formatSuccess(undefined, 'Logout successful');
  });

  app.get('/api/auth/me', { preHandler: authenticate }, async (request) => {
    const userId = request.user!.userId;
    const profile = await userService.getOwnProfile(userId);
    return formatSuccess({ user: profile });
  });
}
