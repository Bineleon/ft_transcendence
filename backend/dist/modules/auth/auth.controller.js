import { formatSuccess } from '../../shared/utils/formatters.js';
import { authenticate } from '../../shared/middleware/authentication.js';
import { validateUserData } from './auth.policies.js';
// import { PrismaClient } from '@prisma/client';
export function authController(app, authService, userService, refreshService // <- ajouté
) {
    app.post('/api/auth/register', async (request, reply) => {
        const validated = await validateUserData(request, reply);
        if (!validated)
            return;
        const result = await authService.register(validated);
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
        return formatSuccess(result, 'Registration successful');
    });
    app.post('/api/auth/login', async (request, reply) => {
        try {
            const validated = request.body;
            const result = await authService.login(validated);
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
            return formatSuccess(result, 'Login successful');
        }
        catch (err) {
            return reply.code(401).send({
                error: {
                    code: 'AUTH_ERROR',
                    message: err instanceof Error ? err.message : 'Unknown error',
                    statusCode: 401,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                },
            });
        }
    });
    app.post('/api/auth/refresh', async (request, reply) => {
        try {
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
        }
        catch (error) {
            return reply.code(401).send({
                error: { code: 'REFRESH_ERROR', message: error instanceof Error ? error.message : 'Token refresh failed', statusCode: 401 },
            });
        }
    });
    app.post('/api/auth/logout', { preHandler: authenticate }, async (request, reply) => {
        await refreshService.revokeRefreshToken(request.user.userId);
        reply.clearCookie('token');
        reply.clearCookie('refreshToken');
        return formatSuccess(undefined, 'Logout successful');
    });
    app.get('/api/auth/me', { preHandler: authenticate }, async (request) => {
        const userId = request.user.userId;
        const profile = await userService.getOwnProfile(userId);
        return formatSuccess({ user: profile });
    });
}
