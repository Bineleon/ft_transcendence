// Un peu comme des structures en C

export interface KeyFlag { code: string; down: boolean; }

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
    lastScorer?: 1 | 2;
    bounces: number;
}

export type  GamePhase = "START" | "WAITING" | "PLAYING" | "COUNTDOWN" | "GAMEOVER" | "PAUSED" | "RESTART" | "SCORED";

export interface Vec2 { x: number; y: number; }

export interface Ball {
    pos: Vec2;
    vel: Vec2;
    dir: Vec2;
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
    ready: { p1: boolean; p2: boolean };
    stats: PlayersStats;
}

