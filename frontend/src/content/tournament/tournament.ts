import { el, text } from "../home.ts";
import { makeP, injectWrapBox } from "../utils/editing.ts";
import { pongAlert, runAuthBox } from "../utils/alertBox.ts";
import { createDBTournament, notLoggedIn, getLoggedName } from "../utils/todb.ts";


export type tournamentMode = "KING" | "CLASSIC" | "GAUNTLET";

interface NumberOfPlayers {
    maxParticipants: number[];
}

const PlayersLimits: Record<tournamentMode, NumberOfPlayers> = {
    KING: { maxParticipants: [4, 5, 6, 7, 8, 9, 10] },
    CLASSIC: { maxParticipants: [4, 8, 16] },
    GAUNTLET: { maxParticipants: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
};

const KING_TIME_CHOICES = [
  { minutes: 15, label: "15 minutes", img: "/imgs/15.png" },
  { minutes: 30, label: "30 minutes", img: "/imgs/30.png" },
  { minutes: 45, label: "45 minutes", img: "/imgs/45.png" },
  { minutes: 60, label: "60 minutes", img: "/imgs/60.png" },
];

// Envoyer a la Back
export interface TournamentFormDatas {
    tName: string;
    creatorName: string;
    tMode: tournamentMode;
    maxParticipants: number;
    kingMaxTime?: number;
    kingMaxRounds?: number;
}

interface TournamentSettings {
    form : HTMLFormElement;
    nameInput : HTMLInputElement;
    
    participantsButton: HTMLInputElement;
    participantsContainer: HTMLDivElement;

    kingFieldset: HTMLFieldSetElement;
    kingTimeButtonsContainer: HTMLDivElement;
    kingTimeHiddenInput: HTMLInputElement;

    kingRoundsContainer: HTMLDivElement;
    kingRoundsHiddenInput: HTMLInputElement;

    submitButton: HTMLButtonElement;
}

let formEls: TournamentSettings | null = null;
let formDatas: TournamentFormDatas | null = null;
let TMode: tournamentMode | null = null;
let tCode: string | null = null;

export function TournamentFormUI(subscriptionSection: HTMLElement): void {
    TournamentForm(subscriptionSection);
    buildTournamentForm(subscriptionSection);
}

function generateTournamentCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // function checkTournamentCodeExists(code: string) {}
    return code;
}

async function handleGenerateTournament(): Promise<void> {
    if (!formEls) return;
    
    if (((!formEls.nameInput.value.trim() || !formEls.participantsButton.value) && TMode !== "KING") || !TMode) {
        pongAlert("Please fill in all required fields.");
        return;
    }
    else if (TMode === "KING" && (!formEls.kingTimeHiddenInput.value || !formEls.kingRoundsHiddenInput.value)) {
        pongAlert("Please select King of the Hill settings.");
        return;
    }
    getLoggedName().then(async (name) => {
        if (!name) {
            pongAlert("You must be logged in to create a tournament.", "error");
            return;
        }
        if (formEls) {
            formDatas = {
                tName: formEls.nameInput.value.trim(),
                creatorName: name, // À remplacer par l'ID réel de l'utilisateur connecté
                tMode: "CLASSIC",
                maxParticipants: parseInt(formEls.participantsButton.value, 10),
            };
            createDBTournament(generateTournamentCode(), formDatas);
        }
    });
}

function setupKingRoundsSelector(): void {
  if (!formEls) return;

  const container = formEls.kingRoundsContainer;
  const hidden = formEls.kingRoundsHiddenInput;

  container.innerHTML = "";

  const choices = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "INF", label: "∞" }, // valeur envoyée dans le form, affichage signe ∞
  ];

  choices.forEach((choice, index) => {
    const btn = el("button", "btn-participants") as HTMLButtonElement;
    btn.type = "button";
    btn.dataset.value = choice.value;
    btn.append(text(choice.label));

    btn.addEventListener("click", () => {
      hidden.value = choice.value;

      const all = container.querySelectorAll<HTMLButtonElement>(".btn-participants");
      all.forEach(b => {
        b.classList.remove("box-selected", "box-unselected");
      });

      all.forEach(b => {
        if (b === btn) {
          b.classList.add("box-selected");
        } else {
          b.classList.add("box-unselected");
        }
      });
    });

    container.append(btn);

    // Sélection par défaut : 3
    if (choice.value === "0") {
      btn.click();
    }
  });
}


