export type  SnakePhase = "START" | "PLAYING" | "GAMEOVER" | "PAUSED";

export interface SnakeSegment { x: number; y: number; letter: string; }

export interface Eatable { x: number; y: number; letter: string; }

export interface SnakeState {
    world: { w: number; h: number; };
    snake: SnakeSegment[];
    dir: { x: number; y: number; };
    eatable: Eatable;
    phase: SnakePhase;
}

export interface Controls {
    up:    { code: string; down: boolean; };
    down:  { code: string; down: boolean; };
    left:  { code: string; down: boolean; };
    right: { code: string; down: boolean; };
    pause: { code: string; down: boolean; };
    escape:{ code: string; down: boolean; };
}