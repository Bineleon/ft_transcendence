import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { UserService } from '../users/users.service.js';
import { authController } from './auth.controller.js';

export function setupAuthModule(app: FastifyInstance, prisma: PrismaClient) {
  const authService = new AuthService(prisma);
  const userService = new UserService(prisma);

  authController(app, authService, userService);
}

export type { RegisterRequest, LoginRequest, AuthResponse } from './auth.model.js';
