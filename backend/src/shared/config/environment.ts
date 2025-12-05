import dotenv from 'dotenv';
dotenv.config();

/**
 * Variables d'environnement typées
 */
export const env = {
  // Serveur
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://localhost:8443',

  // Secrets JWT / Cookies
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d', // durée d’expiration du token d’accès
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d', // token de refresh
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev-cookie-secret-change-in-prod',

  // Base de données
  DATABASE_URL: process.env.DATABASE_URL || 'file:/app/database/dev.db',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL || '',

  // Logging
  LOG_LEVEL: (process.env.LOG_LEVEL || 'info') as 'info' | 'warn' | 'error' | 'debug'
} as const;

/**
 * Helpers
 */
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
