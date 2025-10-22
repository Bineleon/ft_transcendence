import { el } from "./home";

export function profile(): HTMLElement {
    const main = el("main", "p-4");
    const section = el("section", "grid grid-cols-1 grid-rows-1 md:grid-cols-2 grid-rows-2 gap-6");

    
    const picture = el("img", "w-full h-auto");

   section.append(picture);
   main.append(section);
   return main;
}
