import type { GameState } from "./types";

// MAJ de la struct GameState avec le delta time 
export function update(state: GameState, delta: number) {
    const ball = state.ball;
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;
}
