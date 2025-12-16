import type { GamePhase } from "../game/uiTypes";

export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Unable to get canvas context");
        return null as unknown as CanvasRenderingContext2D;
    }

    canvas.dataset.phase = "START" as GamePhase

    function resize() {
        const parent = canvas.parentElement as HTMLElement | null;
        const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
        const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
        const cssW = Math.max(1, Math.floor(rect.width));
        const cssH = Math.max(1, Math.floor(rect.height));

        canvas.style.width = cssW + "px";
        canvas.style.height = cssH + "px";

        const backingW = Math.floor(cssW * dpr);
        const backingH = Math.floor(cssH * dpr);
        if (canvas.width !== backingW || canvas.height !== backingH) {
            canvas.width = backingW;
            canvas.height = backingH;
        }

    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(resize);
        ro.observe((canvas.parentElement as HTMLElement) ?? canvas);
    } else {
        // Fallback to debounced window resize
        let t: number | null = null;
        addEventListener("resize", () => {
            if (t !== null) window.clearTimeout(t);
            t = window.setTimeout(() => {
                resize();
                t = null;
            }, 50);
        });
    }

    return ctx;
}
