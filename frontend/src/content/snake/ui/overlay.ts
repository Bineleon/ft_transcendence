import { el, text }             from "../../home";
import type { SnakeController } from "../controller";
import type { SnakePhase } from "../game/types";

export class domOverlayManager {
    private snakeController: SnakeController;

    constructor(snakeController: SnakeController) {
        this.snakeController = snakeController;
    }

    public bindHTMLElement(phase: SnakePhase): HTMLElement {
        switch (phase) {
            case "START": {
                const b = el("button", "btn-click");
                b.textContent = "START";
                b.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.snakeController.setPhase("PLAYING");
                });
                return b;
            }
            case "PLAYING": {
                return el("div");
            }
            case "PAUSED": {
                const wrap = el("div", "text-center");
                const b1 = el("button", "btn-click");
                b1.textContent = "RESUME";
                b1.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.snakeController.setPhase("PLAYING");
                });
                const b2 = el("button", "btn-click mt-2");
                b2.textContent = "RESTART";
                b2.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.snakeController.setPhase("PLAYING");
                });
                wrap.append(b1, b2);
                return wrap;
            }
            case "GAMEOVER": {
                const wrap = el("div", "text-center");
                const lbl = el("div", "text-xl mb-2");
                lbl.append(text("Game Over!"));

                const b = el("button", "btn-click mt-2");
                b.textContent = "RESTART";
                b.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.snakeController.setPhase("PLAYING");
                });
                wrap.append(lbl, b);
                return wrap;
            }
            default: {
                return el("div");
            }
        }
    }

}

