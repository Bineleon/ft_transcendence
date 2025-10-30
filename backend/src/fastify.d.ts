/**
 * Déclarations TypeScript pour étendre Fastify
 * 
 * Ce fichier permet d'ajouter des propriétés personnalisées
 * aux objets Fastify tout en gardant le typage TypeScript
 */

import 'fastify';
import type { JwtPayload } from './shared/utils/jwt.js';

/**
 * Payload du token JWT décodé
 */
interface JwtPayload {
  userId: string;
  iat?: number;  // Issued at
  exp?: number;  // Expiration
}

/**
 * Extension de FastifyRequest
 * Ajoute la propriété 'user' disponible après authenticate
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}