import { getPrismaClient } from '../../shared/database/prisma.js';

export class FriendsService {
  private prisma = getPrismaClient();

  async sendFriendRequest(userId: string, friendId: string) {
    return this.prisma.friend.create({
      data: {
        userId,
        friendId,
        status: 'pending',
      },
    });
  }

  async getFriends(userId: string) {
    return this.prisma.friend.findMany({
      where: { userId, status: 'accepted' },
      include: { friend: true }, // récupère les infos de l'ami
    });
  }

  async handleRequest(userId: string, friendId: string, action: 'accept' | 'reject') {
    if (action === 'accept') {
      return this.prisma.friend.update({
        where: { userId_friendId: { userId, friendId } },
        data: { status: 'accepted' },
      });
    } else {
      return this.prisma.friend.delete({
        where: { userId_friendId: { userId, friendId } },
      });
    }
  }

  async removeFriend(userId: string, friendId: string) {
    return this.prisma.friend.delete({
      where: { userId_friendId: { userId, friendId } },
    });
  }
}
