import { getPrismaClient } from '../../shared/database/prisma.js';
import type { CreateSnakeMatchDTO, SnakeMatchResponse } from './snake.model.js';

const prisma = getPrismaClient();

export class SnakeService {
  // ==========================================
  // CREATE - Créer un nouveau match Snake
  // ==========================================
  async create(data: CreateSnakeMatchDTO): Promise<SnakeMatchResponse> {
    // Récupérer les utilisateurs (seulement les non-guests)
    const usernamesToLookup: string[] = [];
    if (!data.p1IsGuest) usernamesToLookup.push(data.p1Username);
    if (!data.p2IsGuest) usernamesToLookup.push(data.p2Username);

    console.log('[SnakeService] Usernames to lookup:', usernamesToLookup);

    const users = usernamesToLookup.length > 0
      ? await prisma.user.findMany({
          where: { username: { in: usernamesToLookup } },
          select: { id: true, username: true }
        })
      : [];

    const p1User = !data.p1IsGuest 
      ? users.find(u => u.username === data.p1Username)
      : undefined;

    const p2User = !data.p2IsGuest 
      ? users.find(u => u.username === data.p2Username)
      : undefined;

    // Validation
    if (!data.p1IsGuest && !p1User) {
      throw new Error(`Player 1 '${data.p1Username}' not found`);
    }
    if (!data.p2IsGuest && !p2User) {
      throw new Error(`Player 2 '${data.p2Username}' not found`);
    }

    // Si les deux sont guests, ne pas enregistrer
    if (data.p1IsGuest && data.p2IsGuest) {
      throw new Error('Cannot create match with both players as guests');
    }

    // Déterminer le gagnant
    let winnerUserId: string | null = null;
    if (data.p1Score > data.p2Score && p1User) {
      winnerUserId = p1User.id;
    } else if (data.p2Score > data.p1Score && p2User) {
      winnerUserId = p2User.id;
    }

    // Créer le match
    const match = await prisma.snakeMatch.create({
      data: {
        gameCode: 'snake',
        p1UserId: p1User?.id || null,
        p1Score: data.p1Score,
        p1Collectibles: data.p1Collectibles,
        p2UserId: p2User?.id || null,
        p2Score: data.p2Score,
        p2Collectibles: data.p2Collectibles,
        winnerUserId,
      },
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    console.log(`[SnakeService] Match ${match.id} created`);
    console.log(`  P1: ${data.p1Username} (${data.p1IsGuest ? 'Guest' : 'User'})`);
    console.log(`  P2: ${data.p2Username} (${data.p2IsGuest ? 'Guest' : 'User'})`);
    console.log(`  Score: ${data.p1Score} - ${data.p2Score}`);
    console.log(`  Collectibles: ${data.p1Collectibles} - ${data.p2Collectibles}`);
    console.log(`  Winner: ${winnerUserId || 'None'}`);

    return match;
  }

  // ==========================================
  // READ - Récupérer un match par ID
  // ==========================================
  async findById(id: string): Promise<SnakeMatchResponse | null> {
    return await prisma.snakeMatch.findUnique({
      where: { id },
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // ==========================================
  // READ - Récupérer tous les matchs Snake
  // ==========================================
  async findAll(): Promise<SnakeMatchResponse[]> {
    return await prisma.snakeMatch.findMany({
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==========================================
  // READ - Récupérer les matchs d'un joueur
  // ==========================================
  async findByPlayer(userId: string): Promise<SnakeMatchResponse[]> {
    return await prisma.snakeMatch.findMany({
      where: {
        OR: [
          { p1UserId: userId },
          { p2UserId: userId },
        ],
      },
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==========================================
  // DASHBOARD - Get recent Snake matches for user
  // ==========================================
  async getRecentSnakeMatchesForUser(userId: string): Promise<{
    p1Username: string;
    p2Username: string;
    winnerUsername: string;
    p1Score: number;
    p2Score: number;
    p1Collectibles: number;
    p2Collectibles: number;
    playedAt: string;
  }[]> {
    console.log('[SnakeService.getRecentSnakeMatchesForUser] Fetching matches for userId:', userId);
    
    const matches = await prisma.snakeMatch.findMany({
      where: {
        OR: [
          { p1UserId: userId },
          { p2UserId: userId },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
      select: {
        createdAt: true,
        p1Score: true,
        p2Score: true,
        p1Collectibles: true,
        p2Collectibles: true,
        p1: { select: { username: true } },
        p2: { select: { username: true } },
        winner: { select: { username: true } },
      },
    });

    console.log('[SnakeService.getRecentSnakeMatchesForUser] Found', matches.length, 'matches');
    console.log('[SnakeService.getRecentSnakeMatchesForUser] Raw matches from DB:', JSON.stringify(matches, null, 2));

    const formattedMatches = matches.map((m) => ({
      p1Username: m.p1?.username ?? 'Guest',
      p2Username: m.p2?.username ?? 'Guest',
      winnerUsername: m.winner?.username ?? 'Unknown',
      p1Score: m.p1Score,
      p2Score: m.p2Score,
      p1Collectibles: m.p1Collectibles,
      p2Collectibles: m.p2Collectibles,
      playedAt: m.createdAt.toISOString(),
    }));

    console.log('[SnakeService.getRecentSnakeMatchesForUser] Formatted matches:', JSON.stringify(formattedMatches, null, 2));

    return formattedMatches;
  }
}
