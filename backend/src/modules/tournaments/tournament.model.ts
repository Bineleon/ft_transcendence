export interface CreateTournamentDTO {
  code: string;
  name: string;
  creatorID: string;
  mode: string;
  maxParticipants: number;
}

export interface TournamentResponse {
  id: string;
  code: string;
  name: string;
  mode: string;
  status: string;
  maxParticipants: number;
  creator?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  matches?: any[];
  createdAt: Date;
}