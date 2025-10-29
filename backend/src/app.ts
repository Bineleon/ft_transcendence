import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';

// Configuration
import { env } from './shared/config/environment.js';

// Middleware
import { setupErrorHandler } from './shared/middleware/errorHandler.js';

// Database
import { getPrismaClient } from './shared/database/prisma.js';

// Modules
import { authController } from './modules/auth/index.js';
import { AuthService } from './modules/auth/index.js';

/**
 * Créer et configurer l'application Fastify
 */
export function createApp() {
  
  // ==========================================
  // 1️⃣ CRÉER L'INSTANCE FASTIFY
  // ==========================================
  
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      // Formateur pretty pour le dev
      transport: env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
    }
  });

  // ==========================================
  // 2️⃣ ENREGISTRER LES PLUGINS
  // ==========================================
  
  // CORS - Autoriser les requêtes du frontend
  app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Cookies - Gérer les cookies HTTP
  app.register(cookie, {
    secret: env.COOKIE_SECRET
  });

  // Helmet - Sécurité (headers HTTP)
  app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false
  });

  // ==========================================
  // 3️⃣ GESTIONNAIRE D'ERREURS GLOBAL
  // ==========================================
  
  setupErrorHandler(app);

  // ==========================================
  // 4️⃣ BASE DE DONNÉES
  // ==========================================
  
  const prisma = getPrismaClient();

  // ==========================================
  // 5️⃣ SERVICES (Logique métier)
  // ==========================================
  
  const authService = new AuthService(prisma);

  // ==========================================
  // 6️⃣ ROUTES (Controllers)
  // ==========================================
  
  authController(app, authService);

  // ==========================================
  // 7️⃣ ROUTE DE SANTÉ (Health check)
  // ==========================================
  
  app.get('/health', async () => {
    return { 
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });

  // ==========================================
  // 8️⃣ RETOURNER L'APP
  // ==========================================
  
  return app;
}