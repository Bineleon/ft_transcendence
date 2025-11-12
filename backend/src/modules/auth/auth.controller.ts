import type { FastifyInstance } from 'fastify';
import type { AuthService } from './auth.service.js';
import type { UserService } from '../users/users.service.js';
import type { RegisterRequest, LoginRequest } from './auth.model.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { authenticate } from '../../shared/middleware/authentication.js';
import { validateUserData } from './auth.policies.js';
import { RefreshService } from './refresh.service.js';

export function authController(
  app: FastifyInstance,
  authService: AuthService,
  userService: UserService,
  refreshService: RefreshService
) {
  // --- REGISTER ---
  app.post<{ Body: RegisterRequest }>('/api/auth/register', async (request, reply) => {
    const validated = await validateUserData(request, reply);
    if (!validated) return;

    const result = await authService.register(validated);
    return formatSuccess(result, 'User created, 2FA required.');
  });

  // --- LOGIN ---
  app.post<{ Body: LoginRequest }>('/api/auth/login', async (request) => {
    const result = await authService.login(request.body);
    return formatSuccess(result, '2FA code sent.');
  });

  // --- VERIFY 2FA ---
  app.post('/api/auth/verify-2fa', async (request, reply) => {
    const { userId, code } = request.body as { userId: string; code: string };
    const result = await authService.verify2FA(userId, code);

    const refreshToken = await refreshService.createRefreshToken(result.user.id);

    reply.setCookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return formatSuccess(result, '2FA verified. Login successful.');
  });

  // --- REFRESH ---
  app.post('/api/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.code(401).send({
        error: { code: 'NO_REFRESH_TOKEN', message: 'Missing refresh token', statusCode: 401 },
      });
    }

    const tokens = await refreshService.rotateRefreshToken(refreshToken);
    reply.setCookie('token', tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60, path: '/' });
    reply.setCookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60, path: '/' });

    return formatSuccess(tokens, 'Token refreshed successfully');
  });

  // --- LOGOUT ---
  app.post('/api/auth/logout', { preHandler: authenticate }, async (request, reply) => {
    await refreshService.revokeRefreshToken(request.user!.userId);
    reply.clearCookie('token');
    reply.clearCookie('refreshToken');
    return formatSuccess(undefined, 'Logout successful');
  });

  // --- PROFILE ---
  app.get('/api/auth/me', { preHandler: authenticate }, async (request) => {
    const userId = request.user!.userId;
    const profile = await userService.getOwnProfile(userId);
    return formatSuccess({ user: profile });
  });
}
