import type { FastifyInstance } from 'fastify';
import { MatchService } from './match.service.js';
import { matchController } from './match.controller.js';
import { UserService } from '../users/users.service.js';

/**
 * Configuration et initialisation du module Match
 */
export function setupMatchModule(app: FastifyInstance) {
  const matchService = new MatchService();
  const userService = new UserService();
  matchController(app, matchService, userService);
}

// Exporter les types publics
export type { CreateMatchDTO, UpdateMatchDTO, MatchResponse } from './match.model.js';
export { MatchService } from './match.service.js';