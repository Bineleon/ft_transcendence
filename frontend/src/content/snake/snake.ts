import { createSnakeView } from "./ui/view";
import { SnakeController } from "./controller";
import { loadWordDefsFromMap } from "./game/wordParser";

export function PlaySnake(): HTMLElement {
  const view = createSnakeView();

  // view.overlayRoot.textContent = "Loading...";

  loadWordDefsFromMap("/snake/map.txt")
    .then((wordDefs) => {
      const controller = new SnakeController(view, wordDefs);
      controller.boot();
    })
    .catch((err) => {
      console.error(err);
      view.overlayRoot.textContent = "Map error (check /public/snake/map.txt)";
    });

  return view.main;
}
