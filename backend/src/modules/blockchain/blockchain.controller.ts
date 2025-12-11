import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { BlockchainService } from "./blockchain.service.js";
import type { RecordTournamentRequest } from "./blockchain.model.js";

const blockchainService = new BlockchainService();

interface GetTournamentParams {
  id: string;
}

interface GetMatchParams {
  tournamentId: string;
  matchIndex: string;
}

export async function blockchainRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /api/blockchain/tournament
   * Enregistrer un tournoi complet avec tous ses matchs
   */
  fastify.post<{ Body: RecordTournamentRequest }>(
    "/tournament",
    async (
      request: FastifyRequest<{ Body: RecordTournamentRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const { tournamentId, winner, players, matches } = request.body;

        // Validations
        if (!tournamentId || !winner || !players || !matches) {
          return reply.status(400).send({
            success: false,
            error: "Missing required fields: tournamentId, winner, players, matches"
          });
        }

        if (players.length < 2) {
          return reply.status(400).send({
            success: false,
            error: "At least 2 players are required"
          });
        }

        if (matches.length === 0) {
          return reply.status(400).send({
            success: false,
            error: "At least one match is required"
          });
        }

        // Valider chaque match
        for (const match of matches) {
          if (!match.player1 || !match.player2 || !match.winner) {
            return reply.status(400).send({
              success: false,
              error: "Each match must have player1, player2, and winner"
            });
          }

          if (match.scorePlayer1 === undefined || match.scorePlayer2 === undefined) {
            return reply.status(400).send({
              success: false,
              error: "Each match must have scorePlayer1 and scorePlayer2"
            });
          }
        }

        // Enregistrer sur la blockchain
        const txHash = await blockchainService.recordTournament(
          tournamentId,
          winner,
          players,
          matches
        );

        return reply.status(201).send({
          success: true,
          transactionHash: txHash,
          explorerUrl: blockchainService.getExplorerUrl(txHash),
          message: `Tournament ${tournamentId} with ${matches.length} matches recorded on blockchain`
        });
      } catch (error: any) {
        console.error("Error recording tournament:", error);
        return reply.status(500).send({
          success: false,
          error: "Failed to record tournament on blockchain",
          details: error.message
        });
      }
    }
  );

  /**
   * GET /api/blockchain/tournament/:id
   * Récupérer un tournoi complet depuis la blockchain
   */
  fastify.get<{ Params: GetTournamentParams }>(
    "/tournament/:id",
    async (
      request: FastifyRequest<{ Params: GetTournamentParams }>,
      reply: FastifyReply
    ) => {
      try {
        const tournamentId = parseInt(request.params.id);

        if (isNaN(tournamentId)) {
          return reply.status(400).send({
            success: false,
            error: "Invalid tournament ID"
          });
        }

        const exists = await blockchainService.tournamentExists(tournamentId);
        if (!exists) {
          return reply.status(404).send({
            success: false,
            error: `Tournament ${tournamentId} not found on blockchain`
          });
        }

        const tournament = await blockchainService.getTournament(tournamentId);

        return reply.send({
          success: true,
          data: tournament
        });
      } catch (error: any) {
        console.error("Error fetching tournament:", error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch tournament from blockchain",
          details: error.message
        });
      }
    }
  );

  /**
   * GET /api/blockchain/tournament/:id/matches
   * Récupérer uniquement les matchs d'un tournoi
   */
  fastify.get<{ Params: GetTournamentParams }>(
    "/tournament/:id/matches",
    async (
      request: FastifyRequest<{ Params: GetTournamentParams }>,
      reply: FastifyReply
    ) => {
      try {
        const tournamentId = parseInt(request.params.id);

        if (isNaN(tournamentId)) {
          return reply.status(400).send({
            success: false,
            error: "Invalid tournament ID"
          });
        }

        const matches = await blockchainService.getTournamentMatches(tournamentId);

        return reply.send({
          success: true,
          data: { matches }
        });
      } catch (error: any) {
        console.error("Error fetching matches:", error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch matches from blockchain",
          details: error.message
        });
      }
    }
  );

  /**
   * GET /api/blockchain/tournament/:tournamentId/match/:matchIndex
   * Récupérer un match spécifique
   */
  fastify.get<{ Params: GetMatchParams }>(
    "/tournament/:tournamentId/match/:matchIndex",
    async (
      request: FastifyRequest<{ Params: GetMatchParams }>,
      reply: FastifyReply
    ) => {
      try {
        const tournamentId = parseInt(request.params.tournamentId);
        const matchIndex = parseInt(request.params.matchIndex);

        if (isNaN(tournamentId) || isNaN(matchIndex)) {
          return reply.status(400).send({
            success: false,
            error: "Invalid tournament ID or match index"
          });
        }

        const match = await blockchainService.getMatch(tournamentId, matchIndex);

        return reply.send({
          success: true,
          data: match
        });
      } catch (error: any) {
        console.error("Error fetching match:", error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch match from blockchain",
          details: error.message
        });
      }
    }
  );

  /**
   * GET /api/blockchain/tournaments/count
   * Obtenir le nombre total de tournois
   */
  fastify.get("/tournaments/count", async (_request, reply) => {
    try {
      const count = await blockchainService.getTournamentCount();
      return reply.send({
        success: true,
        data: { count }
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: "Failed to get tournament count",
        details: error.message
      });
    }
  });

  /**
   * GET /api/blockchain/tournament/:id/matches/count
   * Obtenir le nombre de matchs d'un tournoi
   */
  fastify.get<{ Params: GetTournamentParams }>(
    "/tournament/:id/matches/count",
    async (
      request: FastifyRequest<{ Params: GetTournamentParams }>,
      reply: FastifyReply
    ) => {
      try {
        const tournamentId = parseInt(request.params.id);

        if (isNaN(tournamentId)) {
          return reply.status(400).send({
            success: false,
            error: "Invalid tournament ID"
          });
        }

        const count = await blockchainService.getMatchCount(tournamentId);

        return reply.send({
          success: true,
          data: { count }
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: "Failed to get match count",
          details: error.message
        });
      }
    }
  );

  /**
   * GET /api/blockchain/health
   * Vérifier la connexion blockchain
   */
  fastify.get("/health", async (_request, reply) => {
    try {
      const count = await blockchainService.getTournamentCount();
      const contractAddress = process.env.CONTRACT_ADDRESS;
      
      return reply.send({
        success: true,
        message: "Blockchain connection OK",
        data: {
          tournamentCount: count,
          contractAddress: contractAddress,
          explorerUrl: blockchainService.getAddressExplorerUrl(contractAddress!)
        }
      });
    } catch (error: any) {
      return reply.status(503).send({
        success: false,
        error: "Blockchain connection failed",
        details: error.message
      });
    }
  });
}