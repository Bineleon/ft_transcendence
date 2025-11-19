// game/snake.ts
import type { SnakeController } from "../controller";
import { randomLetter } from "../game/utils";

export function stepSnake(controller: SnakeController): void {
  const head = controller.state.snake[0];
  const newX = head.x + controller.state.dir.x;
  const newY = head.y + controller.state.dir.y;

  // collisions mur simple
  if (newX < 0 || newX >= controller.state.world.w || newY < 0 || newY >= controller.state.world.h) {
    controller.setPhase("GAMEOVER");
    return;
  }

  // collision sur soi-même
  if (controller.state.snake.some(seg => seg.x === newX && seg.y === newY)) {
    controller.setPhase("GAMEOVER");
    return;
  }

  // nouvelle tête
  const newHead = {
    x: newX,
    y: newY,
    letter: controller.state.snake[0].letter, // pour le moment, même lettre que la tête
  };

  const ate = (newX === controller.state.eatable.x && newY === controller.state.eatable.y);

  controller.state.snake.unshift(newHead);

  if (!ate) {
    controller.state.snake.pop(); // on enlève la queue
  } else {
    // nouvelle pomme
    controller.state.eatable = {
      x: Math.floor(Math.random() * controller.state.world.w),
      y: Math.floor(Math.random() * controller.state.world.h),
      letter: randomLetter(),
    };
  }
}

export type StepFn = (delta: number) => void;
export type RenderFn = (acc: number) => void;

function createGameLoop(step: StepFn, render: RenderFn, fps = 60) {
    const STEP = 1 / fps;
    let last = performance.now();
    let accu = 0;
    // rafID = pas un timestamp, mais un ID retourné par requestAnimationFrame
    let rafID = 0;
    let run = false;

    function frame(now: number) {
        if (!run) return;
        if (!last) last = now;

        let delta = Math.min((now - last) / 1000, 0.1);
        if (delta > STEP * 2)  delta = STEP * 2;
        last = now;
        accu += delta;

        while (accu >= STEP) {
            step(STEP);
            accu -= STEP;
        }

        render(accu / STEP);

        // requestAnimationFrame() passe un timestamp à la fonction de callback (frame)
        rafID = requestAnimationFrame(frame);
    }
    
    return {
        start() {
            if (run) return;
            run = true;
            last = performance.now();
            accu = 0;
            rafID = requestAnimationFrame(frame);
        },
        stop() {
            run = false;
            if (rafID) {
                cancelAnimationFrame(rafID);
                rafID = 0;
            }
            last = 0;
            accu = 0;
        },
        get running() {
            return run;
        } 
    };
}

export function GameLoop(step: StepFn, render: RenderFn, fps = 60, autoStart = true) {
    const loop = createGameLoop(step, render, fps);
    if (autoStart) {
        loop.start();
    }
    return loop;
}