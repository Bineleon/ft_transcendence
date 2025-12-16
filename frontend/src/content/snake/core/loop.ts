import type { SnakeController } from "../controller";

export function startLoop(ctrl: SnakeController, fps = 6): void {
  const anyCtrl = ctrl as any;
  if (anyCtrl.__loopId != null) return;

  anyCtrl.__loopId = window.setInterval(() => {
    ctrl.tick();
  }, Math.floor(1000 / fps));
}

export function stopLoop(ctrl: SnakeController): void {
  const anyCtrl = ctrl as any;
  if (anyCtrl.__loopId == null) return;
  window.clearInterval(anyCtrl.__loopId);
  anyCtrl.__loopId = null;
}
