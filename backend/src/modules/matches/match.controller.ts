import type { FastifyInstance } from 'fastify';
import { MatchService } from './match.service.js';
import type { CreateMatchDTO, UpdateMatchDTO, FinishMatchDTO, PlayedMatchDTO } from './match.model.js';
import { authenticate } from '../../shared/middleware/authentication.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { formatGenericError } from '../../shared/errors/formatters.js';
import type { UserService } from '../users/users.service.js';

export function matchController(
  app: FastifyInstance,
  matchService: MatchService,
  userService: UserService
) {
  
  // ==========================================
  // POST /api/matches - Créer un match
  // ==========================================
  app.post<{ Body: CreateMatchDTO }>(
    '/api/matches',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const match = await matchService.create(request.body);
        return formatSuccess(match, 'Match created successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to create match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/matches/:id - Récupérer un match par ID
  // ==========================================
  app.get<{ Params: { id: string } }>(
    '/api/matches/:id',
    async (request, reply) => {
      try {
        const match = await matchService.findById(request.params.id);
        
        if (!match) {
          const errorResponse = formatGenericError(new Error('Match not found'));
          return reply.status(404).send(errorResponse);
        }

        return formatSuccess(match, 'Match retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/matches - Lister tous les matchs
  // ==========================================
  app.get<{ Querystring: { status?: string } }>(
    '/api/matches',
    async (request, reply) => {
      try {
        const { status } = request.query;
        const matches = await matchService.findAll(status as any);
        
        return formatSuccess(matches, 'Matches retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve matches')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/matches/tournament/:tournamentId - Matchs d'un tournoi
  // ==========================================
  app.get<{ Params: { tournamentId: string } }>(
    '/api/matches/tournament/:tournamentId',
    async (request, reply) => {
      try {
        const matches = await matchService.findByTournament(request.params.tournamentId);
        return formatSuccess(matches, 'Tournament matches retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve tournament matches')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/matches/player/:userId - Matchs d'un joueur
  // ==========================================
  app.get<{ Params: { userId: string } }>(
    '/api/matches/player/:userId',
    async (request, reply) => {
      try {
        const matches = await matchService.findByPlayer(request.params.userId);
        return formatSuccess(matches, 'Player matches retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve player matches')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // PATCH /api/matches/:id - Mettre à jour un match
  // ==========================================
  app.patch<{ 
    Params: { id: string }
    Body: UpdateMatchDTO
  }>(
    '/api/matches/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const match = await matchService.update(request.params.id, request.body);
        return formatSuccess(match, 'Match updated successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to update match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // POST /api/matches/:id/start - Démarrer un match
  // ==========================================
  app.post<{ Params: { id: string } }>(
    '/api/matches/:id/start',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const match = await matchService.start(request.params.id);
        return formatSuccess(match, 'Match started successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to start match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // DELETE /api/matches/:id - Supprimer un match
  // ==========================================
  app.delete<{ Params: { id: string } }>(
    '/api/matches/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        await matchService.delete(request.params.id);
        return formatSuccess(null, 'Match deleted successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to delete match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // POST /api/matches/:id/finish - Terminer un match de tournoi
  // ==========================================
  app.post<{
    Params: { id: string };
    Body: FinishMatchDTO;
  }>(
    '/api/matches/:id/finish',
    async (request, reply) => {
      console.log("body :", request.body);
      try {
        const { id } = request.params as { id: string };
        const { matchStats, p1Stats, p2Stats } = request.body;

        const match = await matchService.finishMatchWithStats(
          id,
          matchStats,
          p1Stats,
          p2Stats
        );

        return formatSuccess(match, 'Match finished successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to finish match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // POST /api/matches/played - Créer un match hors tournoi avec stats
  // ==========================================
  app.post<{
    Body: PlayedMatchDTO;
  }>(
    '/api/matches/played',
    async (request, reply) => {
      try {
        const data = request.body;

        // Validation basique
        if (!data.p1Username || !data.p2Username) {
          return reply.code(400).send({
            error: {
              message: 'p1Username and p2Username are required',
              statusCode: 400
            }
          });
        }

        // Si les deux sont guests, ne rien enregistrer
        if (data.p1IsGuest && data.p2IsGuest) {
          console.log('[POST /api/matches/played] Both players are guests, skipping DB record');
          return formatSuccess(null, 'Match not recorded (both players are guests)');
        }

        const match = await matchService.createMatchWithStats(data);
        return formatSuccess(match, 'Match recorded successfully');
        
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to record match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

    // ===============================================
  // GET /api/profile/dashboard/recent-rallies - Dashboard graph 2
  // Query param: username (optional) - if provided, get stats for that user instead of logged-in user
  // ===============================================
    app.get<{ Querystring: { username?: string } }>(
    '/api/profile/dashboard/recent-rallies',
    { preHandler: authenticate },
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
      
      const stats = await matchService.getRecentRalliesForUser(userId);
      return formatSuccess({ stats }, 'Recent rallies loaded');
    }
  );

	// ===============================================
	// GET /api/profile/dashboard/recent-matches - Dashboard graph 3
	// Query param: username (optional) - if provided, get stats for that user instead of logged-in user
	// ===============================================
	app.get<{ Querystring: { username?: string } }>(
	'/api/profile/dashboard/recent-matches',
	{ preHandler: authenticate },
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
		
		const matches = await matchService.getRecentMatchesForUser(userId);
		return formatSuccess({ matches }, 'Recent matches loaded');
	}
	);


  // ==========================================
  // GET /api/matches/:id/details - Détails complets d'un match terminé
  // ==========================================
//   app.get<{ Params: { id: string } }>(
//     '/api/matches/:id/details',
//     { preHandler: authenticate },
//     async (request, reply) => {
//       try {
//         const { id } = request.params;
        
//         const details = await matchService.getPlayedMatchDetails(id);
//         return formatSuccess(details, 'Match details retrieved successfully');
        
//       } catch (error) {
//         const errorResponse = formatGenericError(
//           error instanceof Error ? error : new Error('Failed to get match details')
//         );
//         return reply.status(errorResponse.error.statusCode).send(errorResponse);
//       }
//     }
  // );
}