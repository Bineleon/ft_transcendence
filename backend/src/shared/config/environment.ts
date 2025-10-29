export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://localhost:8443',

  // Secrets
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev-cookie-secret-change-in-prod',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:../database/dev.db',

  // Logs
  LOG_LEVEL: (process.env.LOG_LEVEL || 'info') as 'info' | 'error' | 'warn' | 'debug'
} as const;

// Helpers
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';