/**
 * Service pour la gestion des utilisateurs
 */

import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../shared/database/prisma.js';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserProfile,
  PublicUserProfile,
  UpdateUserData
} from './users.model.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import { formatUser } from '../../shared/utils/formatters.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthError
} from '../../shared/errors/index.js';

export class UserService {
  private readonly SEARCH_LIMIT = 50;
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
  }

  async getOwnProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    return formatUser(user);
  }

  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatarUrl: true, createdAt: true }
    });
    if (!user) throw new NotFoundError('User not found');
    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString()
    };
  }

  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
    const exists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!exists) throw new NotFoundError('User not found');

    if (data.email !== undefined) {
      const emailTaken = await this.prisma.user.findFirst({
        where: { email: data.email, id: { not: userId } }
      });
      if (emailTaken) throw new ConflictError('Email already in use');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) throw new ValidationError('Invalid email format');
    }

    if (data.username !== undefined) {
      if (data.username.length < 3 || data.username.length > 20) throw new ValidationError('Username must be between 3 and 20 characters');
      const usernameTaken = await this.prisma.user.findFirst({
        where: { username: data.username, id: { not: userId } }
      });
      if (usernameTaken) throw new ConflictError('Username already in use');
    }

    if (data.password !== undefined && data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const updateData: UpdateUserData = {
      ...(data.email && { email: data.email }),
      ...(data.username && { username: data.username }),
      ...(data.password && { password: await hashPassword(data.password) })
    };

    const user = await this.prisma.user.update({ where: { id: userId }, data: updateData });
    return formatUser(user);
  }

  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    if (!data.currentPassword || !data.newPassword) throw new ValidationError('Current and new password are required');
    if (data.newPassword.length < 8) throw new ValidationError('New password must be at least 8 characters long');
    if (data.currentPassword === data.newPassword) throw new ValidationError('New password must be different from current password');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    if (!user.passwordHash) throw new AuthError("This account was created via Google OAuth and has no password to change.");

    const isValid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!isValid) throw new AuthError('Current password is incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(data.newPassword) }
    });
  }

  async searchUsers(search: string) {
    const limit = this.SEARCH_LIMIT;
    const where = search ? { username: { contains: search, mode: 'insensitive' as const } } : {};
    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, username: true, avatarUrl: true },
      take: limit,
      orderBy: { username: 'asc' }
    });
    const total = await this.prisma.user.count({ where });
    return { items: users, total, limit, hasMore: total > limit };
  }

  /**
   * Supprime toutes les données d'un utilisateur et son compte
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    // Supprimer toutes les relations amicales
    await this.prisma.friend.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } });

    // Supprimer les sessions
    await this.prisma.session.deleteMany({ where: { userId } });

    // Supprimer les refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    // Supprimer les codes 2FA
    await this.prisma.twoFactor.deleteMany({ where: { userId } });

    // Enfin, supprimer l’utilisateur
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async userExists(userId: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { id: userId } });
    return count > 0;
  }

  async getTotalUsers(): Promise<number> {
    return this.prisma.user.count();
  }
}
