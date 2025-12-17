/**
 * Controller pour les routes utilisateurs
 */

import type { FastifyInstance } from 'fastify';
import type { UserService } from './users.service.js';
import type {
  SearchUsersQuery,
  UpdateProfileRequest,
  ChangePasswordRequest
} from './users.model.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { authenticate } from '../../shared/middleware/index.js';

export function userController(app: FastifyInstance, userService: UserService) {
  /**
   * GET /api/users/me
   * Récupérer son propre profil (avec email)
   */
  app.get(
    '/api/users/me',
    { preHandler: authenticate },
    async (request) => {
      const userId = request.user!.userId;
      const profile = await userService.getOwnProfile(userId);
      return formatSuccess({ profile });
    }
  );

  /**
   * PATCH /api/users/me/username
   * Changer son username
   */
  app.patch<{ Body: { username: string } }>(
    '/api/users/me/username',
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { username } = request.body;

      if (!username || typeof username !== 'string') {
        return reply.code(400).send({
          error: {
            code: 'INVALID_USERNAME',
            message: 'Username is required',
            statusCode: 400
          }
        });
      }

      try {
        const profile = await userService.updateUsername(userId, username);
        return formatSuccess({ profile }, 'Username updated successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update username';
        return reply.code(400).send({
          error: {
            code: 'USERNAME_UPDATE_FAILED',
            message,
            statusCode: 400
          }
        });
      }
    }
  );

  /**
   * PUT /api/users/me
   * Mettre à jour son propre profil (email, avatar, etc.)
   */
  app.put<{ Body: UpdateProfileRequest }>(
    '/api/users/me',
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user!.userId;

      try {
        const profile = await userService.updateProfile(userId, request.body);
        return formatSuccess({ profile }, 'Profile updated successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        return reply.code(400).send({
          error: {
            code: 'PROFILE_UPDATE_FAILED',
            message,
            statusCode: 400
          }
        });
      }
    }
  );

  /**
   * PUT /api/users/me/password
   * Changer son propre mot de passe
   */
  app.put<{ Body: ChangePasswordRequest }>(
    '/api/users/me/password',
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user!.userId;

      try {
        await userService.changePassword(userId, request.body);
        return formatSuccess(undefined, 'Password changed successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to change password';
        return reply.code(400).send({
          error: {
            code: 'PASSWORD_CHANGE_FAILED',
            message,
            statusCode: 400
          }
        });
      }
    }
  );

  /**
   * GET /api/users/:id
   * Récupérer le profil d'un autre utilisateur (profil public)
   */
  app.get<{ Params: { id: string } }>(
    '/api/users/:id',
    { preHandler: authenticate },
    async (request) => {
      const userId = request.params.id;
      const myId = request.user!.userId;

      if (userId === myId) {
        const profile = await userService.getOwnProfile(userId);
        return formatSuccess({ profile });
      }

      const profile = await userService.getPublicProfile(userId);
      return formatSuccess({ profile });
    }
  );

  /**
   * GET /api/users
   * Rechercher des utilisateurs par username
   */
  app.get<{ Querystring: SearchUsersQuery }>(
    '/api/users',
    { preHandler: authenticate },
    async (request) => {
      const search = request.query.search || '';
      const result = await userService.searchUsers(search);
      return result;
    }
  );

/** GET /api/profile/dashboard/daily-matches 
 * Récupérer les matchs des 7 derniers jours pour le dashboard d'un user.
 * Query param: username (optional) - if provided, get stats for that user instead of logged-in user
*/
  app.get<{ Querystring: { username?: string } }>(
	'/api/profile/dashboard/daily-matches',
	{ preHandler : authenticate },
	async (request, reply) => {
		let userId = request.user!.userId;
		
		// If username is provided, get that user's stats instead
		if (request.query.username) {
			try {
				const targetUser = await userService.getPublicProfileByUsername(request.query.username);
				userId = targetUser.id;
			} catch (err) {
				return reply.code(404).send({
					error: {
						code: 'USER_NOT_FOUND',
						message: 'User not found',
						statusCode: 404
					}
				});
			}
		}
		
		const stats = await userService.getDailyMatchStats(userId);
		return formatSuccess({ stats }, 'Daily match stats loaded');
	}
  );
 
  /** PATCH /api/users/me/2fa
  * Patcher le 2FA
  */

app.patch<{ Body: { enabled: boolean } }>(
  '/api/users/me/2fa',
  { preHandler: authenticate },
  async (request, reply) => {
    const userId = request.user!.userId;
    const { enabled } = request.body;

    if (typeof enabled !== 'boolean') {
      return reply.code(400).send({
        error: {
          code: 'INVALID_2FA_FLAG',
          message: 'enabled must be a boolean',
          statusCode: 400
        }
      });
    }

    const profile = await userService.setTwoFactorEnabled(userId, enabled);
    return formatSuccess({ profile }, enabled ? '2FA enabled' : '2FA disabled');
  }
);

  /**
   * GET /api/users/me/blockchain-stats
   * Get blockchain stats from user's last tournament
   */
  app.get(
    '/api/users/me/blockchain-stats',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const userId = request.user!.userId;
        const stats = await userService.getLastTournamentBlockchainStats(userId);
        return formatSuccess(stats, 'Blockchain stats retrieved successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to retrieve blockchain stats';
        return reply.code(404).send({
          error: {
            code: 'BLOCKCHAIN_STATS_NOT_FOUND',
            message,
            statusCode: 404
          }
        });
      }
    }
  );

}