function setupKingTimeSelector(): void {
  if (!formEls) return;

  const container = formEls.kingTimeButtonsContainer;
  const hidden = formEls.kingTimeHiddenInput;

  container.innerHTML = "";

  let selectedMinutes: number | null = null;

  KING_TIME_CHOICES.forEach((choice, index) => {
    const btn = el(
      "button",
      "king-clock relative p-1 flex flex-col items-center"
    ) as HTMLButtonElement;
    btn.type = "button";
    btn.dataset.minutes = String(choice.minutes);

    const img = el(
      "img",
      "block mx-6 w-12 h-12 sm:w-16 sm:h-16"
    ) as HTMLImageElement;
    img.src = choice.img;
    img.alt = choice.label;

    const caption = el(
      "span",
      "king-clock-caption"
    ) as HTMLSpanElement;
    caption.append(text(choice.label));

    btn.append(img, caption);
    container.append(btn);

    const applySelection = () => {
      selectedMinutes = choice.minutes;
      hidden.value = String(choice.minutes);

      const all = container.querySelectorAll<HTMLButtonElement>(".king-clock");
      all.forEach(b => {
        b.classList.remove("king-clock-selected", "king-clock-unselected");
      });

      all.forEach(b => {
        if (b === btn) {
          b.classList.add("king-clock-selected");
        } else {
          b.classList.add("king-clock-unselected");
        }
      });
    };

    btn.addEventListener("click", applySelection);

  });
}


function renderParticipantsOptions(mode: tournamentMode): void {
    if (!formEls) return;

    const container = formEls.participantsContainer;
    const hiddenInput = formEls.participantsButton;

    if (!container || !hiddenInput) return;

    container.innerHTML = "";

    const limits = PlayersLimits[mode];
    if (!limits) return;

    limits.maxParticipants.forEach((count, index) => {
        const btn = el("button", "btn-participants") as HTMLButtonElement;
        btn.type = "button";
        btn.dataset.value = String(count);
        btn.append(text(count.toString()));

        btn.addEventListener("click", () => {
            hiddenInput.value = String(count);

            const all = container.querySelectorAll<HTMLButtonElement>(".btn-participants");
            all.forEach(b => {
                b.classList.remove("box-selected", "box-unselected");
            });

            all.forEach(b => {
                if (b === btn) {
                    b.classList.add("box-selected");
                } else {
                    b.classList.add("box-unselected");
                }
            });
        });
        container.append(btn);

    });
}

