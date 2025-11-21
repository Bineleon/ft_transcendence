export interface CreateTournamentDTO {
  code: string;
  name: string;
  creatorID: string;
  mode: string;
  maxParticipants: number;
  kingMaxTime: number | null;
  kingMaxRounds: number | null;
}

export interface TournamentResponse {
  id: string;
  code: string;
  name: string;
  mode: string;
  status: string;
  maxParticipants: number;
  kingMaxTime: number | null;
  kingMaxRounds: number | null;
  createdBy: string | null;
  createdAt: Date;
  creator?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;                       
  matches?: any[];
  // _count?: {                      // ⬅️ AJOUTER pour findAll()
  //   matches: number;
  // };
}