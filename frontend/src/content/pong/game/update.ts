import type { Ball, GameState, PlayerId } from "./uiTypes";
import { GameController } from "../controller";
import { createPongStatsPanel } from "../ui/terminal";
import type { Vec2 } from "./uiTypes";
import { getPaddleFacePoints, type PaddleFacePoints } from "./geometry";

export type CardinalDirection = "NE" | "NO" | "SE" | "SO" | "CENTER";

export interface GetDirOptions {
  epsilon?: number;
  invertY?: boolean;
}

/// ---- UTILS ---- ///

// 1e-3 c'est pour eviter les erreurs d'arrondis
// secu de velocite nulle
//  et invertY pour les coordonnees ecran (false la balle monte quand y decroit, true l'inverse)
export function getDirectionFromVec(vel: Vec2, opts: GetDirOptions = {}): CardinalDirection {
  const { epsilon = 1e-3, invertY = false } = opts;
  if (!vel) return "CENTER";

  const dx = Math.abs(vel.x) < epsilon ? 0 : vel.x;
  let dy = Math.abs(vel.y) < epsilon ? 0 : vel.y;
  if (invertY) dy = -dy;

  if (dx === 0 && dy === 0) return "CENTER";
  if (dx > 0 && dy < 0) return "NE";
  if (dx < 0 && dy < 0) return "NO";
  if (dx < 0 && dy > 0) return "SO";
  return "SE";
}


// Juste pour la lisibilte, transforme la velocite de la balle en direction cardinal ( NE, NO, SE, SO )
export function getBallDirection(ball: Ball, opts: GetDirOptions = {}): CardinalDirection {
  return getDirectionFromVec(ball.vel, opts);
}

export function getBallSide(ball: Ball): PlayerId {
  return ball.pos.x < 750 ? "p1" : "p2";
}

export function collision(state: GameState, gameController: GameController) {
    const { ball, world, paddle1: p1, paddle2: p2 } = state;
    const bN = ball.pos.y - ball.r;
    const bS = ball.pos.y + ball.r;
    const bW = ball.pos.x - ball.r;
    const bE = ball.pos.x + ball.r;

    // Collision avec les murs haut et bas
    if (bN <= 0 || bS >= world.h) ball.vel.y *= -1;
    if (bN < 0) ball.pos.y = ball.r;
    if (bS > world.h) ball.pos.y = world.h - ball.r;


    if (ball.vel.x < 0) { // balle va à gauche
        const p1x = p1.pos.x + p1.size.x;
        const p1yN = p1.pos.y;
        const p1yS = p1.pos.y + p1.size.y;

        if (bW <= p1x && bN <= p1yS && bS >= p1yN) {
            ball.vel.x *= -1;
            state.stats.currentBounces++;
            moreVelocity(state, gameController);
        }
    }
    else if (ball.vel.x > 0) { // balle va à droite
        const p2x = p2.pos.x;
        const p2yN = p2.pos.y;
        const p2yS = p2.pos.y + p2.size.y;

        if (bE >= p2x && bN <= p2yS && bS >= p2yN) { 
            ball.vel.x *= -1;
            state.stats.currentBounces++;
            moreVelocity(state, gameController);
        }
    }
}

export function score(state: GameState): boolean {
    const bW = state.ball.pos.x - state.ball.r;
    const bE = state.ball.pos.x + state.ball.r;

    if (bW <= 0) {
        state.stats.p2.score += 1;
        state.stats.lastScorer = "p2";
        if (state.stats.currentBounces > state.stats.p2.maxBounces)
            state.stats.p2.maxBounces = state.stats.currentBounces;
        return true;    
    }
    if (bE >= state.world.w) {
        state.stats.p1.score += 1;
        state.stats.lastScorer = "p1";
        if (state.stats.currentBounces > state.stats.p1.maxBounces)
            state.stats.p1.maxBounces = state.stats.currentBounces;
        return true;
    }
    return false;
}

export function moreVelocity(state: GameState, gameController: GameController) {
    const IncrementX = state.ball.velIncrement.x;
    const IncrementY = state.ball.velIncrement.y;

    // const maxSpeed = 1500;
    let bounces = state.stats.totalBounces;
    const { p1Up, p1Down, p2Up, p2Down } = gameController.pongControls;
    const ballDir = getDirectionFromVec(state.ball.vel);
    const ballSide = getBallSide(state.ball);
    const p1Face = getPaddleFacePoints(state.paddle1, "p1");
    const p2Face = getPaddleFacePoints(state.paddle2, "p2");

    function paddleIsAtEdge(paddle: PaddleFacePoints): boolean {
        return (paddle.top.y <= 0 || paddle.bottom.y >= state.world.h);
    }

    // mmodification de l'angle en fonction des collisions avec les paddles
    if (p1Up.down && ballDir.includes("N") && ballSide === "p1" && !paddleIsAtEdge(p1Face)
    || p2Up.down && ballDir.includes("N") && ballSide === "p2" && !paddleIsAtEdge(p2Face)
    || p1Down.down && ballDir.includes("S") && ballSide === "p1" && !paddleIsAtEdge(p1Face)
    || p2Down.down && ballDir.includes("S") && ballSide === "p2" && !paddleIsAtEdge(p2Face)) {
        state.ball.vel.y -= 20;
        state.ball.vel.x += 50;
        if (ballSide === "p1") state.stats.p1.effects++;
        else state.stats.p2.effects++;
    }
    if (p1Down.down && ballDir.includes("N") && ballSide === "p1" && !paddleIsAtEdge(p1Face)
    || p2Down.down && ballDir.includes("N") && ballSide === "p2" && !paddleIsAtEdge(p2Face)
    || p1Up.down && ballDir.includes("S") && ballSide === "p1" && !paddleIsAtEdge(p1Face)
    || p2Up.down && ballDir.includes("S") && ballSide === "p2" && !paddleIsAtEdge(p2Face)) {
        state.ball.vel.y += 20;
        state.ball.vel.x += 50;
        if (ballSide === "p1") state.stats.p1.effects++;
        else  state.stats.p2.effects++;
    }
    
    // simple augmentation de la vitesse tous les 3 rebonds
    if (bounces % 3 === 0 && bounces !== 0) {
        if (state.ball.vel.x > 0) {
            state.ball.vel.x += IncrementX;
        } else {
            state.ball.vel.x -= IncrementX;
        }
        if (state.ball.vel.y > 0) {
            state.ball.vel.y += IncrementY;
        } else {
            state.ball.vel.y -= IncrementY;
        }
        state.ball.velIncrement.x += 10;
        state.ball.velIncrement.y += 10;
    }
}


// MAJ de la struct GameState avec le delta time 
export function update(gameController: GameController, delta: number) {
    const state = gameController.state;
    const controls = gameController.pongControls;

    collision(state, gameController);
    if (score(state)) {
        if (state.stats.p1.score >= 3 || state.stats.p2.score >= 3) {
            gameController.setPhase("GAMEOVER");
        } else {
            gameController.setPhase("SCORED");
        }
    }
    gameController.terminal.replaceChildren(createPongStatsPanel(state));

    const ball = state.ball;
    ball.pos.x += ball.vel.x * delta;
    ball.pos.y += ball.vel.y * delta;

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