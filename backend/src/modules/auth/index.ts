// src/modules/auth/index.ts

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { UserService } from '../users/users.service.js';
import { RefreshService } from './refresh.service.js';
import { authController } from './auth.controller.js';

// src/modules/auth/index.ts
export function setupAuthModule(app: FastifyInstance, prisma: PrismaClient) {
  const authService = new AuthService(prisma);
  const userService = new UserService(prisma);
  const refreshService = new RefreshService(prisma);

  // Passe RefreshService en 4ᵉ argument
  authController(app, authService, userService, refreshService);
}


export type { RegisterRequest, LoginRequest, AuthResponse } from './auth.model.js';
