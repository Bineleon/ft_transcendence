import { getPrismaClient } from '../../shared/database/prisma.js';
import type { MatchStatus, TournamentStatus } from '@prisma/client';
import type { CreateMatchDTO, UpdateMatchDTO, MatchResponse, PlayedMatchUserResponse, PlayedMatchResponse } from './match.model.js';

const prisma = getPrismaClient();

export class MatchService {
  // ==========================================
  // CREATE - Créer un nouveau match
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
  // READ - Récupérer tous les matchs d'un tournoi
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
        OR: [{ p1UserId: userId }, { p2UserId: userId }],
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
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // READ - Récupérer tous les matchs (avec filtres)
  // ==========================================

  async findAll(status?: MatchStatus): Promise<MatchResponse[]> {
    return await prisma.match.findMany({
      where: status ? { status } : undefined,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // UPDATE - Mettre à jour un match
  // ==========================================

  async update(id: string, data: UpdateMatchDTO): Promise<MatchResponse> {
    // Validation : si on déclare un gagnant, vérifier qu'il participe au match
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
        txHash: data.txHash,
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
  // UPDATE - Terminer un match (déclarer un gagnant)
  // ==========================================

  async finish(
    id: string,
    winnerUserId: string,
    p1Score?: number,
    p2Score?: number,
  ): Promise<MatchResponse> {
    const match = await prisma.match.findUnique({
      where: { id },
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

    if (match.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot finish match with status ${match.status}`);
    }

    // Vérifier que le gagnant est un participant
    if (winnerUserId !== match.p1UserId && winnerUserId !== match.p2UserId) {
      throw new Error('Winner must be one of the match participants');
    }

    // Utiliser une transaction pour garantir l'atomicité
    return await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le match
      const updatedMatch = await tx.match.update({
        where: { id },
        data: {
          status: 'CLOSED' as MatchStatus,
          winnerUserId,
          p1Score: p1Score ?? null,
          p2Score: p2Score ?? null,
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
        },
      });

      // 2. Si c'est un match de tournoi, avancer le gagnant
      if (match.tournamentId && match.round !== null && match.gameIndex !== null) {
        await this.advanceWinner(tx, match.tournamentId, winnerUserId, match.round, match.gameIndex);
      }

      return updatedMatch;
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

      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: 'CLOSED' as TournamentStatus }, // enum: OPEN / RUNNING / CLOSED
      });

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
  // DELETE - Supprimer un match
  // ==========================================

  async delete(id: string): Promise<void> {
    await prisma.match.delete({
      where: { id },
    });
  }

  // ==========================================
  // HELPERS – Winner à partir des scores PlayersStats
  // ==========================================

  private determineWinner(stats: PlayersStats): PlayerId | null {
    const { p1Stats, p2Stats } = stats;

    if (p1Stats.score === p2Stats.score) {
      return null; // match nul → pas de vainqueur
    }
    return p1Stats.score > p2Stats.score ? 'p1' : 'p2';
  }



////////////////////////////////////////////////////////////////
//////////         FELIX              ////////////////////////

///// ----- Creation de match Hors tournois, a la fin d'un Match ----- /////
/// Je vais afficher les changements du model Prisma en commentaires a cote
  async createAndRecordStats(data: PlayedMatchResponse): Promise<MatchResponse> {

    const createData: any = { gameCode: "pong", status: 'CLOSED' as MatchStatus, };

    //// Le p1
    if (!data.p1IsGuest) {
      const p1 = await prisma.user.findUnique({ where: { username: data.p1UserName } });
      if (p1) {
        createData.p1 = p1 as User;         /// Je ne sais pas si c'est comme ca qu'on fait le lien d'une table a une autre 
        updatePlayerStats(data.p1 as PlayedMatchUserResponse, p1);
      }                                     /// Pareil pour la founction au dessus, je sais pas comment on peut mettre a jour
    }                                       /// les stats du player, je me dis que ca peut passer par ici.
    createData.p1UserName = data.p1UserName;
    createData.p1Score = data.p1Score;

    //// Le p2
    if (!data.p2IsGuest) {
      const p2 = await prisma.user.findUnique({ where: { username: data.p2UserName } });
      if (p2) {
        createData.p2 = p2 as User;
        updatePlayerStats(data.p2 as PlayedMatchUserResponse, p2);
      }
    }
    createData.p2UserName = data.p2UserName;
    createData.p2Score = data.p2Score;

    createData.totalPoints = data.totalPoints;
    if (data.winnerName) createData.winnerName = data.winnerName;     /// Changer winnerUserId ->  winnerName
    if (data.loserName) createData.loserName = data.loserName;        /// Ajouter loserName
    createData.totalRallies = data.totalRallies;                      /// Ajouter totalRallies
    createData.maxBounces = data.maxBounces;                          /// Ajouter maxBounces
    createData.avgRallyBounces = data.avgRallyBounces;                /// Ajouter avgRallyBounces
    createData.totalMatchTime = data.totalMatchTime;                  /// Ajouter totalMatchTime
    createData.avgRallyTime = data.avgRallyTime;                      /// Ajouter avgRallyTime
    

    return await prisma.match.create({
      data: createData,
      include: {       /// Ici je ne sais pas trop comment ca fonctionne le retour je laisse comme ca
      },
    });
  }


// ==========================================
// recordPlayersStats – appliquer tes 4 règles, SANS matchId
// ==========================================
async recordPlayersStats(stats: ApiMatch | any): Promise<MatchResponse | null> {
  console.log("[recordPlayersStats] CALLED with:", stats);

  if (!stats || typeof stats !== "object") {
    console.warn("[recordPlayersStats] Invalid stats payload", stats);
    return null;
  }

  const { p1Stats, p2Stats } = stats as PlayersStats;

  if (!p1Stats || !p2Stats) {
    console.warn("[recordPlayersStats] Missing p1Stats or p2Stats", stats);
    return null;
  }
  // ...


  const bothGuests = p1Stats.isGuest && p2Stats.isGuest;
  if (bothGuests) {
    // Règle 1 : les deux guest → on ne touche pas à la DB
    console.log("[recordPlayersStats] Both players are guests, nothing persisted.");
    return null;
  }

  // Préparer la liste des usernames à chercher (uniquement les non-guests)
  const usernamesToLookup: string[] = [];
  if (!p1Stats.isGuest) usernamesToLookup.push(p1Stats.name);
  if (!p2Stats.isGuest) usernamesToLookup.push(p2Stats.name);

  const users =
    usernamesToLookup.length > 0
      ? await prisma.user.findMany({
          where: {
            username: { in: usernamesToLookup },
          },
          select: {
            id: true,
            username: true,
          },
        })
      : [];

  const p1User = !p1Stats.isGuest
    ? users.find((u) => u.username === p1Stats.name)
    : undefined;

  const p2User = !p2Stats.isGuest
    ? users.find((u) => u.username === p2Stats.name)
    : undefined;

  // Déterminer le "winner" à partir des scores
  const winnerSide = this.determineWinner(stats as PlayersStats);
  let winnerUserId: string | null = null;

  if (winnerSide === "p1" && p1User) {
    winnerUserId = p1User.id;
  } else if (winnerSide === "p2" && p2User) {
    winnerUserId = p2User.id;
  }

  // Construction de l'objet data pour le CREATE Prisma
  const data: any = {
    status: "DB_ONLY" as MatchStatus, // 👈 match isolé pour les stats
    gameCode: "pong",                 // adapte si tu veux
    p1Score: p1Stats.score,
    p2Score: p2Stats.score,
  };

  // Règle 2 & 3 : ne mettre p1UserId / p2UserId que pour les non-guests trouvés
  if (p1User) {
    data.p1UserId = p1User.id;
  }

  if (p2User) {
    data.p2UserId = p2User.id;
  }

  // winnerUserId uniquement si on a pu l’identifier
  if (winnerUserId) {
    data.winnerUserId = winnerUserId;
  }

  console.log("[recordPlayersStats] stats reçues", stats);
  console.log("[recordPlayersStats] data envoyée à Prisma", data);

  
  const created = await prisma.match.create({
    data,
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

  console.log("[recordPlayersStats] created match", created.id);
  return created;
}



  // ==========================================
  // UTILITIES - Statistiques d'un match
  // ==========================================

  async getStats(id: string) {
    const match = await this.findById(id);

    if (!match) {
      throw new Error('Match not found');
    }

    return {
      match: {
        id: match.id,
        status: match.status,
        round: match.round,
        gameIndex: match.gameIndex,
      },
      players: {
        p1: {
          id: match.p1?.id,
          username: match.p1?.username,
          score: match.p1Score,
        },
        p2: {
          id: match.p2?.id,
          username: match.p2?.username,
          score: match.p2Score,
        },
      },
      winner: match.winner
        ? {
            id: match.winner.id,
            username: match.winner.username,
          }
        : null,
      tournament: match.tournament
        ? {
            code: match.tournament.code,
            name: match.tournament.name,
          }
        : null,
      timestamps: {
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      },
    };
  }
}
