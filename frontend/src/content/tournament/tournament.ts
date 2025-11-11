import { el, text } from "../home.ts";

export function ChoseTournament(): HTMLElement {
    const main = el("div", "grid grid-rows-[auto,1fr] gap-6 p-4");
/********* HEADER SECTION *********/
    const header = el("div", "grid gap-4 grid-cols-[25%_50%_25%] w-fit mx-auto");
// 1) Total Played Tournaments
    const boxPlayed = el("div", `box-dark img-newspaper -mx-4 in-dark-box grid grid-cols-2
        justify-items-center items-center -gap-1
        flex-wrap p-0 flex-col`);
    const number =  el("div", "font-modern-type text-6xl");
    number.append(text("3000"));
    const playedLabel = el("div", "text-sm uppercase self-center whitespace-pre-line");
    playedLabel.append(text("Played\nTournaments\nSo Far"));
    boxPlayed.append(number, playedLabel);

    // 2) Top Player
    const best = el("div", "mix-blend-multiply relative grid grid-cols-3 gap-6 mb-6 items-center justify-items-center");
    const bestPlayer = el("div", "whitespace-pre-line font-jmh");
    bestPlayer.append(text(`Best Tournament Player is :

        Congratulations to the Champion!`));
    const profilePic = el("img", "relative h-auto w-auto max-h-24 max-w-24") as HTMLImageElement;
        profilePic.src = "/public/imgs/trophy.png";
    const cupIcon = el("img", "relative h-auto w-auto max-h-24 max-w-24") as HTMLImageElement;
        cupIcon.src = "/public/imgs/trophy.png";

// 3) Tournament Code        
    const tournamentCode = el("div", "box-dark img-newspaper text-white text-center text-2xl -m-4 font-im-double uppercase");
    tournamentCode.append(text(`Enter your Tournament Code Here`));
    const codeInput = el("input", "btn-input") as HTMLInputElement;
    codeInput.type = "text";
    codeInput.placeholder = "Tournament Code";
    tournamentCode.append(codeInput);
    
    best.append(profilePic, bestPlayer, cupIcon);
    header.append(boxPlayed, best, tournamentCode);

/********* SPACER *********/
    const spacer = el("div", "w-full border-b bg-black");

/********* MAIN CONTENT SECTION *********/

/********* DETAILS SECTION *********/
/*** Tournaments Styles ***/
    const tournaments = el("div", "whitespace-pre-line grid grid-cols-1 md:grid-cols-[32%_36%_32%] gap-6");
// 1) Ladder
    const ladder = el("div", "items-center");
    const ladderTitle = el("h2", "font-im-great uppercase text-3xl mb-4 flex justify-center tracking-widest");
    ladderTitle.append(text("King of the Hill"));
    const ladderSubtitle = el("h3", "font-im-great text-xl mb-4");
    ladderSubtitle.append(text("The Arcade Never Sleeps"));
    ladderTitle.append(ladderSubtitle);
    const ladderContent = el("ul", "article-sm");
    ladderContent.append(text(`
        Ah, the King of the Hill — a time-limited, challenge-based brawl for supremacy.
It’s inspired by the golden age of arcades, when a single player would dominate the machine, token after token, until the staff yelled “closing time!”.

How It Works
The tournament creator sets two limits:
• Duration (how long the arcade is “open”)
• Max matches per player (to keep it fair)

Players can challenge anyone above them on the board.

When a lower-ranked player wins, they swap places with the loser.

Lose too often, and you fall fast down the hill.

When time runs out, the arcade shutters roll down, the neon lights flicker off, and the player on top becomes the King (or Queen) of the Arcade.

The End
At the final buzzer, no more matches can be played.
“The arcade is closed. The high score freezes. Long live tonight’s King of the Hill!”

Fun Fact
The term “King of the Hill” originally described a 19th-century children’s game — kids would fight to stand on a mound of dirt, pushing everyone else off. The modern version? Same energy, fewer bruises.` ));
    ladder.append(ladderTitle, ladderSubtitle, ladderContent);

// 2) Classic
    const classic = el("div", "items-center");
    const classicTitle = el("h2", "font-im-great uppercase text-3xl mb-4 flex justify-center tracking-widest");
    classicTitle.append(text("Classic"));
    const classicSubtitle = el("h3", "font-im-great text-xl mb-4");
    classicSubtitle.append(text("The Pong Grand Prix"));
    const classicContent = el("ul", "article-base");
    classicContent.append(text(`
        For those who crave pure, old-school competition — no politics, no rankings, no mercy.
The Classic is your straightforward single-elimination bracket: lose once and you’re out, win every match and you’re immortal.

How It Works
The creator sets up a bracket with 4, 8, 16, or 32 players.

Matchups are randomly drawn at the start.

Winners move forward, losers grab popcorn.

The final two face off for eternal bragging rights.

It’s fast, fair, and perfect for events or live nights when you want that “who’s the best right now?” energy.

“Two enter. One leaves. Pong decides.”

Fun Fact
Single-elimination tournaments date back to ancient Greece, used for gladiatorial contests and chariot races. The losers didn’t always get second chances back then either.` ));
    classic.append(classicTitle, classicSubtitle, classicContent);

// 3) Gauntlet
    const gauntlet = el("div", "items-center");
    const gauntletTitle = el("h2", "font-im-great uppercase text-3xl mb-4 flex justify-center tracking-widest");
    gauntletTitle.append(text("Gauntlet"));
    const gauntletSubtitle = el("h3", "font-im-great text-xl mb-4");
    gauntletSubtitle.append(text("Run the Table, Survive the Madness"));
    const gauntletContent = el("ul", "article-base");
    gauntletContent.append(text(`
        The Gauntlet pits a single Challenger against everyone else, one match at a time, until exhaustion or defeat takes them.
It’s brutal, glorious, and perfect for testing endurance and pride.

How It Works
One player starts as the Challenger.

They face each opponent in a set order (random or ranked).

Win and continue to the next opponent.

Lose and the next Challenger steps in.

The Gauntlet ends when every opponent has fallen, or when the machine finally cools down.

Fun Fact
The phrase “run the gauntlet” comes from a 15th-century military punishment: soldiers were forced to run between two rows of comrades who hit them with sticks.
In this mode, it’s just digital sticks — but the feeling’s about the same.

“Survive the line. Beat them all. Become the stuff of Pong legend.”` ));
    gauntlet.append(gauntletTitle, gauntletSubtitle, gauntletContent);

    tournaments.append(ladder, classic, gauntlet);
    main.append(header, spacer, tournaments);
    return main;
}