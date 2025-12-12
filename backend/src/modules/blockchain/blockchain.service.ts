import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Match {
  matchId: number;
  player1: string;
  player2: string;
  scorePlayer1: number;
  scorePlayer2: number;
  winner: string;
  timestamp: number;
}

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

  /**
   * Enregistrer un tournoi sur la blockchain
   * @returns Transaction hash
   */
  async recordTournament(
    tournamentId: number,
    winner: string,
    players: string[],
    matches: Match[]
  ): Promise<string> {
    try {
      console.log(`📤 Recording tournament ${tournamentId}...`);

      // Vérifier si existe déjà
      const exists = await this.contract.tournamentExists(tournamentId);
      if (exists) {
        throw new Error(`Tournament ${tournamentId} already exists on blockchain`);
      }

      // Envoyer la transaction
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

  /**
   * URL de l'explorateur
   */
  getExplorerUrl(txHash: string): string {
    return `https://testnet.snowtrace.io/tx/${txHash}`;
  }
}