import { setupCanvas }     from "../core/canvas";
import { createState }     from "../game/state";
import { update }           from "./update";

export type Controls = {
    start: () => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    exit: () => void;
};

const 

const keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false,
    space: false,
} as Record<string, boolean>;

function keyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    if (e.key in keys) {
        keys[e.key] = true;
    }
    if (e.key === "Escape") {
        if (document.pointerLockElement === canvas) {
            document.exitPointerLock();
            controls.pause();
        }
    }
}

function keyUp(e: KeyboardEvent) {
    if (e.key in keys) {
        keys[e.key] = false;
    }
}

function step(delta: number) {
    update(state, delta);
}