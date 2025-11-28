import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../shared/database/prisma.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors/index.js';

const ONLINE_THRESHOLD_MS = 30_000; // 30 secondes

export class FriendsService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
  }

  /**
   * Envoie une demande d'ami à partir d'un username.
   */
  async sendFriendRequest(userId: string, username: string) {
    if (!username.trim()) {
      throw new ValidationError('Username is required');
    }

    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!target) {
      throw new NotFoundError('User not found');
    }

    if (target.id === userId) {
      throw new ConflictError('You cannot send a friend request to yourself');
    }

    const existing = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId: target.id,
        },
      },
    });

    if (existing) {
      if (existing.status === 'pending') {
        throw new ConflictError('Friend request already sent');
      }
      if (existing.status === 'accepted') {
        throw new ConflictError('You are already friends');
      }
    }

    const inverse = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: target.id,
          friendId: userId,
        },
      },
    });

    if (inverse) {
      if (inverse.status === 'pending') {
        throw new ConflictError('This user already sent you a friend request');
      }
      if (inverse.status === 'accepted') {
        throw new ConflictError('You are already friends');
      }
    }

    const friendRequest = await this.prisma.friend.create({
      data: {
        userId,
        friendId: target.id,
        status: 'pending',
      },
    });

    return {
      id: target.id,
      username: target.username,
      status: friendRequest.status,
    };
  }

  /**
   * Accepte ou rejette une demande d'ami.
   */
  async handleRequest(
    userId: string,
    friendId: string,
    action: 'accept' | 'reject',
  ) {
    const request = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: friendId,
          friendId: userId,
        },
      },
    });

    if (!request || request.status !== 'pending') {
      throw new NotFoundError('Friend request not found');
    }

    if (action === 'reject') {
      await this.prisma.friend.delete({
        where: {
          userId_friendId: {
            userId: friendId,
            friendId: userId,
          },
        },
      });
      return { status: 'rejected' as const };
    }

    // accept
    await this.prisma.friend.update({
      where: {
        userId_friendId: {
          userId: friendId,
          friendId: userId,
        },
      },
      data: {
        status: 'accepted',
      },
    });

    await this.prisma.friend.create({
      data: {
        userId,
        friendId,
        status: 'accepted',
      },
    });

    return { status: 'accepted' as const };
  }

  /**
   * Liste des amis (avec online status).
   */
async getFriends(userId: string) {
  const now = Date.now();

  const relations = await this.prisma.friend.findMany({
    where: {
      status: 'accepted',
      OR: [
        { userId },
        { friendId: userId },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          lastSeen: true,
        },
      },
      friend: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          lastSeen: true,
        },
      },
    },
  });

  const seen = new Set<string>();
  const result: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    online: boolean;
  }[] = [];

  for (const rel of relations) {
    // si je suis userId, l'ami est friend ; sinon l'ami est user
    const friendUser = rel.userId === userId ? rel.friend : rel.user;

    if (!friendUser) continue;
    if (seen.has(friendUser.id)) continue; // 👈 évite les doublons

    seen.add(friendUser.id);

    const lastSeen = friendUser.lastSeen
      ? friendUser.lastSeen.getTime()
      : 0;
    const online = now - lastSeen < ONLINE_THRESHOLD_MS;

    result.push({
      id: friendUser.id,
      username: friendUser.username,
      avatarUrl: friendUser.avatarUrl,
      online,
    });
  }

  return result;
}


  /**
   * Supprime une relation d'amitié (dans les deux sens).
   */
  async removeFriend(userId: string, friendId: string) {
    await this.prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });
  }

  /**
   * Retourne les demandes d'amis reçues (pending).
   */
  async getRequests(userId: string) {
    const now = Date.now();

    const requests = await this.prisma.friend.findMany({
      where: {
        friendId: userId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            lastSeen: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => {
      const requester = req.user;
      const lastSeen = requester.lastSeen
        ? requester.lastSeen.getTime()
        : 0;
      const online = now - lastSeen < ONLINE_THRESHOLD_MS;

      return {
        id: requester.id,
        username: requester.username,
        avatarUrl: requester.avatarUrl,
        online,
        createdAt: req.createdAt,
      };
    });
  }
}
