import type { SnakeController } from "../controller";
import type { Controls, Direction } from "../game/uiTypes";

/**
 * Expose des wrappers pour les fonctions liées aux contrôles et à la
 * protection des flèches. Chaque fonction délègue à l'instance
 * SnakeController fournie. Cette séparation favorise une meilleure
 * organisation du code.
 */

export function createControls(): Controls {
    return {
      p1Up: { code: "KeyW", down: false },
      p1Down: { code: "KeyS", down: false },
      p1Left: { code: "KeyA", down: false },
      p1Right: { code: "KeyD", down: false },

      p2Up: { code: "ArrowUp", down: false },
      p2Down: { code: "ArrowDown", down: false },
      p2Left: { code: "ArrowLeft", down: false },
      p2Right: { code: "ArrowRight", down: false },

      pause: { code: "Space", down: false },
      escape: { code: "Escape", down: false },
    };
}

export function wireControls(ctrl: SnakeController): void {
  ctrl.wireControls();
}

export function unwireControls(ctrl: SnakeController): void {
  ctrl.unwireControls();
}

// export function enableArrowGuard(ctrl: SnakeController): void {
//   ctrl.enableArrowGuard();
// }

export function disableArrowGuard(ctrl: SnakeController): void {
  ctrl.disableArrowGuard();
}

// export function onKeyDown(ctrl: SnakeController, e: KeyboardEvent): void {
//   ctrl.onKeyDown(e);
// }

// export function onKeyUp(ctrl: SnakeController, e: KeyboardEvent): void {
//   ctrl.onKeyUp(e);
// }

export function applyDirectionsFromControls(ctrl: SnakeController): void {
  ctrl.applyDirectionsFromControls();
}

export function pickDirFrom4(
  ctrl: SnakeController,
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean
): Direction | null {
  return ctrl.pickDirFrom4(up, down, left, right);
}

