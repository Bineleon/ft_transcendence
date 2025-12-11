import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Tournament, Match } from "./blockchain.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    // Initialiser le provider
    const rpcUrl = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialiser le wallet
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found in .env");
    }
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

    // Charger le contrat
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("CONTRACT_ADDRESS not found in .env");
    }

    // Charger l'ABI du contrat
    const artifactPath = path.join(__dirname, "../../../artifacts/contracts/TournamentScore.sol/TournamentScore.json");
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found at ${artifactPath}. Run: npx hardhat compile`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    this.contract = new ethers.Contract(contractAddress, artifact.abi, this.wallet);

    console.log("✅ Blockchain service initialized");
    console.log(`📍 Contract address: ${contractAddress}`);
    console.log(`📡 Network: ${rpcUrl}`);
  }

  /**
   * Enregistrer un tournoi complet avec tous ses matchs
   */
  async recordTournament(
    tournamentId: number,
    winner: string,
    players: string[],
    matches: Match[]
  ): Promise<string> {
    try {
      console.log(`📤 Recording tournament ${tournamentId} on blockchain...`);
      console.log(`   Winner: ${winner}`);
      console.log(`   Players: ${players.length}`);
      console.log(`   Matches: ${matches.length}`);

      // Vérifier si le tournoi existe déjà
      const exists = await this.tournamentExists(tournamentId);
      if (exists) {
        throw new Error(`Tournament ${tournamentId} already exists on blockchain`);
      }

      // Formater les matchs pour Solidity
      const formattedMatches = matches.map(match => ({
        matchId: match.matchId,
        player1: match.player1,
        player2: match.player2,
        scorePlayer1: match.scorePlayer1,
        scorePlayer2: match.scorePlayer2,
        winner: match.winner,
        timestamp: match.timestamp
      }));

      // Envoyer la transaction
      const tx = await this.contract.recordTournament(
        tournamentId,
        winner,
        players,
        formattedMatches
      );

      console.log(`⏳ Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      console.log(`✅ Tournament ${tournamentId} recorded (block ${receipt.blockNumber})`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      
      return tx.hash;
    } catch (error: any) {
      console.error("❌ Error recording tournament:", error);
      throw new Error(`Failed to record tournament: ${error.message}`);
    }
  }

  /**
   * Récupérer un tournoi complet depuis la blockchain
   */
  async getTournament(tournamentId: number): Promise<Tournament> {
    try {
      const tournament = await this.contract.getTournament(tournamentId);

      return {
        id: Number(tournament.id),
        winner: tournament.winner,
        players: tournament.players,
        matches: tournament.matches.map((match: any) => ({
          matchId: Number(match.matchId),
          player1: match.player1,
          player2: match.player2,
          scorePlayer1: Number(match.scorePlayer1),
          scorePlayer2: Number(match.scorePlayer2),
          winner: match.winner,
          timestamp: Number(match.timestamp)
        })),
        timestamp: Number(tournament.timestamp),
        exists: tournament.exists
      };
    } catch (error: any) {
      console.error("❌ Error fetching tournament:", error);
      throw new Error(`Failed to fetch tournament: ${error.message}`);
    }
  }

  /**
   * Récupérer uniquement les matchs d'un tournoi
   */
  async getTournamentMatches(tournamentId: number): Promise<Match[]> {
    try {
      const matches = await this.contract.getTournamentMatches(tournamentId);

      return matches.map((match: any) => ({
        matchId: Number(match.matchId),
        player1: match.player1,
        player2: match.player2,
        scorePlayer1: Number(match.scorePlayer1),
        scorePlayer2: Number(match.scorePlayer2),
        winner: match.winner,
        timestamp: Number(match.timestamp)
      }));
    } catch (error: any) {
      console.error("❌ Error fetching matches:", error);
      throw new Error(`Failed to fetch matches: ${error.message}`);
    }
  }

  /**
   * Récupérer un match spécifique
   */
  async getMatch(tournamentId: number, matchIndex: number): Promise<Match> {
    try {
      const match = await this.contract.getMatch(tournamentId, matchIndex);

      return {
        matchId: Number(match.matchId),
        player1: match.player1,
        player2: match.player2,
        scorePlayer1: Number(match.scorePlayer1),
        scorePlayer2: Number(match.scorePlayer2),
        winner: match.winner,
        timestamp: Number(match.timestamp)
      };
    } catch (error: any) {
      console.error("❌ Error fetching match:", error);
      throw new Error(`Failed to fetch match: ${error.message}`);
    }
  }

  /**
   * Vérifier si un tournoi existe
   */
  async tournamentExists(tournamentId: number): Promise<boolean> {
    try {
      return await this.contract.tournamentExists(tournamentId);
    } catch (error: any) {
      console.error("❌ Error checking tournament:", error);
      return false;
    }
  }

  /**
   * Obtenir le nombre total de tournois
   */
  async getTournamentCount(): Promise<number> {
    try {
      const count = await this.contract.getTournamentCount();
      return Number(count);
    } catch (error: any) {
      console.error("❌ Error getting tournament count:", error);
      return 0;
    }
  }

  /**
   * Obtenir le nombre de matchs d'un tournoi
   */
  async getMatchCount(tournamentId: number): Promise<number> {
    try {
      const count = await this.contract.getMatchCount(tournamentId);
      return Number(count);
    } catch (error: any) {
      console.error("❌ Error getting match count:", error);
      return 0;
    }
  }

  /**
   * Obtenir l'URL de l'explorateur de blocs
   */
  getExplorerUrl(txHash: string): string {
    return `https://testnet.snowtrace.io/tx/${txHash}`;
  }

  /**
   * Obtenir l'URL de l'explorateur pour une adresse
   */
  getAddressExplorerUrl(address: string): string {
    return `https://testnet.snowtrace.io/address/${address}`;
  }
}