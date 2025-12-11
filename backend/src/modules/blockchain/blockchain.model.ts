export interface Match {
  matchId: number;
  player1: string;
  player2: string;
  scorePlayer1: number;
  scorePlayer2: number;
  winner: string;
  timestamp: number;
}

export interface RecordTournamentRequest {
  tournamentId: number;
  winner: string;
  players: string[];
  matches: Match[];
}

export interface Tournament {
  id: number;
  winner: string;
  players: string[];
  matches: Match[];
  timestamp: number;
  exists: boolean;
}

export interface BlockchainResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: string;
  explorerUrl?: string;
}

