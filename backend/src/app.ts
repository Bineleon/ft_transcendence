import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fs from 'node:fs';
import { setupFriendsModule } from './modules/friends/index.js';
import { setupAuthModule } from './modules/auth/index.js';
import { avatarRoutes } from './modules/upload/upload.controller.js';
import { setupErrorHandler } from './shared/middleware/index.js'; 
import { getPrismaClient } from './shared/database/prisma.js';
import { env } from './shared/config/environment.js';

export function createApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
    }
  });

  // --- Plugins ---
  app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  app.register(cookie, { secret: env.COOKIE_SECRET });

  app.register(helmet, { contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false });

  // --- Error handler ---
  setupErrorHandler(app);

  // --- Database ---
  const prisma = getPrismaClient();

  // --- Modules ---
  setupAuthModule(app, prisma);
  setupFriendsModule(app);

  // --- Health check ---
  app.get('/health', async () => ({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));

  // --- Multipart ---
  app.register(multipart, {
    limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
  });

  // --- Créer le dossier avatars si inexistant ---
  const avatarDir = '/app/avatars';
  if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

  // --- Upload controller ---
  avatarRoutes(app);

  return app;
}
