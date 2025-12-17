import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../shared/database/prisma.js';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserProfile,
  PublicUserProfile,
  UpdateUserData,
  PlayerStatsResponse,
  PlayerMatchHistoryResponse,
  PlayerMatchItem,
  DailyMatchStats
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

  // ---- Yoann : Fonction pour renvoyer un tableau de stats de matchs sur les 7 last days ----
  async getDailyMatchStats(userId: string): Promise<DailyMatchStats[]> {
	const start = new Date();
	start.setDate(start.getDate() - 6);
	start.setHours(0, 0, 0, 0);
	
	// now = Moment présent / start = 7 jours pile en arrière

	const matches = await this.prisma.match.findMany({
		where: { 
			OR: [
				{ p1UserId: userId }, // Soit le joueur est p1
				{ p2UserId: userId }, // Soit le joueur est p2
			],
			status: "CLOSED", // Seulement les matchs terminés
			closedAt: { gte: start}, // seulement les matchs depuis la date "start"
		}
	});
	// matches contient tout les objet match de la db depuis les 7 derniers jours.
	// Et on a besoin de les regrouper par jour, donc on utilise statsByDate
	const statsByDate: Record<string, { totalMatches: number; wins: number }> = {};
	
	for(const match of matches) // Pour chaque objet match de matches
	{
		const matchDate = match.closedAt ?? match.createdAt;
		const key = matchDate.toISOString().slice(0, 10); // On met la date au bon format
		if(!statsByDate[key]) // Si il n'y a aucun match a la date key
			statsByDate[key] = { totalMatches: 0, wins: 0};
		statsByDate[key].totalMatches += 1;
		if(match.winnerUserId === userId){
			statsByDate[key].wins += 1;
		}
	}
	const result: DailyMatchStats[] = [];
	for(let i = 0; i < 7; i++)
	{
		const day = new Date(start);
		day.setDate(start.getDate() + i);
		const key = day.toISOString().slice(0, 10);
		const dayStats = statsByDate[key] ?? { totalMatches: 0, wins: 0};
		// ?? Signfie si la valeur de gauche est null, alors on attribue la valeur de droite.
		result.push({
			date: key,
			totalMatches: dayStats.totalMatches,
			wins: dayStats.wins,
		});
	}
	return result;
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
      if (data.username.length < 3 || data.username.length > 10) {
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

  // 

async setTwoFactorEnabled(userId: string, enabled: boolean) {
  if (enabled === false) {
    await this.prisma.twoFactor.deleteMany({ where: { userId } });
  }

  const updated = await this.prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: enabled },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      twoFactorEnabled: true,
      updatedAt: true,
    },
  });

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    avatarUrl: updated.avatarUrl,
    twoFactorEnabled: updated.twoFactorEnabled,
    updatedAt: updated.updatedAt.toISOString(),
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
  if (newUsername.length < 3 || newUsername.length > 10) {
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
          twoFactorEnabled: true,
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

      // Compter les amis uniques (pour éviter le doublon friend / friendOf)
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
		twoFactorEnabled: user.twoFactorEnabled,
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

  async existsById(userId: string): Promise<boolean> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return !!user;
}

  /**
   * Get blockchain stats from user's last tournament
   */
  async getLastTournamentBlockchainStats(userId: string) {
    console.log('🔍 Searching blockchain tournaments for user:', userId);
    
    // Find user's last closed tournament with blockchain data
    // Check both participants relation AND matches where user played
    const tournament = await this.prisma.tournament.findFirst({
      where: {
        OR: [
          {
            participants: {
              some: { id: userId }
            }
          },
          {
            matches: {
              some: {
                OR: [
                  { p1UserId: userId },
                  { p2UserId: userId }
                ]
              }
            }
          }
        ],
        status: 'CLOSED',
        txHash: { not: null }
      },
      orderBy: { onchainAt: 'desc' },
      select: {
        id: true,
        name: true,
        txHash: true,
        blockNumber: true,
        onchainAt: true
      }
    });

    if (!tournament) {
      console.log('❌ No tournament found for user');
      throw new NotFoundError('No tournament with blockchain data found for this user');
    }
    
    console.log('✅ Found tournament:', tournament.name);

    // Import blockchain service dynamically to avoid circular dependencies
    const { BlockchainService } = await import('../blockchain/blockchain.service.js');
    const blockchainService = new BlockchainService();

    // Get tournament ID as number for blockchain
    const tournamentId = parseInt(tournament.id.replace(/\D/g, '').slice(0, 10));
    
    // Retrieve data from blockchain
    const blockchainData = await blockchainService.getTournament(tournamentId);

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        txHash: tournament.txHash,
        blockNumber: tournament.blockNumber,
        onchainAt: tournament.onchainAt,
        explorerUrl: blockchainService.getExplorerUrl(tournament.txHash!)
      },
      blockchainData: {
        id: blockchainData.id,
        winner: blockchainData.winner,
        players: blockchainData.players,
        timestamp: new Date(blockchainData.timestamp * 1000).toISOString(),
        matches: blockchainData.matches.map(m => ({
          matchId: m.matchId,
          player1: m.player1,
          player2: m.player2,
          scorePlayer1: m.scorePlayer1,
          scorePlayer2: m.scorePlayer2,
          winner: m.winner,
          timestamp: new Date(m.timestamp * 1000).toISOString()
        }))
      }
    };
  }

  // ==========================================
  // READ - Récupérer les stats globales d'un joueur
  // ==========================================
  
  async getPlayerStats(userId: string): Promise<PlayerStatsResponse> {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatarUrl: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Récupérer tous les matchs du joueur
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          { p1UserId: userId },
          { p2UserId: userId }
        ],
        status: 'CLOSED'  // Seulement les matchs terminés
      },
      include: {
        tournament: { select: { id: true } },
        playerStats: {
          where: { userId },
          select: {
            maxBouncesInWonRally: true,
            maxBallSpeedWon: true,
            maxBallSpeedLost: true,
            totalBallSpins: true,
            fastestWonRally: true
          }
        }
      },
      orderBy: { closedAt: 'desc' }
    });

    // Calculer les stats
    let totalWins = 0;
    let totalLosses = 0;
    let tempStreak = 0;
    let maxStreak = 0;
    const tournamentsPlayed = new Set<string>();
    const tournamentsWon = new Set<string>();
    let maxBounces = 0;
    let maxSpeed = 0;
    let totalSpins = 0;
    let fastestWin = Infinity;
    let totalDuration = 0;
    let totalScore = 0;
    let totalBounces = 0;
    let totalRallies = 0;

    for (const match of matches) {
      const isP1 = match.p1UserId === userId;
      const playerScore = isP1 ? match.p1Score : match.p2Score;
      const isWinner = match.winnerUserId === userId;

      // Victoires/Défaites
      if (isWinner) {
        totalWins++;
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        totalLosses++;
        tempStreak = 0;
      }

      // Tournois
      if (match.tournamentId) {
        tournamentsPlayed.add(match.tournamentId);
        
        // Vérifier si c'était la finale et si le joueur a gagné
        const isFinal = match.round === 0; // Round 0 = finale
        if (isFinal && isWinner) {
          tournamentsWon.add(match.tournamentId);
        }
      }

      // Records personnels
      const playerStats = match.playerStats[0];
      if (playerStats) {
        if (playerStats.maxBouncesInWonRally > maxBounces) {
          maxBounces = playerStats.maxBouncesInWonRally;
        }
        
        const maxSpeedInMatch = Math.max(
          playerStats.maxBallSpeedWon,
          playerStats.maxBallSpeedLost
        );
        if (maxSpeedInMatch > maxSpeed) {
          maxSpeed = maxSpeedInMatch;
        }
        
        totalSpins += playerStats.totalBallSpins;
        
        if (isWinner && playerStats.fastestWonRally < fastestWin) {
          fastestWin = playerStats.fastestWonRally;
        }
      }

      // Durée et stats moyennes
      if (match.totalMatchTime) {
        totalDuration += match.totalMatchTime;
      }
      if (playerScore) {
        totalScore += playerScore;
      }
      if (match.avgRallyBounces) {
        totalBounces += match.avgRallyBounces;
      }
      if (match.totalRallies) {
        totalRallies += match.totalRallies;
      }
    }

    // Série actuelle (les matchs sont triés du plus récent au plus ancien)
    const currentStreak = tempStreak;

    const totalMatches = matches.length;
    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
    const avgMatchDuration = totalMatches > 0 ? totalDuration / totalMatches : 0;
    const avgScorePerMatch = totalMatches > 0 ? totalScore / totalMatches : 0;
    const avgBouncesPerRally = totalRallies > 0 ? totalBounces / totalRallies : 0;

    return {
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      
      totalMatches,
      totalWins,
      totalLosses,
      winRate: Math.round(winRate * 100) / 100,
      
      tournamentsPlayed: tournamentsPlayed.size,
      tournamentsWon: tournamentsWon.size,
      
      longestWinStreak: maxStreak,
      currentWinStreak: currentStreak,
      
      maxBouncesInMatch: maxBounces,
      maxBallSpeedEver: maxSpeed,
      totalBallSpins: totalSpins,
      
      fastestWinEver: fastestWin === Infinity ? 0 : fastestWin,
      avgMatchDuration: Math.round(avgMatchDuration * 100) / 100,
      
      avgScorePerMatch: Math.round(avgScorePerMatch * 100) / 100,
      avgBouncesPerRally: Math.round(avgBouncesPerRally * 100) / 100
    };
  }

  // ==========================================
  // READ - Récupérer l'historique de matchs d'un joueur
  // ==========================================
  async getPlayerMatchHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PlayerMatchHistoryResponse> {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Récupérer les matchs avec pagination
    const [matches, totalCount] = await Promise.all([
      this.prisma.match.findMany({
        where: {
          OR: [
            { p1UserId: userId },
            { p2UserId: userId }
          ],
          status: 'CLOSED'
        },
        include: {
          p1: { select: { id: true, username: true, avatarUrl: true } },
          p2: { select: { id: true, username: true, avatarUrl: true } },
          tournament: { select: { id: true, name: true } },
          playerStats: {
            where: { userId },
            select: {
              maxBouncesInWonRally: true,
              maxBallSpeedWon: true,
              maxBallSpeedLost: true,
              totalBallSpins: true
            }
          }
        },
        orderBy: { closedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      
      this.prisma.match.count({
        where: {
          OR: [
            { p1UserId: userId },
            { p2UserId: userId }
          ],
          status: 'CLOSED'
        }
      })
    ]);

    const matchHistory: PlayerMatchItem[] = matches.map(match => {
      const wasP1 = match.p1UserId === userId;
      const playerScore = wasP1 ? match.p1Score : match.p2Score;
      const isWinner = match.winnerUserId === userId;
      const playerStats = match.playerStats[0];

      return {
        id: match.id,
        createdAt: match.createdAt,
        closedAt: match.closedAt,
        
        // Infos du joueur
        playerScore: playerScore || 0,
        isWinner,
        wasP1,
        
        // Infos P1
        p1UserId: match.p1UserId,
        p1Username: match.p1?.username || 'Guest',
        p1AvatarUrl: match.p1?.avatarUrl || null,
        p1Score: match.p1Score || 0,
        
        // Infos P2
        p2UserId: match.p2UserId,
        p2Username: match.p2?.username || 'Guest',
        p2AvatarUrl: match.p2?.avatarUrl || null,
        p2Score: match.p2Score || 0,
        
        // Stats du match
        duration: match.totalMatchTime || 0,
        longestRally: playerStats?.maxBouncesInWonRally || 0,
        maxBallSpeed: Math.max(
          playerStats?.maxBallSpeedWon || 0,
          playerStats?.maxBallSpeedLost || 0
        ),
        effectsUsed: playerStats?.totalBallSpins || 0,
        
        // Tournoi
        tournamentId: match.tournamentId,
        tournamentName: match.tournament?.name || null,
        round: match.round
      };
    });

    return {
      userId: user.id,
      username: user.username,
      totalMatches: totalCount,
      matches: matchHistory
    };
  }

}
