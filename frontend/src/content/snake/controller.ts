import type { SnakeViewWindow } from "./ui/view";
import type { SnakeState, Controls, SnakePhase } from "./game/types";
import { domOverlayManager } from "./ui/overlay";
import { GameLoop } from "../pong/core/loop";
import { createGameGuards, type GameGuards } from "../pong/game/guards"; 
import { resizeSnake, COLS, ROWS, TILE } from "./core/canvas";
import { randomLetter } from "./game/utils";
import { stepSnake } from "./core/logic";

export class SnakeController {
    public view: SnakeViewWindow;
    public context: CanvasRenderingContext2D;
    public state: SnakeState;
    public overlay: domOverlayManager;
    private loopCtrl: { stop: () => void } | null = null;
    private gameGuards: GameGuards;
    public snakeControls: Controls = {
        up:    { code: "ArrowUp",    down: false },
        down:  { code: "ArrowDown",  down: false },
        left:  { code: "ArrowLeft",  down: false },
        right: { code: "ArrowRight", down: false },
        pause: { code: "Space",      down: false },
        escape:{ code: "Escape",     down: false }
    };

    constructor(opts: { view: SnakeViewWindow }) {
        this.context = opts.view.canvas.getContext("2d")!;
        this.view = opts.view;

        const startX = Math.floor(COLS / 2);
        const startY = Math.floor(ROWS / 2);
        this.state = {
            world: { w: COLS, h: ROWS },
            snake: [
                { x: startX,     y: startY,     letter: "S" },
                { x: startX - 1, y: startY,     letter: "N" },
                { x: startX - 2, y: startY,     letter: "A" },
            ],
            dir: { x: 1, y: 0 },
            eatable: { x: 5, y: 5, letter: randomLetter(), },
            phase: "START"
        };
        this.overlay = new domOverlayManager(this);
        this.gameGuards = createGameGuards(this.view.canvas);
        
        resizeSnake(this.view.canvas, this.view.snakeContainer, this.state);
        window.addEventListener("resize", () => {
            resizeSnake(this.view.canvas, this.view.snakeContainer, this.state);
            this.draw();
        });
    }

    private onKeyDown = (e: KeyboardEvent) => {
        const { code } = e;
        const c = this.snakeControls;

        if (e.key === c.up.code)    c.up.down = true;
        if (e.key === c.down.code)  c.down.down = true;
        if (e.key === c.left.code)  c.left.down = true;
        if (e.key === c.right.code) c.right.down = true;
        if (code === c.pause.code) c.pause.down = true;
        if (code === c.escape.code)c.escape.down = true;

        if (c.up.down) this.state.dir = { x: 0, y: -1 };
        if (c.down.down) this.state.dir = { x: 0, y: 1 };
        if (c.left.down) this.state.dir = { x: -1, y: 0 };
        if (c.right.down) this.state.dir = { x: 1, y: 0 };

        switch (this.state.phase) {
            case "PLAYING":
                if (code === c.pause.code || code === c.escape.code) {
                    this.setPhase("PAUSED");
                }
                break;
            case "PAUSED":
                if (code === c.pause.code) {
                    this.setPhase("PLAYING");
                }
                break;
        }
    };

    private onKeyUp = (e: KeyboardEvent) => {
        const { code } = e;
        const c = this.snakeControls;

        if (code === c.up.code)    c.up.down = false;
        if (code === c.down.code)  c.down.down = false;
        if (code === c.left.code)  c.left.down = false;
        if (code === c.right.code) c.right.down = false;
        if (code === c.pause.code) c.pause.down = false;
        if (code === c.escape.code)c.escape.down = false;
    };

    private clearKeys() {
        for (const k in this.snakeControls) (this.snakeControls as any)[k].down = false;
    }

    private wireControls() {
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }

    private unwireControls() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
    }

    public setPhase(phase: SnakePhase) {
        this.state.phase = phase;
        
        if (phase === "PLAYING") {
            this.gameGuards.enable();
        } else {
            this.gameGuards.disable();
        }

        switch (phase) {
            case "START":
                this.view.overlay.replaceChildren(this.overlay.bindHTMLElement(phase));
                this.unwireControls();
                break;
            case "PLAYING":
                this.wireControls();
                this.startGame();
                this.view.overlay.replaceChildren(this.overlay.bindHTMLElement(phase));
                break;
            case "PAUSED":
                this.pauseGame();
                this.view.overlay.replaceChildren(this.overlay.bindHTMLElement(phase));
                break;
            case "GAMEOVER":
                this.view.overlay.replaceChildren(this.overlay.bindHTMLElement(phase));
                this.unwireControls();
                this.resetGame();
                break;
        }
    }

    private draw() {
        const ctx = this.context;
        const { snake, eatable, world } = this.state;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, world.w * TILE, world.h * TILE);

        // draw eatable
        ctx.fillStyle = "gray";
        ctx.font = `${TILE}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            eatable.letter,
            (eatable.x + 0.5) * TILE,
            (eatable.y + 0.5) * TILE
        );

        // serpent
        ctx.fillStyle = "black";
        for (const seg of snake) {
            ctx.fillText(
            seg.letter,
            (seg.x + 0.5) * TILE,
            (seg.y + 0.5) * TILE
            );
        }
    }

    private startGame() {
        if (this.loopCtrl) return;

        this.loopCtrl = GameLoop(
            (_dt: number) => {
                if (this.state.phase === "PLAYING") {
                stepSnake(this); // 1 case par tick
                }
            },
            (_alpha: number) => {
                this.draw();
            },
            2,
        );
    }

    private pauseGame() {
        if (this.loopCtrl) {
            this.loopCtrl.stop();
            this.loopCtrl = null;
        }
    }

    private resetGame() {
        if (this.loopCtrl) {
            this.loopCtrl.stop();
            this.loopCtrl = null;
        }
        this.state.snake = [
            { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), letter: "S" },
            { x: Math.floor(COLS / 2) - 1, y: Math.floor(ROWS / 2), letter: "N" },
            { x: Math.floor(COLS / 2) - 2, y: Math.floor(ROWS / 2), letter: "A" },
        ];
        this.state.dir = { x: 1, y: 0 };
        this.state.eatable = { x: 5, y: 5, letter: randomLetter() };
        this.clearKeys();
    }

    public boot() {
        this.setPhase("START");
    }
}