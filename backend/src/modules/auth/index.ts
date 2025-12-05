// src/modules/auth/index.ts

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { UserService } from '../users/users.service.js';
import { RefreshService } from './refresh.service.js';
import { authController } from './auth.controller.js';
import { GoogleOAuthService } from './google-oauth.service.js';

export function setupAuthModule(app: FastifyInstance, prisma: PrismaClient) {
  const authService = new AuthService(prisma);
  const userService = new UserService(prisma);
  const refreshService = new RefreshService(prisma);
  const googleOAuthService = new GoogleOAuthService(prisma);

  authController(app, authService, userService, refreshService, googleOAuthService);
}

export type { RegisterRequest, LoginRequest, AuthResponse } from './auth.model.js';
