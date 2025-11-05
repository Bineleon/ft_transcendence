/**
 * Module Auth - Point d'entrée
 */

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { UserService } from '../users/users.service.js';  // ← Ajouter
import { authController } from './auth.controller.js';

/**
 * Initialiser le module Auth
 * 
 * @param app - Instance Fastify
 * @param prisma - Client Prisma
 */
export function setupAuthModule(app: FastifyInstance, prisma: PrismaClient) {
  // Créer les services
  const authService = new AuthService(prisma);
  const userService = new UserService(prisma);  // ← Ajouter
  
  // Enregistrer les routes (passer les 2 services)
  authController(app, authService, userService);  // ← Ajouter userService
}

/**
 * Exporter les types publics du module
 */
export type {
  RegisterRequest,
  LoginRequest,
  AuthResponse
} from './auth.model.js';