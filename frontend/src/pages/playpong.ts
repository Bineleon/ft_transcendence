import { el, text } from "./home";
export function PlayPong(): HTMLElement {
    const main = el("main", "relative bg-[url('/public/imgs/trame2.png')] bg-cover bg-center bg-white/40 bg-blend-overlay flex flex-col items-center h-screen justify-center ");
    const title = el("h1", "text-6xl font-jmh text-white mb-8");
    title.append(text("Play Pong Game"));
    main.append(title);

    return main;
} 