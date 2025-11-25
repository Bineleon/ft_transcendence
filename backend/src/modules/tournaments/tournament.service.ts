import { getPrismaClient } from '../../shared/database/prisma.js';
import type { TournamentMode, TournamentStatus } from '@prisma/client';
import type { CreateTournamentDTO, TournamentResponse } from './tournament.model.js';
import { request } from 'http';

const prisma = getPrismaClient();

export class TournamentService {
  
  // ==========================================
  // CREATE
  // ==========================================
  
  async create(data: CreateTournamentDTO): Promise<TournamentResponse> {
    // Validation pour le mode KING
    console.log("Creating tournament with data:", data);
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

    // Si un creatorID est fourni, vérifier qu'il existe pour éviter la contrainte FK
    let createdByValue: string | undefined;
    if (data.creatorID) {
      const user = await prisma.user.findUnique({ where: { id: data.creatorID }, select: { id: true } });
      if (!user) {
        throw new Error(`Creator not found for id=${data.creatorID}`);
      }
      createdByValue = data.creatorID;
    }
    
    try {
      return await prisma.tournament.create({
        data: {
          code: data.code,
          name: data.name,
          ...(createdByValue ? { createdBy: createdByValue } : {}),
          mode: data.mode as TournamentMode,
          maxParticipants: data.maxParticipants,
          kingMaxTime: data.kingMaxTime,
          kingMaxRounds: data.kingMaxRounds,
          status: 'OPEN' as TournamentStatus
        },
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
    } catch (err) {
      console.error("createTournament error:", err);
      // si Prisma renvoie une erreur de FK, rendre le message plus lisible
      if ((err as any).code === 'P2003') {
        throw new Error('Foreign key constraint violated (invalid creator id)');
      }
      throw err;
    }
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