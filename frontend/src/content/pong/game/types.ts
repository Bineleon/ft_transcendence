// Un peu comme des structures en C

export interface GameViewHooks {
    onPlayerChange?: (id: PlayerId, info: PlayerInfo | null) => void;
}

export interface PlayerInfo {
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

export interface PlayersStats {
    p1Score: number;
    p2Score: number;
    lastScorer?: PlayerId;
    bounces: number;
    p1Effects: number;
    p2Effects: number;
    p1MaxBounces: number;
    p2MaxBounces: number;
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
    stats: PlayersStats;
    p1: PlayerInfo; 
    p2: PlayerInfo;  
}

