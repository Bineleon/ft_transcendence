import { getPrismaClient } from '../../shared/database/prisma.js';
import type { TournamentMode, TournamentStatus } from '@prisma/client';
import type { CreateTournamentDTO, TournamentResponse } from './tournament.model.js';

const prisma = getPrismaClient();

export class TournamentService {
  
  // ==========================================
  // CREATE
  // ==========================================
  
  async create(data: CreateTournamentDTO): Promise<TournamentResponse> {
    // Validation pour le mode KING
    if (data.mode === 'KING') {
      if (!data.kingMaxTime || !data.kingMaxRounds) {
        throw new Error('KING mode requires kingMaxTime and kingMaxRounds');
      }
    }

    // Vérifier que le code n'existe pas
    const exists = await this.codeExists(data.code);
    if (exists) {
      throw new Error('Tournament code already exists');
    }

    // Vérifier que le créateur existe
    let createdByValue: string | undefined;
    if (data.creatorID) {
      const user = await prisma.user.findUnique({ 
        where: { id: data.creatorID } 
      });
      if (!user) {
        throw new Error('Creator not found');
      }
      createdByValue = data.creatorID;
    }
    
    // TRANSACTION : Créer tournoi + matchs ensemble
    return await prisma.$transaction(async (tx) => {
      // 1. Créer le tournoi
      const tournament = await tx.tournament.create({
        data: {
          code: data.code,
          name: data.name,
          ...(createdByValue ? { createdBy: createdByValue } : {}),
          mode: data.mode as TournamentMode,
          maxParticipants: data.maxParticipants,
          kingMaxTime: data.kingMaxTime,
          kingMaxRounds: data.kingMaxRounds,
          status: 'OPEN' as TournamentStatus
        }
      });

      // 2. Générer tous les matchs vides
      const matches = this.generateEmptyMatches(
        tournament.id,
        data.maxParticipants
      );

      // 3. Créer tous les matchs
      if (matches.length > 0) {
        await tx.match.createMany({ data: matches });
      }

      // 4. Retourner le tournoi avec matchs
      return await tx.tournament.findUnique({
        where: { id: tournament.id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      }) as TournamentResponse;
    });
  }

  // ==========================================
  // GÉNÉRER LES MATCHS (maxParticipants - 1)
  // ==========================================
  
  private generateEmptyMatches(tournamentId: string, maxParticipants: number) {
    const matches: any[] = []; // TMP a modifier 
    let remaining = maxParticipants;
    let round = 1;

    while (remaining > 1) {
      const matchesInRound = Math.floor(remaining / 2);
      
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          tournamentId,
          round,
          gameIndex: i,
          status: 'SCHEDULED' as const,
          p1UserId: null,
          p2UserId: null,
          p1Score: null,
          p2Score: null,
          winnerUserId: null,
          txHash: null
        });
      }
      
