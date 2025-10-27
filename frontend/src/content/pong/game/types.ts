// Un peu comme des structures en C

export type GamePhase = "START" | "WAITING" | "PLAYING" | "COUNTDOWN" | "GAMEOVER" | "PAUSED";

export interface Vec2 {
    x: number;
    y: number;
}

export interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
}

export interface Paddle {
    pos: Vec2;
    size: Vec2;
    speed: number;
}


export interface Ready {
    p1: boolean;
    p2: boolean;
}

export interface Controls {
    p1Ready: string; // ex: "KeyW"
    p2Ready: string; // ex: "ArrowUp"
    pause: string;  // ex: "Escape"
}

export interface GameState {
    ball: Ball;
    paddle1: Paddle;
    paddle2: Paddle;
    world: {
        w: number;
        h: number;
    };
    phase: GamePhase
    ready: Ready;
    controls: Controls;
}

