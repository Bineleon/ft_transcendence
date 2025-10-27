import { el, text } from "./home";

const ball = {
    x: 400,
    y: 300,
    vx: 200, // pixels per second
    vy: 150  // pixels per second
};

function setupCanvas(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
        console.error("Unable to get canvas context");
        return;
    }

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const cssW = 800, cssH = 600;

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    context.scale(dpr, dpr);
}

function update(deltaTime: number) {
    ball.x += ball.vx * deltaTime;
    ball.y += ball.vy * deltaTime; 
}

function render(acc: number) {
    // Dessiner les objets du jeu ici
    // Exemple : effacer le canvas, dessiner la balle, les raquettes, les scores, etc.
}

export function PlayPong(): HTMLElement {
    const main = el("main", "mx-20 relative h-[70vh] flex flex-col items-center min-h-[80dvh] justify-center border-20 ");
    const canvas = el("canvas", "block") as HTMLCanvasElement;
    setupCanvas(canvas);

    const STEP = 1 / 60;    // 60 FPS
    let rafId = 0;          // ID for requestAnimationFrame
    let last = 0;           // dernier timestamp en secondes
    let acc = 0;            // accumulateur de temps (le temps ecoulé non traité)

    /** Le timestamp est calcule directement via le navigateur avec requestAnimationFrame */
    function gameLoop(timestamp: number) {
        /** chaque frame du jeu, on met a jour avant de dessiner */
        let delta = Math.min((timestamp - last) / 1000, 0.1); // en secondes, max 0.1s
        last = timestamp;

        /** On evite les freeze si le jeu est trop lent */
        if (delta > STEP * 2) {
            delta = STEP * 2;
        }

        /** On accumule le temps écoulé */
        acc += delta;

        /** On met à jour le jeu autant de fois que nécessaire */
        while (acc >= STEP) {
            update(STEP);
            acc -= STEP;
        }

        /** Puis on fait le rendu, en fonction du temps écoulé */
        /* acc / STEP : pour lisser le rendu entre deux mises à jour */
        /* ex: si acc = 0.5 * STEP, on est à mi-chemin entre deux updates */
        render(acc / STEP);

        /** Puis on demande le prochain frame */
        rafId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        last = performance.now();
        acc = 0;
        rafId = requestAnimationFrame(gameLoop);
    }

    function stopGame() {
        cancelAnimationFrame(rafId);
    }

    main.append(canvas);
    return main;
}

/*** MEMO **
    var    // antique et dangereux
    let    // moderne et sûr
    const  // encore mieux : valeur non réassignable
 */