      remaining = matchesInRound;
      round++;
    }
    
    return matches;
  }


  // ==========================================
  // READ
  // ==========================================
  
  async findByCode(code: string): Promise<TournamentResponse | null> {
    return await prisma.tournament.findUnique({
      where: { code },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        matches: {
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
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  // async findAll(status?: TournamentStatus): Promise<TournamentResponse[]> {
  //   return await prisma.tournament.findMany({
  //     where: status ? { status } : undefined,
  //     include: {
  //       creator: {
  //         select: {
  //           id: true,
  //           username: true,
  //           avatarUrl: true
  //         }
  //       },
  //       _count: {
  //         select: { matches: true }
  //       }
  //     },
  //     orderBy: { createdAt: 'desc' }
  //   });
  // }

  // async findByCreator(userId: string): Promise<TournamentResponse[]> {
  //   return await prisma.tournament.findMany({
  //     where: { createdBy: userId },
  //     include: {
  //       creator: {
  //         select: {
  //           id: true,
  //           username: true,
  //           avatarUrl: true
  //         }
  //       },
  //       _count: {
  //         select: { matches: true }
  //       }
  //     },
  //     orderBy: { createdAt: 'desc' }
  //   });
  // }

  // ==========================================
  // UPDATE
  // ==========================================
  
  async updateStatus(code: string, status: TournamentStatus): Promise<TournamentResponse> {
    return await prisma.tournament.update({
      where: { code },
      data: { status },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
  }

   async join(code: string, userId: string): Promise<TournamentResponse> {
    const tournament = await prisma.tournament.findUnique({
      where: { code },
      include: {
        matches: {
          where: { round: 1 },
          orderBy: { gameIndex: 'asc' }
        }
      }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new Error('Tournament is not open for registration');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const alreadyJoined = tournament.matches.some(
      match => match.p1UserId === userId || match.p2UserId === userId
    );

    if (alreadyJoined) {
      throw new Error('User already joined this tournament');
    }

    const participants = new Set<string>();
    tournament.matches.forEach(match => {
      if (match.p1UserId) participants.add(match.p1UserId);
      if (match.p2UserId) participants.add(match.p2UserId);
    });

    if (participants.size >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    let assigned = false;
    
    for (const match of tournament.matches) {
      if (!match.p1UserId) {
        await prisma.match.update({
          where: { id: match.id },
          data: { p1UserId: userId }
        });
        assigned = true;
        break;
      } else if (!match.p2UserId) {
        await prisma.match.update({
          where: { id: match.id },
          data: { p2UserId: userId }
        });
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      throw new Error('Could not assign player to a match');
    }

    const updatedTournament = await prisma.tournament.findUnique({
      where: { code },
      include: {
        matches: {
          where: { round: 1 }
        }
      }
    });

    const allSlotsFilled = updatedTournament!.matches.every(
      match => match.p1UserId && match.p2UserId
    );

    if (allSlotsFilled) {
      await prisma.tournament.update({
        where: { code },
        data: { status: 'RUNNING' }
      });
    }

    return await this.findByCode(code) as TournamentResponse;
  }


  async start(code: string): Promise<TournamentResponse> {
    // Vérifier que le tournoi existe et est OPEN
    const tournament = await prisma.tournament.findUnique({
      where: { code }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new Error(`Cannot start tournament with status ${tournament.status}`);
    }

    // Vérifier qu'il y a assez de participants
    const participantsCount = await this.getParticipantsCount(code);
    if (participantsCount < 2) {
      throw new Error('Tournament needs at least 2 participants to start');
    }

    return await this.updateStatus(code, 'RUNNING');
  }

  async close(code: string): Promise<TournamentResponse> {
    // Vérifier que le tournoi existe et est RUNNING
    const tournament = await prisma.tournament.findUnique({
      where: { code }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'RUNNING') {
      throw new Error(`Cannot close tournament with status ${tournament.status}`);
    }

    return await this.updateStatus(code, 'CLOSED');
  }

  // ==========================================
  // DELETE
  // ==========================================
  
  async delete(code: string): Promise<void> {
    await prisma.tournament.delete({
      where: { code }
    });
  }

  // ==========================================
  // UTILITIES
  // ==========================================
  
  private async codeExists(code: string): Promise<boolean> {
    const tournament = await prisma.tournament.findUnique({
      where: { code },
      select: { id: true }
    });
    return !!tournament;
  }

  async getParticipantsCount(code: string): Promise<number> {
    // Récupérer le tournament avec ses matches
    const tournament = await prisma.tournament.findUnique({
      where: { code },
      include: {
        matches: {
          select: {
            p1UserId: true,
            p2UserId: true
          }
        }
      }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Extraire les IDs uniques des joueurs
    const uniquePlayerIds = new Set<string>();
    tournament.matches.forEach(match => {
      uniquePlayerIds.add(match.p1UserId);
      uniquePlayerIds.add(match.p2UserId);
    });

    return uniquePlayerIds.size;
  }

  async isFull(code: string): Promise<boolean> {
    const tournament = await prisma.tournament.findUnique({
      where: { code },
      select: { maxParticipants: true }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const participantsCount = await this.getParticipantsCount(code);
    return participantsCount >= tournament.maxParticipants;
  }

  // ==========================================
  // TOURNAMENT STATS
  // ==========================================
  
  async getStats(code: string) {
    const tournament = await this.findByCode(code);
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const participantsCount = await this.getParticipantsCount(code);
    const isFull = await this.isFull(code);

    // Compter les matches par statut
    const matchStats = {
      total: tournament.matches?.length || 0,
      scheduled: tournament.matches?.filter(m => m.status === 'SCHEDULED').length || 0,
      inProgress: tournament.matches?.filter(m => m.status === 'IN_PROGRESS').length || 0,
      closed: tournament.matches?.filter(m => m.status === 'CLOSED').length || 0,
      confirmed: tournament.matches?.filter(m => m.status === 'CONFIRMED').length || 0
    };

    return {
      tournament: {
        code: tournament.code,
        name: tournament.name,
        status: tournament.status,
        mode: tournament.mode,
        maxParticipants: tournament.maxParticipants
      },
      participants: {
        count: participantsCount,
        max: tournament.maxParticipants,
        isFull
      },
      matches: matchStats,
      creator: tournament.creator
    };
  }
}