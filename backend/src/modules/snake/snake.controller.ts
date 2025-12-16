import type { FastifyInstance } from 'fastify';
import { SnakeService } from './snake.service.js';
import type { CreateSnakeMatchDTO } from './snake.model.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { formatGenericError } from '../../shared/errors/formatters.js';

export function snakeController(
  app: FastifyInstance,
  snakeService: SnakeService
) {
  
  // ==========================================
  // POST /api/snake/matches - Créer un match Snake
  // ==========================================
  app.post<{ Body: CreateSnakeMatchDTO }>(
    '/api/snake/matches',
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
          console.log('[POST /api/snake/matches] Both players are guests, skipping DB record');
          return formatSuccess(null, 'Match not recorded (both players are guests)');
        }

        const match = await snakeService.create(data);
        return formatSuccess(match, 'Snake match created successfully');
        
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to create snake match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/snake/matches/:id - Récupérer un match par ID
  // ==========================================
  app.get<{ Params: { id: string } }>(
    '/api/snake/matches/:id',
    async (request, reply) => {
      try {
        const match = await snakeService.findById(request.params.id);
        
        if (!match) {
          const errorResponse = formatGenericError(new Error('Snake match not found'));
          return reply.status(404).send(errorResponse);
        }

        return formatSuccess(match, 'Snake match retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve snake match')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/snake/matches - Lister tous les matchs Snake
  // ==========================================
  app.get(
    '/api/snake/matches',
    async (_request, reply) => {
      try {
        const matches = await snakeService.findAll();
        return formatSuccess(matches, 'Snake matches retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve snake matches')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );

  // ==========================================
  // GET /api/snake/matches/player/:userId - Matchs d'un joueur
  // ==========================================
  app.get<{ Params: { userId: string } }>(
    '/api/snake/matches/player/:userId',
    async (request, reply) => {
      try {
        const matches = await snakeService.findByPlayer(request.params.userId);
        return formatSuccess(matches, 'Player snake matches retrieved successfully');
      } catch (error) {
        const errorResponse = formatGenericError(
          error instanceof Error ? error : new Error('Failed to retrieve player snake matches')
        );
        return reply.status(errorResponse.error.statusCode).send(errorResponse);
      }
    }
  );
}
