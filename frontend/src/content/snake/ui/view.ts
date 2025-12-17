import { el, text, techList } from "../../home";

export type SnakeViewWindow = {
  main: HTMLElement;
  leftPanel: HTMLDivElement;
  gameContainer: HTMLDivElement;
  canvasWorld: HTMLCanvasElement;
  frameP1: HTMLDivElement;
  canvasP1: HTMLCanvasElement;
  frameP2: HTMLDivElement;
  canvasP2: HTMLCanvasElement;
  hudLayer: HTMLDivElement;
  playersBox: HTMLDivElement;
  overlayRoot: HTMLDivElement;
  overlayBox: HTMLDivElement;
};

const WORLD_COLS = 34;
const WORLD_ROWS = 24;

const P1 = { x: 1, y: 1, w: 10, h: 10 };
const P2 = { x: 23, y: 13, w: 10, h: 10 };

function slotFromGrid(b: { x: number; y: number; w: number; h: number }): string {
  return `col-start-${b.x + 1} col-end-${b.x + b.w + 1} row-start-${b.y + 1} row-end-${b.y + b.h + 1}`;
}

export function rules(title: string, contents: string): HTMLElement {
    const section = el("section", "space-y-2");
    const secTitle = el("h3", `font-royalvogue bg-black text-white pl-2 text-sm xxl:text-lg uppercase `, text(title));
    const secContent = el("p", "font-arcade text-sm xxl:text-lg text-center", text(contents));
    section.append(secTitle, secContent);
    return section;
}

export function createSnakeView(): SnakeViewWindow {
  const main = el("div", "w-full h-full p-4 flex gap-4");


  /// LES RGLES DU JEU ///
  const leftPanel = el("div", "w-[320px] pr-6 mt-2", el("h2", "font-bold mb-2"),
    el("div", "text-sm leading-tight")) as HTMLDivElement;
  const leftPanelContent = el("div", "flex flex-col gap-4 whitespace-pre-line");
  const snakeTitle = el("h3", "font-omegle text-6xl text-center", text("CrossWord Snake"));
  const instructions1 = rules("Goal", `Finish the most words or make your opponent lose all 3 lives.`);
  const instructions2 = el("section", "space-y-2");
  const secTitle = el("h3", `font-royalvogue bg-black text-white pl-2 text-sm xxl:text-lg uppercase `, text("Controls"));
  const secContent = el("img", "img-newspaper");
  secContent.src = "imgs/controls.png";
  instructions2.append(secTitle, secContent);
  const instructions3 = rules("Lives", `Each player starts with 3 lives. Hitting your own body costs 1 life. The opponent’s snake is harmless.`);
  const instructions5 = rules("Crossword", `Eating a letter fills a shared crossword cell. Completing a word locks it in your color (P1: white on black, P2: black on white).`);
  const instructions6 = rules("Game flow", `START → 2sec. → PLAYING

    DEATH → RESPAWN → 2sec. → PLAYING`);
  leftPanelContent.append(snakeTitle, instructions1, instructions2, instructions3, instructions5, instructions6);
  leftPanel.append(leftPanelContent);

  const gameContainer = el("div", "relative flex-1 p-1 m-5 my-auto border-[20px] border-black") as HTMLDivElement;

  const ratio = el("div", "relative w-full") as HTMLDivElement;
  ratio.style.aspectRatio = `${WORLD_COLS} / ${WORLD_ROWS}`;
  const layout = el("img", "absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply") as HTMLImageElement;
  layout.src = "/snake/Layout.png";
  layout.alt = "layout";
  layout.style.objectFit = "fill";
  layout.style.opacity = "1"; // ajuste si besoin
  ratio.append(layout);

  const grid = el("div", "absolute inset-0 grid") as HTMLDivElement;
  grid.style.gridTemplateColumns = `repeat(${WORLD_COLS}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${WORLD_ROWS}, 1fr)`;

  const hudLayer = el("div", "absolute inset-0 grid pointer-events-none") as HTMLDivElement;
  hudLayer.style.gridTemplateColumns = `repeat(${WORLD_COLS}, 1fr)`;
  hudLayer.style.gridTemplateRows = `repeat(${WORLD_ROWS}, 1fr)`;

  const canvasWorld = el("canvas", "absolute inset-0 w-full h-full mix-blend-multiply") as HTMLCanvasElement;
  const canvasP1 = el("canvas", "absolute inset-0 w-full h-full mix-blend-multiply") as HTMLCanvasElement;
  const canvasP2 = el("canvas", "absolute inset-0 w-full h-full mix-blend-multiply") as HTMLCanvasElement;

  const frameP1 = el("div", `relative ${slotFromGrid(P1)} pointer-events-none`) as HTMLDivElement;
  const frameP2 = el("div", `relative ${slotFromGrid(P2)} pointer-events-none`) as HTMLDivElement;

  const overlayRoot = el("div", "absolute inset-0 pointer-events-none") as HTMLDivElement;
  const overlayBox = el("div", "absolute inset-0 flex items-center justify-center pointer-events-auto") as HTMLDivElement;
  overlayRoot.append(overlayBox);

  const playersBox = el("div", "absolute bottom-2 left-2 text-xs bg-white/80 border border-black px-2 py-1") as HTMLDivElement;


  ratio.append(grid, canvasWorld, canvasP1, canvasP2, hudLayer, overlayRoot, playersBox, frameP1, frameP2);
  gameContainer.append(ratio);

  main.append(leftPanel, gameContainer);

  return {
    main,
    leftPanel,
    gameContainer,
    canvasWorld,
    frameP1,
    canvasP1,
    frameP2,
    canvasP2,
    hudLayer,
    playersBox,
    overlayRoot,
    overlayBox,
  };
}
