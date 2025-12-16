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

  // ==========================================
  // PATCH /api/tournaments/:code/status - Changer le statut
  // ==========================================
  app.patch<{
    Params: { code: string };
    Body: { status: string };
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
  // POST /api/tournaments/:code/join - Rejoindre un tournoi (P2 alias OU compte existant)
  // ==========================================
  // app.post<{
  //   Params: { code: string };
  //   Body: {
  //     username: string;
  //     password: string;
  //   };
  // }>(
  //   '/api/tournaments/:code/join',
  //   { preHandler: authenticate }, // P1 est loggé, on ne touche pas à ses cookies
  //   async (request, reply) => {
  //     try {
  //       const { code } = request.params;
  //       const { username } = request.body;

  //       if (
  //         !username ||
  //         typeof username !== 'string' ||
  //         username.trim().length === 0
  //       ) {
  //         const errorResponse = formatGenericError(
  //           new Error('Username and password are required to join as user')
  //         );
  //         return reply.status(400).send(errorResponse);
  //       }

  //       const tournament = await tournamentService.joinWithCredentials(
  //         code,
  //         username.trim(),
  //         password
  //       );
  //       return formatSuccess(
  //         tournament,
  //         `User "${username.trim()}" joined tournament successfully`
  //       );

  //       const errorResponse = formatGenericError(
  //         new Error('Invalid join mode (must be "alias" or "user")')
  //       );
  //       return reply.status(400).send(errorResponse);
  //     } catch (error) {
  //       const errorResponse = formatGenericError(
  //         error instanceof Error ? error : new Error('Failed to join tournament')
  //       );
  //       return reply.status(errorResponse.error.statusCode).send(errorResponse);
  //     }
  //   }
  // );

  // ==========================================
  // POST /api/tournaments/:code/join - Rejoindre un tournoi
  // ==========================================
app.post<{ Params: { code: string } }>(
  "/api/tournaments/:code/join",
  { preHandler: authenticate },
  async (request, reply) => {
    try {
      const { code } = request.params;

      const userId = request.user?.userId;
      if (!userId) {
        const errorResponse = formatGenericError(new Error("Missing userId in token"));
        return reply.status(401).send(errorResponse);
      }

      const tournament = await tournamentService.joinByUserId(code, userId);
      return formatSuccess(tournament, "Successfully joined tournament");
    } catch (error) {
      const errorResponse = formatGenericError(
        error instanceof Error ? error : new Error("Failed to join tournament")
      );
      return reply.status(errorResponse.error.statusCode).send(errorResponse);
    }
  }
);



  // ==========================================
  // DELETE /api/tournaments/:code/join - Se désinscrire du tournoi (alias ou user)
  // ==========================================
  app.delete<{
    Params: { code: string };
    Body: {
      userName?: string;
    };
  }>(
    '/api/tournaments/:code/join',
    { preHandler: authenticate }, // P1 reste loggé, on ne touche à aucune session
    async (request, reply) => {
      try {
        const { code } = request.params;
        const { userName } = request.body;

        if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
          const errorResponse = formatGenericError(
            new Error('userName is required to leave as user')
          );
          return reply.status(400).send(errorResponse);
        }

        const tournament = await tournamentService.leaveWithUser(
          code,
          userName.trim()
        );
        return formatSuccess(
          tournament,
          `User "${userName.trim()}" left tournament successfully`
        );

        const errorResponse = formatGenericError(
          new Error('Invalid leave mode (must be "alias" or "user")')
        );
        return reply.status(400).send(errorResponse);
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to leave tournament')
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
