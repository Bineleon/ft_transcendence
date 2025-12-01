// import { el } from "../home";
import { createSnakeView } from "./ui/view";
import { SnakeController } from "./controller";

export function PlaySnake(): HTMLElement {
    const view = createSnakeView();
    const controller = new SnakeController({view});

    controller.boot();

    return view.main;
}
