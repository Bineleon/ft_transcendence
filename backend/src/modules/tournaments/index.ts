import type { FastifyInstance } from 'fastify';
import { TournamentService } from './tournament.service.js';
import { tournamentController } from './tournament.controller.js';

/**
 * Configuration et initialisation du module Tournament
 */
export function setupTournamentModule(app: FastifyInstance) {
  const tournamentService = new TournamentService();
  tournamentController(app, tournamentService);
}

// Exporter les types publics si besoin
export type { CreateTournamentDTO, TournamentResponse } from './tournament.model.js';
export { TournamentService } from './tournament.service.js';