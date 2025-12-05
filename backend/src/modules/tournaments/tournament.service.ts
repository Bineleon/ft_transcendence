import { getPrismaClient } from '../../shared/database/prisma.js';
import type { TournamentMode, TournamentStatus, MatchStatus } from '@prisma/client';
import type { CreateTournamentDTO, TournamentResponse } from './tournament.model.js';
import { comparePassword } from '../../shared/utils/password.js';

const prisma = getPrismaClient();

export class TournamentService {
  // ==========================================
  // CREATE
  // ==========================================
  async create(data: CreateTournamentDTO): Promise<TournamentResponse> {
    if (data.mode === 'KING') {
      if (!data.kingMaxTime || !data.kingMaxRounds) {
        throw new Error('KING mode requires kingMaxTime and kingMaxRounds');
      }
    }

    const exists = await this.codeExists(data.code);
    if (exists) {
      throw new Error('Tournament code already exists');
    }

    let createdByValue: string | undefined;
    if (data.creatorName) {
      const user = await prisma.user.findUnique({
        where: { username: data.creatorName }
      });
      if (!user) {
        throw new Error('Creator not found');
      }
      createdByValue = user.id;
    }

    return await prisma.$transaction(async (tx) => {
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

      const matches = this.generateEmptyMatches(
        tournament.id,
        data.maxParticipants
      );

      if (matches.length > 0) {
        await tx.match.createMany({ data: matches });
      }

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
    const matches: any[] = [];
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

  // ==========================================
  // UPDATE STATUS
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

  // ==========================================
  // JOIN WITH USERNAME + PASSWORD (P2 compte existant)
  // ==========================================
  // async joinWithCredentials(code: string, username: string, password: string): Promise<TournamentResponse> {
  //   const tournament = await prisma.tournament.findUnique({
  //     where: { code },
  //     include: {
  //       matches: {
  //         where: { round: 1 },
  //         orderBy: { gameIndex: 'asc' }
  //       }
  //     }
  //   });

  //   if (!tournament) {
  //     throw new Error('Tournament not found');
  //   }

  //   if (tournament.status !== 'OPEN') {
  //     throw new Error('Tournament is not open for registration');
  //   }

  //   const user = await prisma.user.findUnique({
  //     where: { username },
  //     select: {
  //       id: true,
  //       username: true,
  //       passwordHash: true
  //     }
  //   });

  //   if (!user || !user.passwordHash) {
  //     throw new Error('Invalid username or password');
  //   }

  //   const ok = await comparePassword(password, user.passwordHash);
  //   if (!ok) {
  //     throw new Error('Invalid username or password');
  //   }

  //   // Vérifier si déjà inscrit (par id ou par ref texte)
  //   const alreadyJoined = tournament.matches.some(
  //     (match) =>
  //       match.p1UserId === user.id ||
  //       match.p2UserId === user.id ||
  //       match.p1Ref === user.username ||
  //       match.p2Ref === user.username
  //   );

  //   if (alreadyJoined) {
  //     throw new Error('User already joined this tournament');
  //   }

  //   // Calculer le nombre de slots déjà occupés (userId OU alias)
  //   const usedSlots = tournament.matches.reduce((acc, m) => {
  //     if (m.p1UserId || m.p1Ref) acc++;
  //     if (m.p2UserId || m.p2Ref) acc++;
  //     return acc;
  //   }, 0);

  //   if (usedSlots >= tournament.maxParticipants) {
  //     throw new Error('Tournament is full');
  //   }

  //   let assigned = false;

  //   for (const match of tournament.matches) {
  //     // slot P1 libre ?
  //     if (!match.p1UserId && !match.p1Ref) {
  //       await prisma.match.update({
  //         where: { id: match.id },
  //         data: { p1UserId: user.id, p1Ref: user.username }
  //       });
  //       assigned = true;
  //       break;
  //     }
  //     // slot P2 libre ?
  //     if (!match.p2UserId && !match.p2Ref) {
  //       await prisma.match.update({
  //         where: { id: match.id },
  //         data: { p2UserId: user.id, p2Ref: user.username }
  //       });
  //       assigned = true;
  //       break;
  //     }
  //   }

  //   if (!assigned) {
  //     throw new Error('Could not assign player to a match');
  //   }

  //   const updatedTournament = await prisma.tournament.findUnique({
  //     where: { code },
  //     include: {
  //       matches: {
  //         where: { round: 1 }
  //       }
  //     }
  //   });

  //   if (updatedTournament) {
  //     const allSlotsFilled = updatedTournament.matches.every(
  //       (match) =>
  //         (match.p1UserId || match.p1Ref) &&
  //         (match.p2UserId || match.p2Ref)
  //     );

  //     if (allSlotsFilled) {
  //       await prisma.tournament.update({
  //         where: { code },
  //         data: { status: 'RUNNING' }
  //       });
  //     }
  //   }

  //   return (await this.findByCode(code)) as TournamentResponse;
  // }

  // // ==========================================
  // // JOIN WITH ALIAS (P2 sans compte)
  // // ==========================================
  // async joinWithAlias(code: string, alias: string): Promise<TournamentResponse> {
  //   const tournament = await prisma.tournament.findUnique({
  //     where: { code },
  //     include: {
  //       matches: {
  //         where: { round: 1 },
  //         orderBy: { gameIndex: 'asc' }
  //       }
  //     }
  //   });

  //   if (!tournament) {
  //     throw new Error('Tournament not found');
  //   }

  //   if (tournament.status !== 'OPEN') {
  //     throw new Error('Tournament is not open for registration');
  //   }

  //   const trimmedAlias = alias.trim();
  //   if (!trimmedAlias) {
  //     throw new Error('Alias cannot be empty');
  //   }

  //   // Vérifier si un alias identique est déjà utilisé (optionnel)
  //   const alreadyAlias = tournament.matches.some(
  //     (m) => m.p1Ref === trimmedAlias || m.p2Ref === trimmedAlias
  //   );
  //   if (alreadyAlias) {
  //     throw new Error('This alias is already used in this tournament');
  //   }

  //   // Slots utilisés (userId ou alias)
  //   const usedSlots = tournament.matches.reduce((acc, m) => {
  //     if (m.p1UserId || m.p1Ref) acc++;
  //     if (m.p2UserId || m.p2Ref) acc++;
  //     return acc;
  //   }, 0);

  //   if (usedSlots >= tournament.maxParticipants) {
  //     throw new Error('Tournament is full');
  //   }

  //   let assigned = false;

  //   for (const match of tournament.matches) {
  //     if (!match.p1UserId && !match.p1Ref) {
  //       await prisma.match.update({
  //         where: { id: match.id },
  //         data: { p1Ref: trimmedAlias }
  //       });
  //       assigned = true;
  //       break;
  //     }
  //     if (!match.p2UserId && !match.p2Ref) {
  //       await prisma.match.update({
  //         where: { id: match.id },
  //         data: { p2Ref: trimmedAlias }
  //       });
  //       assigned = true;
  //       break;
  //     }
  //   }

  //   if (!assigned) {
  //     throw new Error('Could not assign alias to a match');
  //   }

  //   const updatedTournament = await prisma.tournament.findUnique({
  //     where: { code },
  //     include: {
  //       matches: {
  //         where: { round: 1 }
  //       }
  //     }
  //   });

  //   if (updatedTournament) {
  //     const allSlotsFilled = updatedTournament.matches.every(
  //       (match) =>
  //         (match.p1UserId || match.p1Ref) &&
  //         (match.p2UserId || match.p2Ref)
  //     );

  //     if (allSlotsFilled) {
  //       await prisma.tournament.update({
  //         where: { code },
  //         data: { status: 'RUNNING' }
  //       });
  //     }
  //   }

  //   return (await this.findByCode(code)) as TournamentResponse;
  // }

     async join(code: string, userName: string): Promise<TournamentResponse> {
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
      where: { username: userName }  
    });

    if (!user) {
      throw new Error('User not found');
    }

    const alreadyJoined = tournament.matches.some(
      match => match.p1UserId === user.id || match.p2UserId === user.id
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
          data: { p1UserId: user.id }
        });
        assigned = true;
        break;
      } else if (!match.p2UserId) {
        await prisma.match.update({
          where: { id: match.id },
          data: { p2UserId: user.id }
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



    // ==========================================
  // LEAVE alias (P2 sans compte)
  // ==========================================
  async leaveWithAlias(code: string, alias: string): Promise<TournamentResponse> {
    const tournament = await prisma.tournament.findUnique({
      where: { code },
      select: {
        id: true,
        status: true,
      },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new Error('Cannot leave a tournament that is not OPEN');
    }

    const trimmedAlias = alias.trim();
    if (!trimmedAlias) {
      throw new Error('Alias cannot be empty');
    }

    // Vérifier qu'il est bien présent
    const exists = await prisma.match.findFirst({
      where: {
        tournamentId: tournament.id,
        OR: [
          { p1Ref: trimmedAlias },
          { p2Ref: trimmedAlias },
        ],
      },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('Alias is not registered in this tournament');
    }

    // Supprimer l'alias des slots où il apparaît
    await prisma.match.updateMany({
      where: {
        tournamentId: tournament.id,
        p1Ref: trimmedAlias,
      },
      data: {
        p1Ref: null,
      },
    });

    await prisma.match.updateMany({
      where: {
        tournamentId: tournament.id,
        p2Ref: trimmedAlias,
      },
      data: {
        p2Ref: null,
      },
    });

    return (await this.findByCode(code)) as TournamentResponse;
  }

  // ==========================================
  // LEAVE user (P2 avec compte existant)
  // ==========================================
  async leaveWithUser(code: string, username: string): Promise<TournamentResponse> {
    const tournament = await prisma.tournament.findUnique({
      where: { code },
      select: {
        id: true,
        status: true,
      },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new Error('Cannot leave a tournament that is not OPEN');
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Vérifier qu'il est bien inscrit
    const exists = await prisma.match.findFirst({
      where: {
        tournamentId: tournament.id,
        OR: [
          { p1UserId: user.id },
          { p2UserId: user.id },
        ],
      },
      select: { id: true },
    });

    if (!exists) {
      throw new Error('User is not registered in this tournament');
    }

    // On libère les slots P1 / P2 pour ce user
    await prisma.match.updateMany({
      where: {
        tournamentId: tournament.id,
        p1UserId: user.id,
      },
      data: {
        p1UserId: null,
        p1Ref: null, // on nettoie aussi la ref texte si tu l'utilises
      },
    });

    await prisma.match.updateMany({
      where: {
        tournamentId: tournament.id,
        p2UserId: user.id,
      },
      data: {
        p2UserId: null,
        p2Ref: null,
      },
    });

    return (await this.findByCode(code)) as TournamentResponse;
  }

  // ==========================================
  // START / CLOSE / DELETE / UTILS / STATS
  // ==========================================
  async start(code: string): Promise<TournamentResponse> {
    const tournament = await prisma.tournament.findUnique({
      where: { code }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new Error(`Cannot start tournament with status ${tournament.status}`);
    }

    const participantsCount = await this.getParticipantsCount(code);
    if (participantsCount < 2) {
      throw new Error('Tournament needs at least 2 participants to start');
    }

    return await this.updateStatus(code, 'RUNNING');
  }

  async close(code: string): Promise<TournamentResponse> {
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

  async delete(code: string): Promise<void> {
    await prisma.tournament.delete({
      where: { code }
    });
  }

  private async codeExists(code: string): Promise<boolean> {
    const tournament = await prisma.tournament.findUnique({
      where: { code },
      select: { id: true }
    });
    return !!tournament;
  }

  async registerPlayerByUsername(code: string, username: string) {
    // (tu peux garder ou supprimer cette fonction selon ce que tu utilises)
    const tournament = await prisma.tournament.findUnique({
      where: { code },
      select: {
        id: true,
        status: true,
        maxParticipants: true,
      },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new Error(`Tournament is not open for registration (status=${tournament.status})`);
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const already = await prisma.match.findFirst({
      where: {
        tournamentId: tournament.id,
        OR: [
          { p1UserId: user.id },
          { p2UserId: user.id },
        ],
      },
      select: { id: true },
    });

    if (already) {
      throw new Error('User already registered to this tournament');
    }

    const isFull = await this.isFull(code);
    if (isFull) {
      throw new Error('Tournament is full');
    }

    const registrationMatch = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        p1UserId: user.id,
        status: 'DB_ONLY' as MatchStatus,
      },
    });

    return {
      participant: {
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl ?? null,
      },
      tournamentCode: code,
      registrationMatchId: registrationMatch.id,
    };
  }

  async getParticipantsCount(code: string): Promise<number> {
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

    const uniquePlayerIds = new Set<string>();
    tournament.matches.forEach((match) => {
      if (match.p1UserId) {
        uniquePlayerIds.add(match.p1UserId);
      }
      if (match.p2UserId) {
        uniquePlayerIds.add(match.p2UserId);
      }
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

  async getStats(code: string) {
    const tournament = await this.findByCode(code);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const participantsCount = await this.getParticipantsCount(code);
    const isFull = await this.isFull(code);

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
