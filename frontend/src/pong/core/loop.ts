export type StepFn = (dt: number) => void;
export type RenderFn = (acc: number) => void;

export function gameLoop(step: StepFn, render: RenderFn, fps = 60) {
    const STEP = 1 / fps;
    let last = performance.now();
    let accu = 0;
    // rafID = pas un timestamp, mais un ID retourné par requestAnimationFrame
    let rafID = 0;

    function frame(now: number) {
        let delta = Math.min((now - last) / 1000, 0.1);
        last = now;

        if (delta > STEP * 2) {
            delta = STEP * 2;
        }

        accu += delta;

        while (accu >= STEP) {
            step(STEP);
            accu -= STEP;
        }

        render(accu / STEP);

        // requestAnimationFrame() passe un timestamp à la fonction de callback (frame)
        rafID = requestAnimationFrame(frame);
    }
    
    rafID = requestAnimationFrame(frame);

    return {
        stop() { cancelAnimationFrame(rafID);
        }
    }
}