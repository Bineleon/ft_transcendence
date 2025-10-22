import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { prisma } from './db';

const app = Fastify({ logger: true });
await app.register(fastifyCors, { origin: true });

app.get('/api/ping', async () => {
  // Exemple d’accès DB typé :
  const userCount = await prisma.user.count().catch(() => 0);
  return { ok: true, userCount };
});

app.get('/', async () => ({ message: 'Bienvenue sur l’API Transcendance 🚀' }));

app.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  await app.listen({ host: '0.0.0.0', port: 3000 });
};
start();
