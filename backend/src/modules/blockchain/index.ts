export { BlockchainService } from "./blockchain.service.js";
export { blockchainRoutes } from "./blockchain.controller.js";
export type {
  Match,
  RecordTournamentRequest,
  Tournament,
  BlockchainResponse
} from "./blockchain.model.js";

import type { FastifyInstance } from "fastify";
import { blockchainRoutes } from "./blockchain.controller.js";

export function setupBlockchainModule(app: FastifyInstance) {
  app.register(blockchainRoutes, { prefix: "/api/blockchain" });
  console.log("✅ Blockchain module registered");
}