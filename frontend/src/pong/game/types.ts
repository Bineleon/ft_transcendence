// Un peu comme des structures en C

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

export interface GameState {
    ball: Ball;
    paddle: Paddle;
    world: {
        w: number;
        h: number;
    };
}