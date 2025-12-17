import type { FastifyInstance } from 'fastify';
import { SnakeService } from './snake.service.js';
import type { CreateSnakeMatchDTO } from './snake.model.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { formatGenericError } from '../../shared/errors/formatters.js';
import { authenticate } from '../../shared/middleware/authentication.js';
import type { UserService } from '../users/users.service.js';

export function snakeController(
  app: FastifyInstance,
  snakeService: SnakeService,
  userService: UserService
) {
  
  // ==========================================
  // POST /api/snake/matches - Créer un match Snake
  // ==========================================
  app.post<{ Body: CreateSnakeMatchDTO }>(
    '/api/snake/matches',
    async (request, reply) => {
      try {
        console.log('[POST /api/snake/matches] ===== REQUEST START =====');
        console.log('[POST /api/snake/matches] Request body:', JSON.stringify(request.body, null, 2));
        
        const data = request.body;

        // Validation basique
        if (!data.p1Username || !data.p2Username) {
          console.error('[POST /api/snake/matches] ❌ Missing usernames');
          return reply.code(400).send({
            error: {
              message: 'p1Username and p2Username are required',
              statusCode: 400
            }
          });
        }

        console.log('[POST /api/snake/matches] Players:', {
          p1: { username: data.p1Username, isGuest: data.p1IsGuest },
          p2: { username: data.p2Username, isGuest: data.p2IsGuest }
        });

        // Si les deux sont guests, ne rien enregistrer
        if (data.p1IsGuest && data.p2IsGuest) {
          console.log('[POST /api/snake/matches] Both players are guests, skipping DB record');
          return formatSuccess(null, 'Match not recorded (both players are guests)');
        }

        console.log('[POST /api/snake/matches] Calling snakeService.create...');
        const match = await snakeService.create(data);
        console.log('[POST /api/snake/matches] ✅ Match created successfully:', match.id);
        console.log('[POST /api/snake/matches] ===== REQUEST END =====');
        
        return formatSuccess(match, 'Snake match created successfully');
        
      } catch (error) {
        console.error('[POST /api/snake/matches] ❌ ERROR occurred:');
        console.error('[POST /api/snake/matches] Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('[POST /api/snake/matches] Error message:', error instanceof Error ? error.message : String(error));
        console.error('[POST /api/snake/matches] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('[POST /api/snake/matches] ===== REQUEST END WITH ERROR =====');
        
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

  // ==========================================
  // GET /api/profile/dashboard/recent-snake-matches - Dashboard recent Snake matches
  // Query param: username (optional) - if provided, get stats for that user instead of logged-in user
  // ==========================================
  app.get<{ Querystring: { username?: string } }>(
    '/api/profile/dashboard/recent-snake-matches',
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
      
      console.log('[GET /api/profile/dashboard/recent-snake-matches] Request from userId:', userId);
      
      const matches = await snakeService.getRecentSnakeMatchesForUser(userId);
      
      console.log('[GET /api/profile/dashboard/recent-snake-matches] Returning', matches.length, 'matches');
      console.log('[GET /api/profile/dashboard/recent-snake-matches] Response data:', JSON.stringify({ matches }, null, 2));
      
      return formatSuccess({ matches }, 'Recent snake matches loaded');
    }
  );
}
