import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Match, Tournament } from "./blockchain.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BlockchainService {
  private contract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    if (!process.env.PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
      throw new Error("PRIVATE_KEY and CONTRACT_ADDRESS required in .env");
    }

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const artifactPath = path.join(__dirname, "../../../artifacts/contracts/TournamentScore.sol/TournamentScore.json");
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found. Run: npx hardhat compile`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    this.contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, wallet);
    
    console.log("✅ Blockchain service initialized");
  }

  async recordTournament(
    tournamentId: number,
    winner: string,
    players: string[],
    matches: Match[]
  ): Promise<string> {
    try {
      console.log(`📤 Recording tournament ${tournamentId}...`);

      const exists = await this.contract.tournamentExists(tournamentId);
      if (exists) {
        throw new Error(`Tournament ${tournamentId} already exists on blockchain`);
      }

      const tx = await this.contract.recordTournament(
        tournamentId,
        winner,
        players,
        matches
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Tournament recorded (block ${receipt.blockNumber})`);
      
      return tx.hash;
    } catch (error: any) {
      console.error("❌ Error recording tournament:", error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }

  async getTournament(tournamentId: number): Promise<Tournament> {
    try {
      console.log(`📖 Reading tournament ${tournamentId} from blockchain...`);

      const exists = await this.contract.tournamentExists(tournamentId);
      if (!exists) {
        throw new Error(`Tournament ${tournamentId} not found on blockchain`);
      }

      const data = await this.contract.getTournament(tournamentId);

      const tournament: Tournament = {
        id: Number(data[0]),
        winner: data[1],
        players: data[2],
        matches: data[3].map((m: any) => ({
          matchId: Number(m.matchId),
          player1: m.player1,
          player2: m.player2,
          scorePlayer1: Number(m.scorePlayer1),
          scorePlayer2: Number(m.scorePlayer2),
          winner: m.winner,
          timestamp: Number(m.timestamp)
        })),
        timestamp: Number(data[4]),
        exists: true
      };

      console.log(`✅ Tournament ${tournamentId} retrieved from blockchain`);
      return tournament;

    } catch (error: any) {
      console.error("❌ Error reading tournament:", error);
      throw new Error(`Blockchain read error: ${error.message}`);
    }
  }

  getExplorerUrl(txHash: string): string {
    return `https://testnet.snowtrace.io/tx/${txHash}`;
  }
}