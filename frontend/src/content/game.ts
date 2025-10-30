import { el, text } from "./home";

// src/pages/game.ts
export function Game(): HTMLElement {
  const main = el(
    "main", "max-w mx-auto px-6 py-8 pointer-events-auto"
  );
  const grid = el(
    "div",
    "grid gap-4 grid-cols-1 " +
    "md:grid-cols-[260px_1fr_300px] " + // gauche 260px, centre flexible, droite 300px
    "md:auto-rows-min" + // lignes auto, la hauteur totale vient de la somme des 2 boîtes du centre
    "md:grid-rows-[auto_1fr]"
  );

  /*** ENCART DE GAUCHE ***/
  const left = el(
    "aside", "p-4 row-span-2 border-4 border border-black"
  );

  const category = el(
    "h2", "font-jmh text-4xl mb-4"
  );
  category.append(
    text("---- movies & more ----")
  );
  left.append(category);
  const leftTitle = el(
    "h3", "border-4 font-jmh uppercase text-2xl mb-4"
  );
  leftTitle.append(text("Breaking News !"));

  const leftContent = el(
    "p", "font-modern-type text-justify text-xl"
  );
  leftContent.append(
    text("After the incredible success of the story behind the Tetris game, a new movie is in the works, exploring the origins of the legendary game developer Alexey Pajitnov..."),
    el("br"),
    el("br"),
    text("Soon in theaters near you!")
  );

  left.append(leftTitle, leftContent);
  ////////////////////////////////////////////////////

  /*** ENCART DU CENTRE ***/
  /// Partie haute
  const centerTop = el(
    "section", "p-4 border-5 border-double border-gray-400 mb-4"
  );

  const centerTopTitle = el(
    "h2", "font-jmh text-4xl mb-4"
  );
  centerTopTitle.append(
    text("THE FIRST GAME, THE LAST NERVE — INSIDE THE PONG PHENOMENON")
  );

  const centerTopContent = el(
    "p", "font-modern-type text-md"
  );
  centerTopContent.append(
    text("In 1972, Atari revolutionized the gaming world with the release of Pong, the first commercially successful video game. Created by Nolan Bushnell and Al Alcorn, Pong was a simple yet addictive table tennis simulation that captivated players worldwide. Its success laid the foundation for the video game industry, leading to the development of countless games and consoles that followed. Pong's legacy continues to influence modern gaming, reminding us of the humble beginnings of an industry that has become a global phenomenon.")
  );
  centerTop.append(centerTopTitle, centerTopContent);

  /// Partie basse
  const bottomDivider = el(
    "div", "grid grid-cols-1 md:grid-cols-2 gap-4 items"
  );
  const centerBottom = el(
    "section",  "p-4 border-4 border-dashed border-black"
  );
  const centerBottomTitle = el(
    "h2", "font-royalvogue text-2xl mb-4"
  );
  centerBottomTitle.append(
    text("Last Tournament"), el("br"), text("Top 3 Players")
  );
  
  const centerBottomContent = el(
    "ul", "font-modern-type text-md"
  );
  const players = [
    "1. Player One - 1000 points",
    "2. Player Two - 900 points",
    "3. Player Three - 800 points"
  ];
  players.forEach(player => {
    const listItem = el("li", "border-b border-gray-300 py-2");
    listItem.append(text(player));
    centerBottomContent.append(listItem);
  });

  centerBottom.append(centerBottomTitle, centerBottomContent);

  const nextTournament = el(
    "section", "bg-[url('/public/imgs/trame2.png')] bg-cover bg-center text-white font-im-double uppercase text-center text-4xl"
  );
  nextTournament.append(
    text("Next tournament starts"),
    el("br"), // une ligne vide si besoin mettre deux <br>
    text("July 15, 2024")
  );
  bottomDivider.append(centerBottom, nextTournament);
  //////////////////////////////////////////////////////

  /*** ENCART DE DROITE ***/
  const right = el(
    "aside", "p-4 row-span-2 flex flex-col items-center border-8 border border-black"
  );
  const photoTitle = el(
    "h3", "font-jmh text-2xl text-center mb-4"
  );
  photoTitle.append(text("Vertical -Pong- Limit"));
  const photo = el(
    "img", `
    mix-blend-multiply mx-auto grayscale contrast-150 hover:contrast-100
    transition-all duration-500 backdrop-blur-xs block
    [mask-image:url('/public/imgs/trame2.png')]
    [-webkit-mask-image:url('/public/imgs/trame2.png')]
    [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat]
    [mask-size:cover]      [-webkit-mask-size:cover]
    [mask-position:center] [-webkit-mask-position:center]
    `
  ) as HTMLImageElement;
  photo.src = "/public/imgs/pong_ia.png";
  photo.alt = "Pong Phone Game Photo";

  const playButton = el(
    "a", "mt-6 bg-black text-white px-6 py-3 font-modern-type text-xl hover:bg-gray-800"
  ) as HTMLAnchorElement;
  playButton.href = "#/gameon";
  playButton.append(text("Play Pong"));
  right.append(photoTitle, photo, playButton);
  ////////////////////////////////////////////////

  /*** ASSEMBLAGE ***/
  grid.append(left, centerTop, right, bottomDivider);
  main.append(grid);
  return main;
}


/** MEMO **
-webkit : préfixe pour compatibilité avec les navigateurs basés sur WebKit (Safari, anciennes versions de Chrome)

*/