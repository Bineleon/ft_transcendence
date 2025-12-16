// Un peu comme des structures en C

// import type { Tournament } from "../../tournament/uiTypes";

export interface GameViewHooks {
    onPlayerChange?: (id: PlayerId, info: PlayerInfo | null) => void;
}

export interface PlayerInfo {
    id: string;
    userName: string;
    avatarUrl: string;
}

export interface KeyFlag { code: string; down: boolean; }

export type PlayerId = "p1" | "p2";

export interface Controls {
    p1Up: KeyFlag;
    p1Down: KeyFlag;
    p2Up: KeyFlag;
    p2Down: KeyFlag;
    pause: KeyFlag;
    escape: KeyFlag;
}

export interface MatchStats {
    matchId: string;
    totalPoints: number;        // 3 | 4 | 5
    winnerName: string;
    winnerUserId: string;
    loserName: string;

    totalRallies: number;       // Nombre total d'echanges sur le match entier
    maxBounces: number;         // Nombre max d'echanges en une partie      
    avgRallyBounces: number;    // Moyenne des echanges de tout les matchs par partie

    totalMatchTime: number;     // Temps total du match
    avgRallyTime: number;       // Temps Moyen par partie
    
    p1: PlayerMatchStats;
    p2: PlayerMatchStats;
}

export interface PlayerMatchStats {
    userName: string;

    score: number;                  // 0 | 1 | 2 | 3
    maxWins: number;                // max points consécutifs
    totalBallSpins: number;         // Nombre total d'effets de balle sur le match
    maxBouncesInWonRally: number;   // Nombre max d'echanges en une partie
    maxEffectsInWonRally: number;   // Nombre max d'effets en une partie
    maxBallSpeedWon: number;        // Balle la plus rapide gagnee
    maxBallSpeedLost: number;       // Balle la plus rapide perdue
    fastestWonRally: number;        // Partie gagnee la plus rapidement
    fastestLostRally: number;       // Partie perdu le plus rapidement

    ralliesWon: number;
    ralliesLost: number;
}


export interface LiveMatchStats {
    p1: LivePlayerStats;
    p2: LivePlayerStats;
    lastScorer?: PlayerId;
    
    currentBounces: number;
    totalBounces: number;
    totalRallies: number;   // un rally = un echange, tant qu'il n'y a pas de points

    rallyStartAt?: number;           
    rallyDurationsMs: number[];   
    pauseStartAt?: number;  
    totalPauseMs: number;

    matchId?: string;
    tournamentCode?: string;
    tournamentId?: string;
    tournamentMode?: string;
    tournamentName?: string;
    matchRound?: number;
    matchStatus?: string;
}

export interface LivePlayerStats {
    name: string;
    isGuest: boolean;
    score: number;

    effects: number;   /// Pas besoin la db
    maxEffects: number;
    maxBounces: number;
    fastestWonRally: number;        // Partie gagnee la plus rapidement
    fastestLostRally: number;       // Partie perdu le plus rapidement
    maxBallSpeedWon: number;        // Balle la plus rapide gagnee
    maxBallSpeedLost: number;       // Balle la plus rapide perdue

    paddleHits: number;
    currentWins: number;        // serie de rally gagnes
}

export type  GamePhase = "START" | "WAITING" | "PLAYING" | "COUNTDOWN" | "GAMEOVER" | "PAUSED" | "RESTART" | "SCORED";

export interface Vec2 { x: number; y: number; }

export interface Ball {
    pos: Vec2;
    vel: Vec2;
    velIncrement: Vec2;
    r: number;
}

export interface Paddle {
    pos: Vec2;
    size: Vec2;
    speed: number;

}

export interface GameState {
    world: { w: number; h: number; };
    ball: Ball;
    paddle1: Paddle;
    paddle2: Paddle;
    phase: GamePhase;
    PrevPhase?: GamePhase;
    ready: { p1: boolean; p2: boolean };

    matchId?: string;
    stats: LiveMatchStats;
    p1: PlayerInfo; 
    p2: PlayerInfo;
    tournamentCode?: string;
}

