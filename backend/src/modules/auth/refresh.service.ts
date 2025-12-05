import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateToken } from '../../shared/utils/jwt.js';

export interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
}

export class RefreshService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Crée un refresh token pour un utilisateur donné
   */
async createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');
  await this.prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return token;
}


  /**
   * Renouvelle un refresh token existant et retourne le nouvel access token + refresh token
   */
  async rotateRefreshToken(refreshToken: string): Promise<RotatedTokens> {
    // Vérifie que le token existe
    const tokenEntry = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!tokenEntry) throw new Error('Invalid refresh token');

    // Supprime l’ancien token
    await this.prisma.refreshToken.delete({ where: { id: tokenEntry.id } });

    // Récupère l’utilisateur pour générer l’access token
    const user = await this.prisma.user.findUnique({
      where: { id: tokenEntry.userId },
    });
    if (!user) throw new Error('User not found');

    const accessToken = generateToken({ userId: user.id, email: user.email });
    const newRefreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Supprime tous les refresh tokens d’un utilisateur
   */
  async revokeRefreshToken(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
