import type { FastifyInstance } from 'fastify';
import type { AuthService } from './auth.service.js';
import type { UserService } from '../users/users.service.js';
import type { RegisterRequest, LoginRequest } from './auth.model.js';
import { formatPublicUser, formatSuccess } from '../../shared/utils/formatters.js';
import { authenticate } from '../../shared/middleware/authentication.js';
import { validateUserData } from './auth.policies.js';
import { RefreshService } from './refresh.service.js';
import { GoogleOAuthService } from './google-oauth.service.js';
import { generateToken } from '../../shared/utils/jwt.js';
import { env } from '../../shared/config/environment.js';

export function authController(
  app: FastifyInstance,
  authService: AuthService,
  userService: UserService,
  refreshService: RefreshService,
  googleOAuth: GoogleOAuthService
) {
  // --- REGISTER ---
  app.post<{ Body: RegisterRequest }>(
    '/api/auth/register',
    {
      config: {
        rateLimit: {
          max: 3,                // 3 créations de compte...
          timeWindow: '10 minutes', // ...par 10 minutes / IP
        },
      },
    },
    async (request, reply) => {
      const validated = await validateUserData(request, reply);
      if (!validated) return;

      const result = await authService.register(validated);
      return formatSuccess(result, 'User created, 2FA required.');
    }
  );

  // --- LOGIN ---
  app.post<{ Body: LoginRequest }>(
    '/api/auth/login',
    {
      config: {
        rateLimit: {
          max: 5,                // 5 tentatives...
          timeWindow: '5 minutes', // ...par 5 minutes / IP
        },
      },
    },
    async (request) => {
      const result = await authService.login(request.body);
      return formatSuccess(result, '2FA code sent.');
    }
  );

  // --- VERIFY 2FA ---
  app.post(
    '/api/auth/verify-2fa',
    {
      config: {
        rateLimit: {
          max: 10,                // 10 essais de code 2FA...
          timeWindow: '10 minutes', // ...par 10 minutes / IP
        },
      },
    },
    async (request, reply) => {
      const { userId, code } = request.body as { userId: string; code: string };
      const result = await authService.verify2FA(userId, code);

      const refreshToken = await refreshService.createRefreshToken(result.user.id);

      reply.setCookie('token', result.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60,
        path: '/',
      });

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return formatSuccess(result, '2FA verified. Login successful.');
    }
  );

  // --- REFRESH ---
  app.post('/api/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.code(401).send({
        error: { code: 'NO_REFRESH_TOKEN', message: 'Missing refresh token', statusCode: 401 },
      });
    }

    const tokens = await refreshService.rotateRefreshToken(refreshToken);
    reply.setCookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    });
    reply.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return formatSuccess(tokens, 'Token refreshed successfully');
  });

  // --- LOGOUT ---
  app.post('/api/auth/logout', { preHandler: authenticate }, async (request, reply) => {
    await refreshService.revokeRefreshToken(request.user!.userId);
    reply.clearCookie('token');
    reply.clearCookie('refreshToken');
    return formatSuccess(undefined, 'Logout successful');
  });

  // --- PROFILE (full) ---
  app.get('/api/auth/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const profile = await userService.getFullProfile(request.user!.userId);
      return formatSuccess({ user: profile }, 'Profile loaded successfully');
    } catch (err) {
      request.log.error(err, 'Failed to load profile');
      return reply.code(500).send({
        error: {
          code: 'PROFILE_LOAD_FAILED',
          message: 'Failed to load profile',
          statusCode: 500,
        },
      });
    }
  });

  // --- PROFILE (public / minimal) ---
  app.get('/api/auth/publicme', { preHandler: authenticate }, async (request) => {
    const userId = request.user!.userId;
    const profile = await userService.getOwnProfile(userId);
    return formatPublicUser({
      id: profile.id,
      username: profile.username,
      avatarUrl: profile.avatarUrl ?? undefined,
    });
  });

  // --- Profile Public ---
  app.get('/api/profile/:username', async (request, reply) => {
    const { username } = request.params as { username: string };

    try {
      const profile = await userService.getPublicProfileByUsername(username);
      return formatSuccess({ user: profile });
    } catch (err) {
      return reply.code(404).send({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
        },
      });
    }
  });

  
  // --- Check loggedIn ---
  app.get('/api/auth/loggedIn', async (request, reply) => {
    try {
      const token =
        request.cookies.token ||
        (request.headers.authorization?.startsWith('Bearer ')
          ? request.headers.authorization.split(' ')[1]
          : null);

      if (!token) {
        return reply.send(true);
      }

      const decoded = await import('../../shared/utils/jwt.js').then((m) => m.verifyToken(token));

      if (decoded) {
        return reply.send(false); // Token valide => utilisateur connecté
      }

      return reply.send(true); // Par défaut, pas connecté
    } catch {
      return reply.send(true); // Erreur => token invalide => pas connecté
    }
  });

  // --- DELETE ACCOUNT ---
  app.delete('/api/auth/delete-account', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = request.user!.userId;

      await userService.deleteUser(userId);

      reply.clearCookie('token');
      reply.clearCookie('refreshToken');

      return { success: true, message: 'Account deleted successfully' };
    } catch (err) {
      request.log.error(err, 'Failed to delete account');
      return reply.code(500).send({
        error: {
          code: 'DELETE_ACCOUNT_FAILED',
          message: 'Failed to delete account',
          statusCode: 500,
        },
      });
    }
  });

    // --- GDPR: Privacy report ---
  app.get('/api/privacy/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = request.user!.userId;
      const report = await userService.getPrivacyReport(userId);
      return formatSuccess(report, 'Privacy report loaded successfully');
    } catch (err) {
      request.log.error(err, 'Failed to load privacy report');
      return reply.code(500).send({
        error: {
          code: 'PRIVACY_REPORT_FAILED',
          message: 'Failed to load privacy report',
          statusCode: 500
        }
      });
    }
  });

  // --- GDPR: Anonymize account ---
  app.post('/api/privacy/anonymize', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = request.user!.userId;

      await userService.anonymizeUser(userId);

      // On nettoie les cookies d'auth après anonymisation
      reply.clearCookie('token');
      reply.clearCookie('refreshToken');

      return formatSuccess(undefined, 'Account anonymized successfully');
    } catch (err) {
      request.log.error(err, 'Failed to anonymize account');
      return reply.code(500).send({
        error: {
          code: 'ANONYMIZE_ACCOUNT_FAILED',
          message: 'Failed to anonymize account',
          statusCode: 500
        }
      });
    }
  });

  // ===============================
  //       GOOGLE OAUTH
  // ===============================

  // --- GOOGLE: REDIRECT VERS GOOGLE ---
  app.get('/api/auth/google', async (request, reply) => {
    const redirectUri = env.GOOGLE_REDIRECT_URL;
    const clientId = env.GOOGLE_CLIENT_ID;

    if (!redirectUri || !clientId) {
      request.log.error('Missing Google OAuth env vars');
      return reply.code(500).send({
        error: {
          code: 'OAUTH_CONFIG_ERROR',
          message: 'Google OAuth is not configured',
          statusCode: 500,
        },
      });
    }

    // On récupère le state envoyé par le front (hash courant), ou on met une valeur par défaut
    const { state } = request.query as { state?: string };

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    if (state) {
      url.searchParams.set('state', state);
    }

    return reply.redirect(url.toString());
  });

  // --- GOOGLE: CALLBACK ---
  app.get('/api/auth/google/callback', async (request, reply) => {
    const { code, state } = request.query as { code?: string; state?: string };

    if (!code) {
      return reply.code(400).send({
        error: {
          code: 'OAUTH_NO_CODE',
          message: 'Missing authorization code',
          statusCode: 400,
        },
      });
    }

    const redirectUri = env.GOOGLE_REDIRECT_URL;
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;

    if (!redirectUri || !clientId || !clientSecret) {
      request.log.error('Missing Google OAuth env vars');
      return reply.code(500).send({
        error: {
          code: 'OAUTH_CONFIG_ERROR',
          message: 'Google OAuth is not configured',
          statusCode: 500,
        },
      });
    }

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        request.log.error({ text }, 'Failed to exchange code for token');
        return reply.code(400).send({
          error: {
            code: 'OAUTH_TOKEN_ERROR',
            message: 'Failed to obtain access token',
            statusCode: 400,
          },
        });
      }

      const tokenData = (await tokenRes.json()) as any;
      const accessToken = tokenData.access_token as string | undefined;

      if (!accessToken) {
        return reply.code(400).send({
          error: {
            code: 'OAUTH_NO_ACCESS_TOKEN',
            message: 'No access token in token response',
            statusCode: 400,
          },
        });
      }

      const googleUser = await googleOAuth.getUserInfo(accessToken);
      const user = await googleOAuth.findOrCreateUser(googleUser);
      const userId = String(user.id);
      const appAccessToken = generateToken({ userId, email: user.email });
      const refreshToken = await refreshService.createRefreshToken(userId);

      reply.setCookie('token', appAccessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60,
        path: '/',
      });

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      const redirectState = typeof state === 'string' && state.length > 0 ? state : '#/profile';
      const encodedState = encodeURIComponent(redirectState);
      return reply.redirect(`/?state=${encodedState}`);
    } catch (err) {
      request.log.error({ err }, 'Google OAuth callback failed');
      return reply.code(500).send({
        error: {
          code: 'OAUTH_INTERNAL_ERROR',
          message: 'Google OAuth failed',
          statusCode: 500,
        },
      });
    }
  });
}
