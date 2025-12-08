import type { FastifyInstance } from 'fastify';
import { MatchService } from './match.service.js';
import type { CreateMatchDTO, UpdateMatchDTO, PlayedMatchResponse } from './match.model.js';
import { authenticate } from '../../shared/middleware/authentication.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { formatGenericError } from '../../shared/errors/formatters.js';

export function matchController(
  app: FastifyInstance,
  matchService: MatchService
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
  // POST /api/matches/:id/finish - Terminer un match
  // ==========================================
  app.post<{ 
    Params: { id: string }
    Body: { 
      winnerId: string
      p1Score?: number
      p2Score?: number
    }
  }>(
    '/api/matches/:id/finish',
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { winnerId, p1Score, p2Score } = request.body;
        
        if (!winnerId) {
          const errorResponse = formatGenericError(new Error('winnerId is required'));
          return reply.status(400).send(errorResponse);
        }

        const match = await matchService.finish(request.params.id, winnerId, p1Score, p2Score);
        
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
  // GET /api/matches/:id/played - Stats d'un match joué
  // ==========================================
  app.post<{ Body: PlayedMatchResponse; }>(
    `/api/matches/played`,
    async (request, reply) => {
      if (request.body.p1IsGuest && request.body.p2IsGuest) {
        return formatSuccess(`2 Guests, no save`);
      }

      try {
        const match = await matchService.createAndRecordStats(request.body);
        return formatSuccess(match, `Match created and filled successfully`);
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to create match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );
}

