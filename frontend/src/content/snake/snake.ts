// import { el } from "../home";
import { createSnakeView } from "./ui/view";
import { SnakeController } from "./controller";

// function instructions(): HTMLElement {
//     const instrContainer = el("div", "mb-6 items-center");
//     const instrTitle = el("h2", "text-3xl font-jmh mb-4");
//     instrTitle.append(document.createTextNode("Snake Game Instructions"));
//     const instrList = el("ul", "list-disc list-inside font-modern-type text-lg");
    
//     const instructions = [
//         "Use the arrow keys to control the direction of the snake (Up, Down, Left, Right).",
//         "Eat the food that appears on the screen to grow your snake and earn points.",
//         "Avoid running into the walls or into yourself, as this will end the game.",
//         "Try to achieve the highest score possible!"
//     ];
    
//     instructions.forEach(instr => {
//         const listItem = el("li") as HTMLLIElement;
//         listItem.append(document.createTextNode(instr));
//         instrList.appendChild(listItem);
//     });
    
//     instrContainer.append(instrTitle, instrList);
//     return instrContainer;
// }

export function PlaySnake(): HTMLElement {
    const view = createSnakeView();
    const controller = new SnakeController({view});

    controller.boot();

    return view.main;
}
