import { AuthService } from './src/modules/auth/auth.service.js';
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

// Initialisation Prisma et AuthService
const prisma = new PrismaClient();
const authService = new AuthService(prisma);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    console.log('--- Test 2FA ---');

    // 1️⃣ Enregistrement d'un nouvel utilisateur
    const email = await question('Email: ');
    const username = await question('Username: ');
    const password = await question('Password: ');

    const registerRes = await authService.register({ email, username, password });
    console.log('REGISTER:', registerRes);

    // 2️⃣ Login (envoi du code 2FA)
    const loginRes = await authService.login({ username, password });
    console.log('LOGIN:', loginRes);

    // 3️⃣ Vérification du code 2FA
    const code = await question('Enter the 2FA code you received by email: ');

    const verifyRes = await authService.verify2FA(email, code);
    console.log('2FA VERIFIED, JWT token:', verifyRes.token);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
