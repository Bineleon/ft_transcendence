import 'dotenv/config';
import { createApp } from './app.js';
import { disconnectPrisma } from './shared/database/prisma.js';
import { env } from './shared/config/environment.js';

async function start() {
  const app = createApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`CORS enabled for: ${env.FRONTEND_URL}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  } catch (err) {
    app.log.error(err);
    await disconnectPrisma();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received, shutting down...');
  await disconnectPrisma();
  process.exit(0);
});

start();
