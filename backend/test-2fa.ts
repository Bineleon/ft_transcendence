import readline from 'readline';
import { PrismaClient } from '@prisma/client';
import { AuthService } from './src/modules/auth/auth.service.js';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  console.log('--- Test 2FA ---');

  const email = 'yoann.lenoel@gmail.com';
  const username = 'Yoh';
  const password = 'Prout123!';

  // --- REGISTER ---
  const registerResult = await authService.register({ email, username, password });
  console.log('REGISTER:', registerResult);

  // --- LOGIN ---
  const loginResult = await authService.login({ username, password });
  console.log('LOGIN:', loginResult);

  // --- Récupérer le dernier code 2FA stocké dans la DB ---
  const twoFactorRecord = await prisma.twoFactor.findFirst({
    where: { userId: loginResult.userId, used: false },
    orderBy: { expiresAt: 'desc' }
  });

  if (!twoFactorRecord) {
    console.error('Aucun code 2FA trouvé pour cet utilisateur !');
    process.exit(1);
  }

  console.log('Code 2FA généré (pour test uniquement) :', twoFactorRecord.code);

  // --- Demander le code à l’utilisateur ---
  const inputCode = await ask('Enter the 2FA code you received by email: ');

  try {
    const verifyResult = await authService.verify2FA(loginResult.userId, inputCode);
    console.log('VERIFIED:', verifyResult);
  } catch (err: any) {
    console.error('Erreur lors de la vérification 2FA:', err.message);
  }

  await prisma.$disconnect();
}

main();
