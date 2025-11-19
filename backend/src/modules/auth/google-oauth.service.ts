import type { PrismaClient } from "@prisma/client";

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export class GoogleOAuthService {
  constructor(private prisma: PrismaClient) {}

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch Google user info: ${res.status} ${text}`);
    }

    const data = (await res.json()) as GoogleUserInfo;
    return data;
  }

  async findOrCreateUser(googleUser: GoogleUserInfo) {
    // 1. Essayer par googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.sub }
    });

    if (user) return user;

    // 2. Essayer par email
    user = await this.prisma.user.findUnique({
      where: { email: googleUser.email }
    });

    if (user) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.sub,
          avatarUrl: googleUser.picture ?? user.avatarUrl
        }
      });
    }

    // 3. Créer un nouvel utilisateur
    let baseUsername =
      googleUser.name?.replace(/\s+/g, "_") ||
      googleUser.email.split("@")[0];

    // Nettoyer les caractères
    baseUsername = baseUsername.replace(/[^a-zA-Z0-9_-]/g, "");
    if (baseUsername.length < 3) {
      baseUsername = "user_" + Math.floor(Math.random() * 10000);
    }

    let username = baseUsername;
    let suffix = 1;
    while (true) {
      const existing = await this.prisma.user.findUnique({
        where: { username }
      });
      if (!existing) break;
      username = `${baseUsername}_${suffix++}`;
    }

    user = await this.prisma.user.create({
      data: {
        email: googleUser.email,
        username,
        googleId: googleUser.sub,
        avatarUrl: googleUser.picture
      }
    });

    return user;
  }
}
