import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
//   if (userCount > 0) {
    // console.log('Seed skipped: DB not empty');
    // return;
//   }
  // --- SEED ---
  const nelbi = await prisma.user.create({
    data: { username: 'neleon', email: 'neleon@example.com', passwordHash: '...' }
  });
  const felix = await prisma.user.create({
    data: { username: 'fcoullou', email: 'fcoullou@example.com', passwordHash: '...' }
  });
  const yoann = await prisma.user.create({
    data: { username: 'ylenoel', email: 'ylenoel@example.com', passwordHash: '...' }
  });
  const t1 = await prisma.tournament.create({ data: { name: 'Demo Tournament' } });
  await prisma.match.create({
    data: { tournamentId: t1.id, p1UserId: nelbi.id, p2UserId: felix.id }
  });
  const t2 = await prisma.tournament.create({ data: { name: 'Demo Tournament' } });
  await prisma.match.create({
    data: { tournamentId: t2.id, p1UserId: yoann.id, p2UserId: felix.id }
  });
  console.log('Seed done ✅');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
