import { el, text } from "./home";
export function PlayPong(): HTMLElement {
    const main = el("main", "flex flex-col items-center justify-center bg-black");
    const title = el("h1", "text-6xl font-jmh text-white mb-8");
    title.append(text("Play Pong Game"));
    main.append(title);

    return main;
} 