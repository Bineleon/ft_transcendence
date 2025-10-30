export type StepFn = (delta: number) => void;
export type RenderFn = (acc: number) => void;

export function createGameLoop(step: StepFn, render: RenderFn, fps = 60) {
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