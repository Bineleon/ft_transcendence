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

const ONLINE_UPDATE_THRESHOLD_MS = 15_000; // on n’update pas plus souvent que toutes les 15s

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
      if (data.username.length < 3 || data.username.length > 20) {
        throw new ValidationError('Username must be between 3 and 20 characters');
      }
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
    if (!data.currentPassword || !data.newPassword) {
      throw new ValidationError('Current and new password are required');
    }
    if (data.newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }
    if (data.currentPassword === data.newPassword) {
      throw new ValidationError('New password must be different from current password');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    if (!user.passwordHash) {
      throw new AuthError(
        'This account was created via Google OAuth and has no password to change.'
      );
    }

    const isValid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!isValid) throw new AuthError('Current password is incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(data.newPassword) }
    });
  }

  async searchUsers(search: string) {
    const limit = this.SEARCH_LIMIT;
    const where = search
      ? { username: { contains: search, mode: 'insensitive' as const } }
      : {};
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
   * Met à jour lastSeen pour un utilisateur, avec seuil pour éviter de spam la DB.
   */
  async updateLastSeen(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeen: true }
    });

    if (!user) return;

    const now = new Date();
    const lastSeen = user.lastSeen ?? new Date(0);

    // Pour éviter de spam la DB à chaque requête
    if (now.getTime() - lastSeen.getTime() < ONLINE_UPDATE_THRESHOLD_MS) {
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeen: now }
    });
  }

  /**
   * Renvoie un "rapport de données" pour l'utilisateur :
   * - infos de compte
   * - compteurs de relations / sessions / tokens / matches / tournois
   */
  async getPrivacyReport(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        lastSeen: true,
        // relations
        sessions: { select: { id: true, expiresAt: true, createdAt: true } },
        refreshTokens: { select: { id: true, createdAt: true, expiresAt: true } },
        TwoFactors: { select: { id: true, expiresAt: true, used: true } },
        friends: true,
        friendOf: true,
        matchesWon: true,
        matchesAsP1: true,
        matchesAsP2: true,
        createdTournaments: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Compter les amis uniques comme dans getFullProfile
    const friendIds = new Set<string>();
    for (const f of user.friends ?? []) {
      if (f.userId && f.userId !== user.id) friendIds.add(f.userId);
      if (f.friendId && f.friendId !== user.id) friendIds.add(f.friendId);
    }
    for (const f of user.friendOf ?? []) {
      if (f.userId && f.userId !== user.id) friendIds.add(f.userId);
      if (f.friendId && f.friendId !== user.id) friendIds.add(f.friendId);
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSeen: user.lastSeen
      },
      counts: {
        sessions: user.sessions.length,
        refreshTokens: user.refreshTokens.length,
        twoFactorCodes: user.TwoFactors.length,
        friends: friendIds.size,
        matchesTotal:
          user.matchesWon.length +
          user.matchesAsP1.length +
          user.matchesAsP2.length,
        tournamentsCreated: user.createdTournaments.length
      }
    };
  }

  /**
   * Anonymise un utilisateur :
   * - remplace email / username / avatar / password / googleId / playerRef
   * - supprime sessions, refresh tokens, 2FA, relations d'amis
   * - NE supprime PAS les matches / tournois (qui restent associés à un joueur "DeletedUser-xxxx")
   */
  async anonymizeUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const anonymizedUsername = `DeletedUser-${user.id.slice(0, 8)}`;
    const anonymizedEmail = `deleted-${user.id}@example.invalid`;

    // Nettoyage des données personnelles sur le compte
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: anonymizedUsername,
        email: anonymizedEmail,
        avatarUrl: null,
        passwordHash: null,
        googleId: null,
        playerRef: null
      }
    });

    // Supprimer les sessions actives
    await this.prisma.session.deleteMany({ where: { userId } });

    // Supprimer les refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    // Supprimer les codes 2FA
    await this.prisma.twoFactor.deleteMany({ where: { userId } });

    // Supprimer les relations d'amis
    await this.prisma.friend.deleteMany({
      where: { OR: [{ userId }, { friendId: userId }] }
    });

    // Les matches, tournois, etc. restent pour l'historique,
    // mais ne contiennent plus de données personnelles sur l'utilisateur.
  }

  /**
   * Supprime toutes les données d'un utilisateur et son compte
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    // Supprimer toutes les relations amicales
    await this.prisma.friend.deleteMany({
      where: { OR: [{ userId }, { friendId: userId }] }
    });

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

  async getPublicProfileByUsername(username: string): Promise<PublicUserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) throw new NotFoundError('User not found');

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString()
    };
  }


async updateUsername(userId: string, newUsername: string) {
  if (newUsername.length < 3 || newUsername.length > 20) {
    throw new ValidationError('Username must be between 3 and 20 characters');
  }

  // Vérifier que l’username n’est pas déjà pris
  const exists = await this.prisma.user.findFirst({
    where: { username: newUsername, id: { not: userId } },
    select: { id: true }
  });

  if (exists) {
    throw new ConflictError('Username already in use');
  }

  const updated = await this.prisma.user.update({
    where: { id: userId },
    data: { username: newUsername }
  });

  return formatUser(updated);
}

  // Récupère les infos étendues pour le profil
  async getFullProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          avatarUrl: true,
          lastSeen: true,
          friends: {
            where: { status: 'accepted' },
            select: {
              userId: true,
              friendId: true
            }
          },
          friendOf: {
            where: { status: 'accepted' },
            select: {
              userId: true,
              friendId: true
            }
          },
          matchesWon: true,
          createdTournaments: {
            select: {
              kingMaxTime: true,
              kingMaxRounds: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // On tape explicitement les tournois pour éviter l'implicit any sur `t`
      type CreatedTournament = { kingMaxTime: number | null; kingMaxRounds: number | null };

      const tournaments: CreatedTournament[] =
        (user.createdTournaments ?? []) as CreatedTournament[];

      const kingMaxTime = tournaments.length
        ? Math.max(...tournaments.map((t: CreatedTournament) => t.kingMaxTime ?? 0)) ||
          undefined
        : undefined;

      const kingMaxRounds = tournaments.length
        ? Math.max(...tournaments.map((t: CreatedTournament) => t.kingMaxRounds ?? 0)) ||
          undefined
        : undefined;

      // ✅ Compter les amis uniques (pour éviter le doublon friend / friendOf)
      const friendIds = new Set<string>();

      for (const f of user.friends ?? []) {
        if (f.userId && f.userId !== user.id) friendIds.add(f.userId);
        if (f.friendId && f.friendId !== user.id) friendIds.add(f.friendId);
      }

      for (const f of user.friendOf ?? []) {
        if (f.userId && f.userId !== user.id) friendIds.add(f.userId);
        if (f.friendId && f.friendId !== user.id) friendIds.add(f.friendId);
      }

      const friendsCount = friendIds.size;
      const matchesWonCount = user.matchesWon?.length || 0;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl,
        kingMaxTime,
        kingMaxRounds,
        friendsCount,
        matchesWonCount,
        lastSeen: user.lastSeen ?? null
      };
    } catch (err) {
      console.error('getFullProfile error:', err);
      throw err;
    }
  }
}
