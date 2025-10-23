import { el } from "./home";

export function PlayPong(): HTMLElement {
    const main = el("main", "mx-20 relative h-screen[70%] bg-[url('/public/imgs/trame4.png')] bg-black/40 bg-cover bg-center bg-blend-overlay flex flex-col items-center min-h-[80dvh] justify-center ");

    return main;
} 