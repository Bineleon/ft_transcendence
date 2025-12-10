import type { FastifyInstance } from 'fastify';
import { MatchService } from './match.service.js';
import { matchController } from './match.controller.js';

/**
 * Configuration et initialisation du module Match
 */
export function setupMatchModule(app: FastifyInstance) {
  const matchService = new MatchService();
  matchController(app, matchService);
}

// Exporter les types publics
export type { CreateMatchDTO, UpdateMatchDTO, MatchResponse } from './match.model.js';
export { MatchService } from './match.service.js';