function buildTournamentForm(subscriptionSection: HTMLElement): void {
  const form = el("form", "flex flex-col gap-4 mt-6 mx-8") as HTMLFormElement;

  // ---- Nom du tournoi ----
  const nameLabel = el("label", "flex flex-col items-start gap-1");
  const nameSpan = el("span", "form-title");
  nameSpan.append(text("Tournament Name"));
  const nameInput = el("input", "input-tournament px-3 py-2 w-full text-center text-stone-600") as HTMLInputElement;
  nameInput.type = "text";
  nameInput.name = "tournamentName";
  nameInput.placeholder = "";

  nameLabel.append(nameSpan, nameInput);

  // ---- Nombre de participants ----
  const partLabel = el("div", "flex flex-col items-center gap-1");
  const partSpan = el("span", "form-title");
  partSpan.append(text("Number of Participants"));

  const participantsContainer = el("div", "flex flex-wrap gap-auto") as HTMLDivElement;

  const participantsButton = el("input") as HTMLInputElement;
  participantsButton.type = "hidden";
  participantsButton.name = "participants";

  partLabel.append(partSpan, participantsContainer, participantsButton);

  // ---- Champs spécifiques au mode King ----
  const kingFieldset = el("fieldset", "flex flex-col gap-3 mt-4") as HTMLFieldSetElement;

  const kingRow = el("div", "flex flex-col gap-3 sm:flex-row sm:gap-4 w-full") as HTMLDivElement;

  const kingTimeCol = el("div", "flex flex-col items-center gap-2 flex-1") as HTMLDivElement;
  const kingTimeTitle = el("span", "form-title");
  kingTimeTitle.append(text("Max match duration"));

  const kingTimeButtonsContainer = el("div", "flex flex-row flex-wrap gap-3") as HTMLDivElement;

  // Hidden input qui sera envoyé dans le form
  const kingTimeHiddenInput = el("input") as HTMLInputElement;
  kingTimeHiddenInput.type = "hidden";
  kingTimeHiddenInput.name = "kingMaxTime";

  kingTimeCol.append(kingTimeTitle, kingTimeButtonsContainer, kingTimeHiddenInput);

  const kingRoundsCol = el("div", "flex flex-col items-center gap-2 flex-1") as HTMLDivElement;
  const kingRoundsTitle = el("span", "form-title");
  kingRoundsTitle.append(text("Max rounds per player"));

  const kingRoundsContainer = el("div", "flex flex-row flex-wrap gap-2") as HTMLDivElement;

  const kingRoundsHiddenInput = el("input") as HTMLInputElement;
  kingRoundsHiddenInput.type = "hidden";
  kingRoundsHiddenInput.name = "kingMaxRounds";

  kingRoundsCol.append(kingRoundsTitle, kingRoundsContainer, kingRoundsHiddenInput);

  kingRow.append(kingRoundsCol, kingTimeCol);
  kingFieldset.append(kingRow);

  // ---- Bouton final ----
  const submitButton = el("button", "btn-click mt-6 self-center px-6 py-3") as HTMLButtonElement;
  submitButton.type = "button"; // on gère en JS
  submitButton.append(text("Generate Tournament Code"));

  submitButton.addEventListener("click", function () {
    handleGenerateTournament();
  });

  form.append(
    nameLabel,
    partLabel,
    kingFieldset,
    submitButton
  );

  subscriptionSection.append(form);

  // Stocker les éléments
  formEls = {
    form,
    nameInput,
    participantsButton,
    participantsContainer,
    kingFieldset,
    kingTimeButtonsContainer,
    kingTimeHiddenInput,
    kingRoundsContainer,
    kingRoundsHiddenInput,
    submitButton,
  };

  setTournamentMode("CLASSIC");
  setupKingTimeSelector();
  setupKingRoundsSelector();
}

export function TournamentForm(subscriptionSection: HTMLElement): void {
  const modes: { label: string; value: tournamentMode }[] = [
    { label: "King", value: "KING" },
    { label: "Classic", value: "CLASSIC" },
    { label: "Gauntlet", value: "GAUNTLET" },
  ];

  const buttons: HTMLButtonElement[] = modes.map(mode => {
    const isEnabled = mode.value === "CLASSIC";

    const button = el(
      "button",
      `btn-tournament m-2 mt-8 ${!isEnabled ? "opacity-40 cursor-not-allowed" : ""}`
    );

    button.append(text(mode.label));
    button.type = "button";
    button.dataset.mode = mode.value;
    button.disabled = !isEnabled;

    if (isEnabled) {
      button.addEventListener("click", () => {
        setTournamentMode(mode.value);
      });
    }

    return button;
  });

  subscriptionSection.append(...buttons);
}

