import type { GameState } from "./types";
import { GameController } from "../controller";
import { createPongStatsPanel } from "../ui/terminal";


export function collision(state: GameState, gameController: GameController) {
    const { ball, world, paddle1: p1, paddle2: p2 } = state;
    const bN = ball.pos.y - ball.r;
    const bS = ball.pos.y + ball.r;
    const bW = ball.pos.x - ball.r;
    const bE = ball.pos.x + ball.r;


    // Collision avec les murs haut et bas
    if (bN <= 0 || bS >= world.h)
        ball.dir.y *= -1;
    if (bN < 0) ball.pos.y = ball.r;
    if (bS > world.h) ball.pos.y = world.h - ball.r;


    if (ball.dir.x < 0) { // balle va à gauche
        const p1x = p1.pos.x + p1.size.x;
        const p1yN = p1.pos.y;
        const p1yS = p1.pos.y + p1.size.y;

        if (bW <= p1x &&
            bN <= p1yS &&
            bS >= p1yN) {
            ball.dir.x *= -1;
            state.stats.bounces++;
            moreVelocity(state, gameController);
        }
    }
    else if (ball.dir.x > 0) { // balle va à droite
        const p2x = p2.pos.x;
        const p2yN = p2.pos.y;
        const p2yS = p2.pos.y + p2.size.y;

        if (bE >= p2x &&
            bN <= p2yS &&
            bS >= p2yN) {
            ball.dir.x *= -1;
            state.stats.bounces++;
            moreVelocity(state, gameController);
        }
    }
}


export function score(state: GameState): boolean {
    const bW = state.ball.pos.x - state.ball.r;
    const bE = state.ball.pos.x + state.ball.r;

    if (bW <= 0) {
        state.stats.p2Score += 1;
        state.stats.lastScorer = 2;
        return true;    
    }
    if (bE >= state.world.w) {
        state.stats.p1Score += 1;
        state.stats.lastScorer = 1;
        return true;
    }
    return false;
}

export function moreVelocity(state: GameState, gameController: GameController) {
    let speedIncrement_x = 20;
    let speedIncrement_y = 20;
    const maxSpeed = 1500;
    let bounces = state.stats.bounces;

    console.log(`p1Up: ${gameController.pongControls.p1Up.down}, p1Down: ${gameController.pongControls.p1Down.down}, p2Up: ${gameController.pongControls.p2Up.down}, p2Down: ${gameController.pongControls.p2Down.down}`);
    if ((gameController.pongControls.p1Up.down && state.ball.pos.x < 750) || 
        (gameController.pongControls.p2Up.down && state.ball.pos.x >= 750)) {
        speedIncrement_y -= 30;
        console.log(`Increased ball speed to ${state.ball.vel.y}`);
    }
    if (gameController.pongControls.p1Down.down && state.ball.pos.x < 750 || 
        (gameController.pongControls.p2Down.down && state.ball.pos.x >= 750)) {
        state.ball.vel.y += 30;
        console.log(`Increased ball speed to ${state.ball.vel.y}`);
    }
    
    if (bounces % 4 === 0 && bounces !== 0) {
        if (state.ball.vel.x < maxSpeed) {
            state.ball.vel.x += speedIncrement_x;
        }
        if (state.ball.vel.y < maxSpeed) {
            state.ball.vel.y += speedIncrement_y;
        }
        speedIncrement_x += 30;
        speedIncrement_y += 30;
        state.stats.bounces++;
    }
}


// MAJ de la struct GameState avec le delta time 
export function update(gameController: GameController, delta: number) {
    const state = gameController.state;
    const controls = gameController.pongControls;

    collision(state, gameController);
    if (score(state) && (state.stats.p1Score < 3 || state.stats.p2Score < 3)) gameController.setPhase("SCORED");
    if (state.stats.p1Score >= 3 || state.stats.p2Score >= 3) {
        gameController.setPhase("GAMEOVER");
    }

    gameController.terminal.replaceChildren(createPongStatsPanel(state));

    const ball = state.ball;
    ball.pos.x += ball.vel.x * ball.dir.x * delta;
    ball.pos.y += ball.vel.y * ball.dir.y * delta;

    const v = state.paddle1.speed * delta;
    if (controls.p1Up.down) state.paddle1.pos.y -= v;
    if (controls.p1Down.down) state.paddle1.pos.y += v;

    if (controls.p2Up.down)   state.paddle2.pos.y -= v;  // tu peux mettre une speed différente
    if (controls.p2Down.down) state.paddle2.pos.y += v;

    // Clamp
    const maxY = state.world.h - state.paddle1.size.y;
    state.paddle1.pos.y = Math.max(0, Math.min(state.paddle1.pos.y, maxY));
    state.paddle2.pos.y = Math.max(0, Math.min(state.paddle2.pos.y, maxY));
}