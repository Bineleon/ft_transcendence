
// Mise en place d'un systeme de blocage des interactions externes au jeu
// Empêche le scroll de la page, le context menu, les interactions hors canvas
// Gère le curseur (visible / masqué / pointer lock)

export type GameGuards = {
    enable(): void;
    disable(): void;
    lockPointer(): void;
    unlockPointer(): void;
}

// les key 'Code' permettent d'identifier les touches par position physique, contrairement a 'key'
// Adaptabilité clavier (AZERTY/QWERTY) 
export function createGameGuards(canvas: HTMLCanvasElement): GameGuards {

    let active = false;
    const defaultSnakeControls: Record<string, { code: string; down: boolean }> = {
            up:    { code: "ArrowUp",    down: false },
            down:  { code: "ArrowDown",  down: false },
            left:  { code: "ArrowLeft",  down: false },
            right: { code: "ArrowRight", down: false },
            pause: { code: "Space",      down: false },
            escape:{ code: "Escape",     down: false }
        };

    const defaultSnakeKeyCodes: Set<string> = new Set(
        Object.values(defaultSnakeControls).map((c) => c.code)
    );

    const onKeyDown = (e: KeyboardEvent) => {
        if (!active) return;
        if (defaultSnakeKeyCodes.has(e.code)) { e.preventDefault(); return;} e.preventDefault(); e.stopPropagation(); };
        
    const onKeyUp = (e: KeyboardEvent) => {
        if (!active) return;
        if (defaultSnakeKeyCodes.has(e.code)) { e.preventDefault(); return;} e.preventDefault(); e.stopPropagation(); };
    const onWheel = (e: WheelEvent) => {
        if (!active) return;
        e.preventDefault(); e.stopPropagation(); };

    const onTouchMove = (e: TouchEvent) => {
        if (!active) return;
        e.preventDefault(); e.stopPropagation(); };
    
    const onContextMenu = (e: MouseEvent) => {
        if (!active) return;
        e.preventDefault(); e.stopPropagation(); };

    const onClickCapture = (e: MouseEvent) => {
        if (!active) return;
        if (e.target !== canvas) { e.preventDefault(); e.stopPropagation(); }};
    
    const onPopState = (e: PopStateEvent) => {
        if (!active) return;
        e.preventDefault(); history.pushState(null, '', location.href); };

    const enable = () => {
        if (active) return;
        active = true;

        document.body.classList.add("no-scroll");
        canvas.classList.add("hide-cursor");
        canvas.style.touchAction = "none";

        window.addEventListener('keydown', onKeyDown, { capture: true });
        window.addEventListener('keyup', onKeyUp, { capture: true });
        window.addEventListener('wheel', onWheel, { capture: true });
        window.addEventListener('touchmove', onTouchMove, { capture: true });
        window.addEventListener('contextmenu', onContextMenu, { capture: true });
        window.addEventListener('click', onClickCapture, { capture: true });
        window.addEventListener('popstate', onPopState);

        // Verrouiller le pointeur si possible
        if (canvas.requestPointerLock) {
            canvas.requestPointerLock();
        }
    };

    const disable = () => {
        if (!active) return;
        active = false;

        document.body.classList.remove("no-scroll");
        canvas.classList.remove("hide-cursor");
        canvas.style.touchAction = "";

        window.removeEventListener('keydown', onKeyDown, { capture: true });
        window.removeEventListener('keyup', onKeyUp, { capture: true });
        window.removeEventListener('wheel', onWheel, { capture: true });
        window.removeEventListener('touchmove', onTouchMove, { capture: true });
        window.removeEventListener('contextmenu', onContextMenu, { capture: true });
        window.removeEventListener('click', onClickCapture, { capture: true });
        window.removeEventListener('popstate', onPopState);

        if (document.pointerLockElement) document.exitPointerLock();
    };

    const lockPointer = () => {
        if (canvas.requestPointerLock) canvas.requestPointerLock();
    };

    const unlockPointer = () => {
        if (document.exitPointerLock) document.exitPointerLock();
    };

    return { enable, disable, lockPointer, unlockPointer };
}



/////// 
// Fonction Flechee : () => {}
// ///////
// Exemple :
// const onKeyDown = (e: KeyboardEvent) => {
//     if (!active) return;
//     if (pongKeysCodes.has(e.code)) {
//         e.preventDefault();
//         e.stopPropagation();
//     }
// };
///////
// On declare une "variable constante" qui contient une fonction flechee.
// Donc onKeyDown n'est pas une valeur comme un nombre ou une chaine de caractere,
// mais une fonction qui peut etre appelee plus tard.
// /////// (un peu comme un "pointeur de fonction" en C/C++)