export function setTournamentMode(mode: tournamentMode): void {
    TMode = mode;

    // Update visual state of mode buttons
    const allButtons = document.querySelectorAll<HTMLButtonElement>(".btn-tournament");
    allButtons.forEach(button => {
        const buttonMode = button.dataset.mode as tournamentMode | undefined;

        // Clean
        button.classList.remove("box-selected", "box-unselected");

        if (buttonMode === TMode) {
            button.classList.add("box-selected");
        } else {
            button.classList.add("box-unselected");
        }
    });

    // Update participants buttons according to the chosen mode
    renderParticipantsOptions(mode);

    // Enable/disable King-of-the-Hill specific options
    if (formEls && formEls.kingFieldset) {
        if (mode === "KING") {
        formEls.kingFieldset.classList.remove("opacity-40");
        (formEls.kingFieldset as any).disabled = false;
        } else {
        formEls.kingFieldset.classList.add("opacity-40");
        (formEls.kingFieldset as any).disabled = true;
        }
    }
}


// export function getTournamentMode(): tournamentMode | null {
//     return TMode;
// }

export function ChoseTournament(): HTMLElement {
    const main = el("div", "grid grid-rows-[auto,1fr] gap-6 p-4");
/********* HEADER SECTION *********/
    const header = el("div", "grid gap-4 grid-cols-[25%_50%_25%] w-fit mx-auto");
// 1) Total Played Tournaments
    const boxKids = el("div", "img-newspaper flex items-center justify-center");
    const photo = el("img", "");
    photo.src = "imgs/pongBoys.jpg";
    boxKids.append(photo);

    // 2) Top Player
    const tCodeBox = el("div", "mix-blend-multiply relative grid grid-cols-3 gap-6 mb-6 items-center justify-items-center text-center");
    const picBox = el("div", "img-newspaper flex items-center justify-center");
    const creators = el("img", "");
    creators.src = "/imgs/creators.jpg";
    picBox.append(creators);

    const bestPlayer = el("div", "whitespace-pre-line font-jmh");
    bestPlayer.append(text(`Best Tournament Player is :

        Congratulations to the Champion!`));
    const profilePic = el("img", "relative h-auto w-auto max-h-24 max-w-24") as HTMLImageElement;
        profilePic.src = "/imgs/trophy.png";
    const cupIcon = el("img", "relative h-auto w-auto max-h-24 max-w-24") as HTMLImageElement;
        cupIcon.src = "/imgs/trophy.png";

// 3) Tournament Code        
    const tournamentCode = el("div", "box-dark img-newspaper text-white text-center text-2xl -m-4 font-im-double uppercase");
    tournamentCode.append(text(`Enter your Tournament Code Here`));
    const inputAndBtn = el("div", "grid grid-cols-[70%_30%] flex justify-center items-center gap-2 mx-auto my-4");
    const codeInput = el("input", "btn-input") as HTMLInputElement;
    codeInput.type = "text";
    codeInput.placeholder = "Tournament Code";
    const codeSubmit = el("button", "btn-click") as HTMLButtonElement;
    codeSubmit.type = "button";
    codeSubmit.append(text("GO"));
    codeSubmit.addEventListener("click", async () => {
        const code = codeInput.value.trim().toUpperCase();
        if (!code) {
            pongAlert("Please enter a tournament code.");
            return;
        }
        window.location.href = `#/tournament/classic/${code}`;
    });
    inputAndBtn.append(codeInput, codeSubmit);

    tournamentCode.append(inputAndBtn);
    
    tCodeBox.append(profilePic, tournamentCode, cupIcon);
    header.append(boxKids, tCodeBox, picBox);

/********* SPACER *********/
    const spacer = el("div", "w-full border-b bg-black");

/********* MAIN CONTENT SECTION *********/

/********* DETAILS SECTION *********/
/*** Tournaments Styles ***/
    const tournaments = el("div", "whitespace-pre-line grid grid-cols-1 md:grid-cols-[33%_34%_33%]");
// 1) king
    const king = el("div", "items-center mx-4");
    const kingTitle = el("h2", "title-hed");
    kingTitle.append(text("King of the Hill"));
    const kingSubtitle = el("h3", "subtitle-hed");
    kingSubtitle.append(text("The Arcade Never Sleeps"));
    kingTitle.append(kingSubtitle);
    const kingContent = el("div", "article-sm");
    kingContent.append(
        makeP(`Ah, the King of the Hill — a time-limited, challenge-based brawl for supremacy.
    It’s inspired by the golden age of arcades, when a single player would dominate the machine, token after token, until the staff yelled “closing time!”.`),
        makeP(`\nHOW IT WORKS`),
        makeP(`- The tournament creator sets two limits:
    Duration (how long the arcade is “open”)
    Max matches per player (to keep it fair)
    - Players can challenge anyone above them on the board.
    - When a lower-ranked player wins, they swap places with the loser.
    - Lose too often, and you fall fast down the hill.
    - When time runs out, the arcade shutters roll down, the neon lights flicker off, and the player on top becomes the King (or Queen) of the Arcade.`),
        makeP(`\nHOW IT ENDS`),
        makeP(`At the final buzzer, no more matches can be played.
    “The arcade is closed. The high score freezes. Long live tonight’s King of the Hill!”`));

    const funfact1 = el("div", "funfact");
    funfact1.append(
        el("p", "italic text-center", text(`-   FUN FACT   -`)),
        el("p", "italic mx-6", text(`The term “King of the Hill” originally described a 19th-century children’s game — kids would fight to stand on a mound of dirt, pushing everyone else off. The modern version? Same energy, fewer bruises.`)),
        );
    kingContent.append(funfact1);

    injectWrapBox(kingContent, {
        atParagraphIndex: 3,
        side: "right",
        width: "w-[60%]",
        margin: "mt-8 mx-4",
        extra: "img-newspaper",
        shape: "circle",
        clearAfter: false,
        kind: "img",
        src: "/imgs/KingOfTheHill.png",
        alt: "Arcade Machine Image"
    });

    king.append(kingTitle, kingSubtitle, kingContent);

// 2) Classic
    const classic = el("div", "items-center mx-4");
    const classicTitle = el("h2", "title-hed");
    classicTitle.append(text("Classic"));
    const classicSubtitle = el("h3", "subtitle-hed");
    classicSubtitle.append(text("The Pong Grand Prix"));
    const classicContent = el("ul", "article-base");
    classicContent.append(
        makeP(`For those who crave pure, old-school competition — no politics, no rankings, no mercy.
    The Classic is your straightforward single-elimination bracket: lose once and you’re out, win every match and you’re immortal.`),
        makeP(`HOW IT WORKS`),
        makeP(`- The creator sets up a bracket with 4, 8, 16, or 32 players.
    - Matchups are randomly drawn at the start.
    - Winners move forward, losers grab popcorn.
    - The final two face off for eternal bragging rights.
    - It’s fast, fair, and perfect for events or live nights when you want that “who’s the best right now?” energy.`),
        makeP(`\nHOW IT ENDS`),
        makeP(`The last player standing is crowned the Classic Champion.
    “Two enter. One leaves. Pong decides.”`));

    const funfact2 = el("div", "funfact");
    funfact2.append(
        el("p", "", text(`-   FUN FACT   -`)),
        el("p", "mx-6", text(`Single-elimination tournaments date back to ancient Greece, used for gladiatorial contests and chariot races. The losers didn’t always get second chances back then either.` )),
        );
    classicContent.append(funfact2);

    injectWrapBox(classicContent, {
        atParagraphIndex: 1,
        side: "center",
        width: "w-[90%]",
        margin: "my-8 mx-4",
        extra: "img-newspaper",
        shape: "none",
        clearAfter: false,
        kind: "img",
        src: "/imgs/Classic.png",
        alt: "Arcade Machine Image"
    });

    classic.append(classicTitle, classicSubtitle, classicContent);

// 3) Gauntlet
    const gauntlet = el("div", "items-center mx-4");
    const gauntletTitle = el("h2", "title-hed");
    gauntletTitle.append(text("Gauntlet"));
    const gauntletSubtitle = el("h3", "subtitle-hed");
    gauntletSubtitle.append(text("Run the Table, Survive the Madness"));
    const gauntletContent = el("ul", "article-base");
    gauntletContent.append(
        makeP(`The Gauntlet pits a single Challenger against everyone else, one match at a time, until exhaustion or defeat takes them.
    It’s brutal, glorious, and perfect for testing endurance and pride.`),
        makeP(`\nHOW IT WORKS`),
        makeP(`- One player starts as the Challenger.
    - They face each opponent in a set order (random or ranked).
    - Win and continue to the next opponent.
    - Lose and the next Challenger steps in.
    - The Gauntlet ends when every opponent has fallen, or when the machine finally cools down.`),
        makeP(`\nHOW IT ENDS`),
        makeP(`If the Challenger conquers all opponents, they achieve Gauntlet Glory.
    If they fall, the last victorious opponent claims the title of Gauntlet Master.
    “Endure the onslaught. Defy the odds. Become a legend.”`));

    const funfact3 = el("div", "funfact");
    funfact3.append(
        el("p", "", text(`-   FUN FACT   -`)),
        el("p", "mx-6", text(`The phrase “run the gauntlet” comes from a 15th-century military punishment: soldiers were forced to run between two rows of comrades who hit them with sticks.
    In this mode, it’s just digital sticks — but the feeling’s about the same.` )));
    gauntletContent.append(funfact3);

    injectWrapBox(gauntletContent, {
        atParagraphIndex: 3,
        side: "right",
        width: "w-[45%]",
        margin: "mt-8 mx-4",
        extra: "img-newspaper",
        shape: "none",
        clearAfter: true,
        kind: "img",
        src: "/imgs/Gauntlet.png",
        alt: "Arcade Machine Image"
    });

    gauntlet.append(gauntletTitle, gauntletSubtitle, gauntletContent);

    tournaments.append(king, classic, gauntlet);

/// ********* TOURNAMENT SUBSCRIPTIONS *********/
    const subscriptionSection = el("div", "border-subscription box-subscription w-full h-auto");

// notLoggedIn() retourne Promise<boolean> — on met à jour la section quand la promesse est résolue
    notLoggedIn().then((isNotLoggedIn) => {
        if (isNotLoggedIn) {
            subscriptionSection.classList.remove("border-subscription");
            subscriptionSection.classList.add("border-1", "border-stone-300", "rounded-lg");
            const loginPrompt = el("div", "article-base text-center text-2xl");
            const loginlink = el("a", "article-link cursor-pointer", text("log in"));
            loginlink.addEventListener("click", () => {
                runAuthBox("LOGIN", { onClick: () => {
                    document.body.classList.remove("no-scroll");
                } });
            });
            loginPrompt.append(text(`Please `), loginlink, text(` to create or join a tournament.`));
            subscriptionSection.append(loginPrompt);
        } else {
            const subscriptionTitle = el("h2", "title-hed text-center my-4 mt-8");
            subscriptionTitle.append(text("Use this Coupon to create a Tournament"));
            subscriptionSection.append(subscriptionTitle);
            // Build the form
            TournamentFormUI(subscriptionSection);
        }
    }).catch((err) => {
        console.error("Failed to determine login state:", err);
        // fallback UI
        subscriptionSection.append(el("div", "text-center text-red-400", text("Error loading subscription UI")));
    });

/// ********* ASSEMBLAGE *********/

    main.append(header, spacer, tournaments, subscriptionSection);
    return main;
}