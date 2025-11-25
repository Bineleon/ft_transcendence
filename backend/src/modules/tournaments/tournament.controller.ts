import type { FastifyInstance } from 'fastify';
import { TournamentService } from './tournament.service.js';
import type { CreateTournamentDTO } from './tournament.model.js';
import { authenticate } from '../../shared/middleware/authentication.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { formatGenericError } from '../../shared/errors/formatters.js';

export function tournamentController(
  app: FastifyInstance,
  tournamentService: TournamentService
) {
  
  // ==========================================
  // POST /api/tournaments/form - Créer un tournoi
  // ==========================================
  app.post<{ Body: CreateTournamentDTO }>(
    '/api/tournaments/form',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const tournament = await tournamentService.create(request.body);
        return formatSuccess(tournament, 'Tournament created successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to create tournament')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/tournaments/:code - Récupérer un tournoi
  // ==========================================
  app.get<{ Params: { code: string } }>(
    '/api/tournaments/:code',
    async (request, reply) => {
      try {
        const tournament = await tournamentService.findByCode(request.params.code);
        
        if (!tournament) {
          const errorResponse = formatGenericError(new Error('Tournament not found'));
          return reply.status(404).send(errorResponse);
        }

        return formatSuccess(tournament, 'Tournament retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve tournament')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );
// // ==========================================
//   // GET /api/tournaments - Lister tous les tournois
//   // ==========================================
//   app.get<{ Querystring: { status?: string } }>(
//     '/api/tournaments',
//     async (request, reply) => {
//       try {
//         const { status } = request.query;
//         const tournaments = await tournamentService.findAll(
//           status as any // TournamentStatus
//         );
        
//         return formatSuccess(tournaments, 'Tournaments retrieved successfully');
//       } catch (error) {
//         const errorResponse = formatGenericError(
//           error instanceof Error ? error : new Error('Failed to retrieve tournament')
//         );
//         return reply.status(errorResponse.error.statusCode).send(errorResponse);
//       }
//     }
//   );

  // ==========================================
  // GET /api/tournaments/user/:userId - Tournois d'un utilisateur
  // ==========================================
//   app.get<{ Params: { userId: string } }>(
//     '/api/tournaments/user/:userId',
//     { preHandler: authenticate },
//     async (request, reply) => {
//       try {
//         const tournaments = await tournamentService.findByCreator(request.params.userId);
//         return formatSuccess(tournaments, 'User tournaments retrieved successfully');
//       } catch (error) {
//         const errorResponse = formatGenericError(
//           error instanceof Error ? error : new Error('Failed to retrieve user tournaments')
//         );
//         return reply.status(errorResponse.error.statusCode).send(errorResponse);
//       }
//     }
//   );

  // ==========================================
  // PATCH /api/tournaments/:code/status - Changer le statut
  // ==========================================
  app.patch<{ 
    Params: { code: string }
    Body: { status: string }
  }>(
    '/api/tournaments/:code/status',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const tournament = await tournamentService.updateStatus(
          request.params.code,
          request.body.status as any // TournamentStatus
        );
        
        return formatSuccess(tournament, 'Tournament status updated successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to update tournament status')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // POST /api/tournaments/:code/start - Démarrer un tournoi
  // ==========================================
  app.post<{ Params: { code: string } }>(
    '/api/tournaments/:code/start',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const tournament = await tournamentService.start(request.params.code);
        return formatSuccess(tournament, 'Tournament started successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to start tournament')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // POST /api/tournaments/:code/close - Clôturer un tournoi
  // ==========================================
  app.post<{ Params: { code: string } }>(
    '/api/tournaments/:code/close',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const tournament = await tournamentService.close(request.params.code);
        return formatSuccess(tournament, 'Tournament closed successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to close tournament')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // DELETE /api/tournaments/:code - Supprimer un tournoi
  // ==========================================
  app.delete<{ Params: { code: string } }>(
    '/api/tournaments/:code',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        await tournamentService.delete(request.params.code);
        return formatSuccess(null, 'Tournament deleted successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to delete tournament')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/tournaments/:code/stats - Stats du tournoi
  // ==========================================
  app.get<{ Params: { code: string } }>(
    '/api/tournaments/:code/stats',
    async (request, reply) => {
      try {
        const stats = await tournamentService.getStats(request.params.code);
        return formatSuccess(stats, 'Tournament stats retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve tournament stats')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/tournaments/:code/is-full - Vérifier si plein
  // ==========================================
  app.get<{ Params: { code: string } }>(
    '/api/tournaments/:code/is-full',
    async (request, reply) => {
      try {
        const isFull = await tournamentService.isFull(request.params.code);
        return formatSuccess({ isFull }, 'Tournament capacity checked successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve tournament stats')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );
}