// src/friends/friends.service.ts
import { getPrismaClient } from '../../shared/database/prisma.js';
import type { User as PrismaUser} from '@prisma/client';

export class FriendsService {
  private prisma = getPrismaClient();

  // Envoyer une demande d'ami
  async sendFriendRequest(userId: string, friendUsername: string) {
    const friend = await this.prisma.user.findUnique({ where: { username: friendUsername } });
    if (!friend) throw new Error("Utilisateur introuvable");
    if (userId === friend.id) throw new Error("Impossible de s'ajouter soi-même");

    const existing = await this.prisma.friend.findUnique({
      where: { userId_friendId: { userId, friendId: friend.id } },
    });
    if (existing) throw new Error("La demande existe déjà.");

    return this.prisma.friend.create({
      data: {
        userId,
        friendId: friend.id,
        status: 'pending',
      },
    });
  }

  // Accepter ou refuser une demande
  async handleRequest(userId: string, friendId: string, action: 'accept' | 'reject') {
    if (action === 'accept') {
      // Mise à jour de la demande reçue
      await this.prisma.friend.update({
        where: { userId_friendId: { userId: friendId, friendId: userId } },
        data: { status: 'accepted' },
      });

      // Création de la relation réciproque
      return this.prisma.friend.create({
        data: {
          userId,
          friendId,
          status: 'accepted',
        },
      });
    }

    // Rejet
    return this.prisma.friend.delete({
      where: { userId_friendId: { userId: friendId, friendId: userId } },
    });
  }

  // Récupérer les amis (TypeScript infère le type User)
  async getFriends(userId: string): Promise<PrismaUser[]> {
    const rows = await this.prisma.friend.findMany({
      where: { userId, status: 'accepted' },
      include: { friend: true },
    });

    return rows.map((r: { friend: PrismaUser }) => r.friend);
  }



  // Récupérer les demandes reçues
  async getRequests(userId: string) {
    return this.prisma.friend.findMany({
      where: { friendId: userId, status: 'pending' },
      include: { user: true },
    });
  }

  // Supprimer un ami dans les deux sens
  async removeFriend(userId: string, friendId: string) {
    await this.prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ],
      },
    });

    return { success: true };
  }
}
