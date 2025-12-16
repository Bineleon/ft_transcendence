import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// Obtenir __dirname en ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying TournamentScore contract...");
  
  // Charger l'artifact compilé
  const artifactPath = path.join(__dirname, "../artifacts/contracts/TournamentScore.sol/TournamentScore.json");
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Contract not compiled! Run: npx hardhat compile");
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Déterminer le réseau
  const networkName = process.argv.includes("--network") 
    ? process.argv[process.argv.indexOf("--network") + 1] 
    : "hardhat";
  
  console.log(`📡 Network: ${networkName}`);
  
  // Créer le provider
  let provider: ethers.JsonRpcProvider;
  let wallet: ethers.Wallet;
  
  if (networkName === "fuji") {
    const rpcUrl = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (!process.env.PRIVATE_KEY) {
      throw new Error("❌ PRIVATE_KEY not found in .env");
    }
    
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`📤 Deploying from: ${wallet.address}`);
    
  } else {
    // Réseau local Hardhat
    provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Utiliser le compte par défaut de Hardhat
    wallet = new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );
    console.log(`📤 Deploying from: ${wallet.address} (Hardhat default)`);
  }
  
  // Créer la factory
  const TournamentScore = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );
  
  console.log("📤 Sending deployment transaction...");
  const contract = await TournamentScore.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log("\n✅ Contract deployed successfully!");
  console.log(`📍 Address: ${address}`);
  
  if (networkName === "fuji") {
    console.log(`🔗 SnowTrace: https://testnet.snowtrace.io/address/${address}`);
  }
  
  console.log("\n⚙️  Add this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });