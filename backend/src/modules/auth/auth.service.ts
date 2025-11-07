/**
 * Service pour la gestion de l'authentification
 */

import type { PrismaClient } from '@prisma/client';
import type { RegisterRequest, LoginRequest, AuthResponse } from './auth.model.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import { generateToken } from '../../shared/utils/jwt.js';
import {
  ValidationError,
  ConflictError,
  AuthError
} from '../../shared/errors/index.js';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterRequest): Promise<AuthResponse> {
    this.validateRegisterData(data);

    const existingEmail = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new ConflictError('Email already in use');

    const existingUsername = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (existingUsername) throw new ConflictError('Username already in use');

    const passwordHash = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: { email: data.email, username: data.username, passwordHash }
    });

    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      token
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    this.validateLoginData(data);

    const user = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (!user) throw new AuthError('Invalid username or password');

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) throw new AuthError('Invalid username or password');

    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      token
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) throw new AuthError('Utilisateur introuvable');
    return user;
  }

  private validateRegisterData(data: RegisterRequest): void {
    if (!data.email || typeof data.email !== 'string') throw new ValidationError('Email is required');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) throw new ValidationError('Invalid email format');

    if (!data.username || typeof data.username !== 'string') throw new ValidationError('Username is required');
    if (data.username.length < 3 || data.username.length > 20) throw new ValidationError('Username must be between 3 and 20 characters');
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(data.username)) throw new ValidationError('Username can only contain letters, numbers, underscores and hyphens');

    if (!data.password || typeof data.password !== 'string') throw new ValidationError('Password is required');
    if (data.password.length < 8) throw new ValidationError('Password must be at least 8 characters long');
  }

  private validateLoginData(data: LoginRequest): void {
    if (!data.username || typeof data.username !== 'string') throw new ValidationError('Username is required');
    if (data.username.length < 3 || data.username.length > 20) throw new ValidationError('Username must be between 3 and 20 characters');

    if (!data.password || typeof data.password !== 'string') throw new ValidationError('Password is required');
    if (data.password.length < 1) throw new ValidationError('Password is required');
  }
}
