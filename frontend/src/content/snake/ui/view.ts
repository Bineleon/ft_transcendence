import { el } from "../../home";
import { createSnakeCanvas } from "../core/canvas";
import { LAYOUT } from "./layoutMap";

export interface SnakeViewWindow {
  main: HTMLElement;
  frameP1: HTMLDivElement;
  frameP2: HTMLDivElement;
  canvasP1: HTMLCanvasElement;
  canvasP2: HTMLCanvasElement;
  overlay: HTMLElement;
}

export function createSnakeView(): SnakeViewWindow {
const main = el("div", "relative w-full max-w-[1100px] mx-auto overflow-hidden mix-blend-multiply");
(main as HTMLDivElement).style.aspectRatio = "1536 / 1024";

  // ✅ Background image (ton background.png)
  // Mets le fichier dans /public/imgs/background.png par ex.
  main.classList.add(
    "bg-[url('/imgs/snake/layout.png')]",
    "bg-cover",          // ou bg-contain si tu veux absolument zéro crop
    "bg-center",
    "bg-no-repeat"
  );

  // slots (cadres)
  const frameP1 = slotDiv(LAYOUT.topLeft);
  const frameP2 = slotDiv(LAYOUT.botRight);

  // canvases
  const canvasP1 = createSnakeCanvas();
  canvasP1.className = "absolute inset-0 w-full h-full";
  frameP1.appendChild(canvasP1);

  const canvasP2 = createSnakeCanvas();
  canvasP2.className = "absolute inset-0 w-full h-full";
  frameP2.appendChild(canvasP2);

  // overlay global
  const overlayRoot = el("div", "absolute inset-0 grid place-items-center pointer-events-none");
  const overlayBox = el("div", "pointer-events-auto");
  overlayRoot.appendChild(overlayBox);

  // assemble
  main.append(frameP1, frameP2, overlayRoot);

  return { main, frameP1, frameP2, canvasP1, canvasP2, overlay: overlayBox };
}

function slotDiv(b: { x:number; y:number; w:number; h:number }): HTMLDivElement {
  const d = document.createElement("div");
  d.className = "absolute";
  d.style.left = `${b.x * 100}%`;
  d.style.top  = `${b.y * 100}%`;
  d.style.width  = `${b.w * 100}%`;
  d.style.height = `${b.h * 100}%`;

  // Optionnel: si tu veux “bloquer” le slot en carré exact
  // d.classList.add("aspect-square");

  // Optionnel: debug (à enlever ensuite)
  // d.classList.add("ouP1ine", "ouP1ine-1", "ouP1ine-red-500/50");

  return d;
}
