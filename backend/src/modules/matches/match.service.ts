import { getPrismaClient } from '../../shared/database/prisma.js';
import type { MatchStatus } from '@prisma/client';
import type { 
  CreateMatchDTO, 
  UpdateMatchDTO, 
  MatchResponse, 
  // PlayedMatchResponse,
  PlayedMatchDTO,
  MatchStatsDTO,
  PlayerStatsDTO,
  RecentRallyStat
} from './match.model.js';

const prisma = getPrismaClient();

export class MatchService {
  // ==========================================
  // CREATE - Créer un nouveau match (tournoi)
  // ==========================================
  async create(data: CreateMatchDTO): Promise<MatchResponse> {
    // Validation : vérifier que les joueurs existent
    if (data.p1UserId) {
      const p1Exists = await prisma.user.findUnique({ where: { id: data.p1UserId } });
      if (!p1Exists) {
        throw new Error(`Player 1 with id ${data.p1UserId} not found`);
      }
    }

    if (data.p2UserId) {
      const p2Exists = await prisma.user.findUnique({ where: { id: data.p2UserId } });
      if (!p2Exists) {
        throw new Error(`Player 2 with id ${data.p2UserId} not found`);
      }
    }

    // Validation : si tournamentId, vérifier qu'il existe
    if (data.tournamentId) {
      const tournamentExists = await prisma.tournament.findUnique({
        where: { id: data.tournamentId },
      });
      if (!tournamentExists) {
        throw new Error(`Tournament with id ${data.tournamentId} not found`);
      }
    }

    // Construire l'objet data sans undefined
    const createData: any = {
      status: 'SCHEDULED' as MatchStatus,
    };

    if (data.tournamentId) createData.tournamentId = data.tournamentId;
    if (data.round !== undefined) createData.round = data.round;
    if (data.gameIndex !== undefined) createData.gameIndex = data.gameIndex;
    if (data.p1UserId) createData.p1UserId = data.p1UserId;
    if (data.p2UserId) createData.p2UserId = data.p2UserId;
    if (data.txHash) createData.txHash = data.txHash;

    return await prisma.match.create({
      data: createData,
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
      },
    });
  }

  // ==========================================
  // CREATE - Créer un match hors tournoi avec stats complètes
  // ==========================================
  async createMatchWithStats(data: PlayedMatchDTO): Promise<MatchResponse> {
    
    // Récupérer les utilisateurs (seulement les non-guests)
    const usernamesToLookup: string[] = [];
    if (!data.p1IsGuest) usernamesToLookup.push(data.p1Username);
    if (!data.p2IsGuest) usernamesToLookup.push(data.p2Username);

    console.log("Usernames to lookup :", usernamesToLookup);

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

    // Déterminer le gagnant
    const p1Score = data.matchStats.p1Score;
    const p2Score = data.matchStats.p2Score;
    let winnerUserId: string | null = null;

    if (p1Score > p2Score && p1User) {
      winnerUserId = p1User.id;
    } else if (p2Score > p1Score && p2User) {
      winnerUserId = p2User.id;
    }

    // Transaction : créer le match + stats
    return await prisma.$transaction(async (tx) => {
      
      // Créer le match avec stats globales
      const createdMatch = await tx.match.create({
        data: {
          gameCode: 'pong',
          status: 'CLOSED' as MatchStatus,
          
          // Joueurs (null si guest)
          p1UserId: p1User?.id || null,
          p2UserId: p2User?.id || null,
          winnerUserId,
          
          // Scores
          p1Score: data.matchStats.p1Score,
          p2Score: data.matchStats.p2Score,
          
          // Stats globales
          totalPoints: data.matchStats.totalPoints,
          totalRallies: data.matchStats.totalRallies,
          maxBounces: data.matchStats.maxBounces,
          avgRallyBounces: data.matchStats.avgRallyBounces,
          totalMatchTime: data.matchStats.totalMatchTime,
          avgRallyTime: data.matchStats.avgRallyTime,
          
          closedAt: new Date()
        },
        include: {
          p1: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              playerRef: true
            }
          },
          p2: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              playerRef: true
            }
          },
          winner: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      });

      // Créer les stats individuelles (seulement pour les non-guests)
      const playerStatsData = [];

      if (p1User) {
        playerStatsData.push({
          matchId: createdMatch.id,
          userId: p1User.id,
          score: data.p1Stats.score,
          maxWins: data.p1Stats.maxWins,
          totalBallSpins: data.p1Stats.totalBallSpins,
          maxBouncesInWonRally: data.p1Stats.maxBouncesInWonRally,
          maxEffectsInWonRally: data.p1Stats.maxEffectsInWonRally,
          maxBallSpeedWon: data.p1Stats.maxBallSpeedWon,
          maxBallSpeedLost: data.p1Stats.maxBallSpeedLost,
          fastestWonRally: data.p1Stats.fastestWonRally,
          fastestLostRally: data.p1Stats.fastestLostRally
        });
      }

      if (p2User) {
        playerStatsData.push({
          matchId: createdMatch.id,
          userId: p2User.id,
          score: data.p2Stats.score,
          maxWins: data.p2Stats.maxWins,
          totalBallSpins: data.p2Stats.totalBallSpins,
          maxBouncesInWonRally: data.p2Stats.maxBouncesInWonRally,
          maxEffectsInWonRally: data.p2Stats.maxEffectsInWonRally,
          maxBallSpeedWon: data.p2Stats.maxBallSpeedWon,
          maxBallSpeedLost: data.p2Stats.maxBallSpeedLost,
          fastestWonRally: data.p2Stats.fastestWonRally,
          fastestLostRally: data.p2Stats.fastestLostRally
        });
      }

      if (playerStatsData.length > 0) {
        await tx.playerMatchStats.createMany({
          data: playerStatsData
        });
      }

      console.log(`[createMatchWithStats] Match ${createdMatch.id} created with stats`);
      console.log(`  P1: ${data.p1Username} (${data.p1IsGuest ? 'Guest' : 'User'})`);
      console.log(`  P2: ${data.p2Username} (${data.p2IsGuest ? 'Guest' : 'User'})`);
      console.log(`  Score: ${data.matchStats.p1Score} - ${data.matchStats.p2Score}`);
      console.log(`  Winner: ${winnerUserId || 'None'}`);

      return createdMatch;
    });
  }

  // ==========================================
  // UPDATE - Terminer un match de tournoi avec stats
  // ==========================================
  async finishMatchWithStats(
    matchId: string,
    matchStats: MatchStatsDTO,
    p1Stats: PlayerStatsDTO,
    p2Stats: PlayerStatsDTO
  ): Promise<MatchResponse> {
    console.log("dataaas :", matchId);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        status: true,
        p1UserId: true,
        p2UserId: true,
        tournamentId: true,
        round: true,
        gameIndex: true,
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'SCHEDULED') {
      throw new Error(`error: Match status for uploading stats is ${match.status}`);
    }

    let winnerUserId: string | null = p1Stats.userId ?? null;

    if (p1Stats.score < p2Stats.score) {
      winnerUserId = p2Stats.userId ?? null;
    }

    // Fallback / sécurité : si pas de userId dans les stats, on peut se rabattre sur le match lui-même
    if (!winnerUserId) {
      if (match.p1UserId && match.p2UserId) {
        winnerUserId = p1Stats.score > p2Stats.score ? match.p1UserId : match.p2UserId;
      } else {
        throw new Error('Winner user id cannot be determined');
      }
    }

    return await prisma.$transaction(async (tx) => {
      
      //  Mettre à jour le match avec stats globales
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'CLOSED' as MatchStatus,
          winnerUserId,
          p1Score: matchStats.p1Score,
          p2Score: matchStats.p2Score,
          closedAt: new Date(),
          
          // Stats globales
          totalPoints: matchStats.totalPoints,
          totalRallies: matchStats.totalRallies,
          maxBounces: matchStats.maxBounces,
          avgRallyBounces: matchStats.avgRallyBounces,
          totalMatchTime: matchStats.totalMatchTime,
          avgRallyTime: matchStats.avgRallyTime
        },
        include: {
          p1: { 
            select: { 
              id: true, 
              username: true, 
              avatarUrl: true, 
              playerRef: true 
            } 
          },
          p2: { 
            select: { 
              id: true, 
              username: true, 
              avatarUrl: true, 
              playerRef: true 
            } 
          },
          winner: { 
            select: { 
              id: true, 
              username: true, 
              avatarUrl: true 
            } 
          }
        }
      });

      // Créer les stats individuelles
      await tx.playerMatchStats.createMany({
        data: [
          {
            matchId,
            userId: p1Stats.userId,
            score: p1Stats.score,
            maxWins: p1Stats.maxWins,
            totalBallSpins: p1Stats.totalBallSpins,
            maxBouncesInWonRally: p1Stats.maxBouncesInWonRally,
            maxEffectsInWonRally: p1Stats.maxEffectsInWonRally,
            maxBallSpeedWon: p1Stats.maxBallSpeedWon,
            maxBallSpeedLost: p1Stats.maxBallSpeedLost,
            fastestWonRally: p1Stats.fastestWonRally,
            fastestLostRally: p1Stats.fastestLostRally
          },
          {
            matchId,
            userId: p2Stats.userId,
            score: p2Stats.score,
            maxWins: p2Stats.maxWins,
            totalBallSpins: p2Stats.totalBallSpins,
            maxBouncesInWonRally: p2Stats.maxBouncesInWonRally,
            maxEffectsInWonRally: p2Stats.maxEffectsInWonRally,
            maxBallSpeedWon: p2Stats.maxBallSpeedWon,
            maxBallSpeedLost: p2Stats.maxBallSpeedLost,
            fastestWonRally: p2Stats.fastestWonRally,
            fastestLostRally: p2Stats.fastestLostRally
          }
        ]
      });

      //  Si tournoi, avancer le gagnant
      if (match.tournamentId && match.round !== null && match.gameIndex !== null) {
        await this.advanceWinner(
          tx, 
          match.tournamentId, 
          winnerUserId, 
          match.round, 
          match.gameIndex
        );
      }

      console.log(`[finishMatchWithStats] Match ${matchId} finished`);
      console.log(`  Winner: ${winnerUserId}`);
      console.log(`  Score: ${matchStats.p1Score} - ${matchStats.p2Score}`);

      return updatedMatch;
    });
  }

  // ==========================================
  // READ - Récupérer les détails complets d'un match terminé
  // ==========================================
  // async getPlayedMatchDetails(matchId: string): Promise<PlayedMatchResponse> {
  //   const match = await prisma.match.findUnique({
  //     where: { id: matchId },
  //     include: {
  //       p1: { select: { id: true, username: true, avatarUrl: true } },
  //       p2: { select: { id: true, username: true, avatarUrl: true } },
  //       winner: { select: { id: true } },
  //       playerStats: {
  //         include: {
  //           user: { select: { id: true, username: true, avatarUrl: true } }
  //         }
  //       }
  //     }
  //   });

  //   if (!match) {
  //     throw new Error('Match not found');
  //   }

  //   // Vérifier que le match est terminé
  //   if (match.status !== 'CLOSED') {
  //     throw new Error('Match is not finished yet');
  //   }

  //   // Vérifier que toutes les données obligatoires sont présentes
  //   if (!match.winnerUserId || !match.totalPoints || !match.totalRallies) {
  //     throw new Error('Match is missing required stats');
  //   }

  //   ///// A AJOUTER 
  //   // Retrouver l'id du tournoi par raport a son code 

  //   const p1Stats = match.playerStats.find(s => s.userId === match.p1UserId);
  //   const p2Stats = match.playerStats.find(s => s.userId === match.p2UserId);

  //   if (!p1Stats || !p2Stats) {
  //     throw new Error('Player stats not found');
  //   }

  //   // Déterminer le perdant
  //   const loserId = match.winnerUserId === match.p1UserId ? match.p2UserId! : match.p1UserId!;


  //   return {
  //     // Infos de base
  //     id: match.id,
  //     tournamentId: match.tournamentId,
  //     // gameCode: match.gameCode,
  //     // round: match.round,
  //     // gameIndex: match.gameIndex,
  //     status: match.status,
  //     createdAt: match.createdAt,
  //     closedAt: match.closedAt,

  //     // Joueurs
  //     p1UserId: match.p1UserId,
  //     p1Score: match.p1Score,
  //     p1IsGuest: !match.p1UserId,

  //     p2UserId: match.p2UserId,
  //     p2Score: match.p2Score,
  //     p2IsGuest: !match.p2UserId,

  //     // Stats globales (toutes NON NULL car match CLOSED)
  //     totalPoints: match.totalPoints,
  //     winnerId: match.winnerUserId,
  //     loserId: loserId,
  //     totalRallies: match.totalRallies,
  //     maxBounces: match.maxBounces!,
  //     avgRallyBounces: match.avgRallyBounces!,
  //     totalMatchTime: match.totalMatchTime!,
  //     avgRallyTime: match.avgRallyTime!,

  //     // Stats individuelles P1
  //     p1: {
  //       userId: p1Stats.userId,
  //       username: p1Stats.user.username,
  //       avatarUrl: p1Stats.user.avatarUrl,
  //       score: p1Stats.score,
  //       maxWins: p1Stats.maxWins,
  //       totalBallSpins: p1Stats.totalBallSpins,
  //       maxBouncesInWonRally: p1Stats.maxBouncesInWonRally,
  //       maxEffectsInWonRally: p1Stats.maxEffectsInWonRally,
  //       maxBallSpeedWon: p1Stats.maxBallSpeedWon,
  //       maxBallSpeedLost: p1Stats.maxBallSpeedLost,
  //       fastestWonRally: p1Stats.fastestWonRally,
  //       fastestLostRally: p1Stats.fastestLostRally,
  //       ralliesWon: match.p1Score!,
  //       ralliesLost: match.p2Score!
  //     },

  //     // Stats individuelles P2
  //     p2: {
  //       userId: p2Stats.userId,
  //       username: p2Stats.user.username,
  //       avatarUrl: p2Stats.user.avatarUrl,
  //       score: p2Stats.score,
  //       maxWins: p2Stats.maxWins,
  //       totalBallSpins: p2Stats.totalBallSpins,
  //       maxBouncesInWonRally: p2Stats.maxBouncesInWonRally,
  //       maxEffectsInWonRally: p2Stats.maxEffectsInWonRally,
  //       maxBallSpeedWon: p2Stats.maxBallSpeedWon,
  //       maxBallSpeedLost: p2Stats.maxBallSpeedLost,
  //       fastestWonRally: p2Stats.fastestWonRally,
  //       fastestLostRally: p2Stats.fastestLostRally,
  //       ralliesWon: match.p2Score!,
  //       ralliesLost: match.p1Score!
  //     }
  //   };
  // }

  // ==========================================
  // READ - Récupérer un match par ID
  // ==========================================
  async findById(id: string): Promise<MatchResponse | null> {
    return await prisma.match.findUnique({
      where: { id },
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            code: true,
            name: true,
            mode: true,
          },
        },
      },
    });
  }

  // ==========================================
  // UPDATE - Démarrer un match
  // ==========================================
  async start(id: string): Promise<MatchResponse> {
    const match = await prisma.match.findUnique({ where: { id } });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'SCHEDULED') {
      throw new Error(`Cannot start match with status ${match.status}`);
    }

    return await this.update(id, { status: 'IN_PROGRESS' });
  }

  // ==========================================
  // UPDATE - Mettre à jour un match
  // ==========================================
  async update(id: string, data: UpdateMatchDTO): Promise<MatchResponse> {
    if (data.winnerUserId) {
      const match = await prisma.match.findUnique({
        where: { id },
        select: { p1UserId: true, p2UserId: true },
      });

      if (!match) {
        throw new Error('Match not found');
      }

      if (data.winnerUserId !== match.p1UserId && data.winnerUserId !== match.p2UserId) {
        throw new Error('Winner must be one of the match participants');
      }
    }

    return await prisma.match.update({
      where: { id },
      data: {
        status: data.status as MatchStatus | undefined,
        p1Score: data.p1Score,
        p2Score: data.p2Score,
        winnerUserId: data.winnerUserId,
        onchainAt: data.onchainAt,
        totalPoints: data.totalPoints,
        totalRallies: data.totalRallies,
        maxBounces: data.maxBounces,
        avgRallyBounces: data.avgRallyBounces,
        totalMatchTime: data.totalMatchTime,
        avgRallyTime: data.avgRallyTime,
      },
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            code: true,
            name: true,
            mode: true,
          },
        },
      },
    });
  }

  // ==========================================
  // DELETE - Supprimer un match
  // ==========================================
  async delete(id: string): Promise<void> {
    await prisma.match.delete({
      where: { id },
    });
  }

  // ==========================================
  // ADVANCE WINNER - Avancer le gagnant au round suivant
  // ==========================================
  private async advanceWinner(
    tx: any,
    tournamentId: string,
    winnerId: string,
    currentRound: number,
    currentGameIndex: number,
  ): Promise<void> {
    const nextRound = currentRound + 1;
    const nextGameIndex = Math.floor(currentGameIndex / 2);

    console.log(
      `[advanceWinner] Winner ${winnerId} from Round ${currentRound}, Match ${currentGameIndex}`,
    );
    console.log(
      `[advanceWinner] → Moving to Round ${nextRound}, Match ${nextGameIndex}`,
    );
    
    const nextMatch = await tx.match.findFirst({
      where: {
        tournamentId,
        round: nextRound,
        gameIndex: nextGameIndex,
      },
    });

    if (!nextMatch) {
      console.log(
        `[advanceWinner] 🏆 Tournament ${tournamentId} finished! Winner: ${winnerId}`,
      );

      // await tx.tournament.update({
      //   where: { id: tournamentId },
      //   data: { status: 'CLOSED' as TournamentStatus },
      // });

      return;
    }
    
    const isP1 = currentGameIndex % 2 === 0;
    const slot = isP1 ? 'p1UserId' : 'p2UserId';
    
    console.log(`[advanceWinner] → Assigning winner to ${slot} of next match`);

    await tx.match.update({
      where: { id: nextMatch.id },
      data: {
        [slot]: winnerId,
      },
    });

    console.log(`[advanceWinner] ✅ Winner advanced successfully`);
  }
  
  // ==========================================
  // READ - Récupérer tous les matchs (avec filtre optionnel)
  // ==========================================
  async findAll(status?: MatchStatus): Promise<MatchResponse[]> {
    const where = status ? { status } : {};

    return await prisma.match.findMany({
      where,
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            code: true,
            name: true,
            mode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  
  // ==========================================
  // READ - Récupérer les matchs d'un tournoi
  // ==========================================
  async findByTournament(tournamentId: string): Promise<MatchResponse[]> {
    return await prisma.match.findMany({
      where: { tournamentId },
      include: {
        p1: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            code: true,
            name: true,
            mode: true,
          },
        },
      },
      orderBy: [
        { round: 'asc' },
        { gameIndex: 'asc' },
      ],
    });
  }
  
  // ==========================================
  // READ - Récupérer les matchs d'un joueur
  // ==========================================
  async findByPlayer(userId: string): Promise<MatchResponse[]> {
    return await prisma.match.findMany({
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
            playerRef: true,
          },
        },
        p2: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            playerRef: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            code: true,
            name: true,
            mode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

// DASHBOARD GRAPH 2
    async getRecentRalliesForUser(userId: string): Promise<RecentRallyStat[]> {
    const matches = await prisma.match.findMany({
      where: {
        status: 'CLOSED',
        OR: [
          { p1UserId: userId },
          { p2UserId: userId },
        ],
      },
      orderBy: {
        closedAt: 'desc',
      },
      take: 3,
    });
    
    // On mappe vers la forme attendue par le front
    return matches.map((match, index) => ({
      // Label : tu peux aussi utiliser la date, par ex:
      // label: match.closedAt ? match.closedAt.toISOString().slice(0, 10) : `Game ${index + 1}`,
      label: `Game ${index + 1}`,
      avgRallyBounces: match.avgRallyBounces ?? 0,
      avgRallyTime: match.avgRallyTime ?? 0,
    }));
  }
  
  // DASHBOARD GRAPH 3 - Match history (5 derniers matchs)
	async getRecentMatchesForUser(userId: string): Promise<{
	p1Username: string;
	p2Username: string;
	winnerUsername: string;
	p1Score: number;
	p2Score: number;
	playedAt: string;
	}[]> {
	const matches = await prisma.match.findMany({
		where: {
		status: 'CLOSED',
		OR: [{ p1UserId: userId }, { p2UserId: userId }],
		closedAt: { not: null },
		},
		orderBy: { closedAt: 'desc' },
		take: 5,
		select: {
		closedAt: true,
		p1Score: true,
		p2Score: true,
		p1: { select: { username: true } },
		p2: { select: { username: true } },
		winner: { select: { username: true } },
		},
	});

	return matches.map((m) => ({
		p1Username: m.p1?.username ?? 'Guest',
		p2Username: m.p2?.username ?? 'Guest',
		winnerUsername: m.winner?.username ?? 'Unknown',
		p1Score: m.p1Score ?? 0,
		p2Score: m.p2Score ?? 0,
		playedAt: (m.closedAt ?? new Date()).toISOString(),
	}));
	}


}