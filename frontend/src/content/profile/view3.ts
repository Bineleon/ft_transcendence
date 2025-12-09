import { el, text } from "../home";
import type { Tournament } from "../../tournament/uiTypes";
import type { PlayerId } from "../game/metrics";
import type { PlayerInfo, GameViewHooks } from "../game/types";

// ------------------ Profile View Definitions ---------------------
// root (main container)
//  ├─ section (two columns: avatar + info box)
//  │   ├─ picframe (container for avatar image and file input)
//  │   │   ├─ picture (user avatar)
//  │   │   ├─ avatarInput (hidden file input for avatar upload)
//  │   │   └─ hoverOverlay (overlay text for avatar change)
//  │   └─ infoBox (user info and stats)
//  │       ├─ loginLabel
//  │       ├─ emailLabel
//  │       └─ stats (textarea)
//  └─ friendsSection (two columns: friends list + friend requests)
//      ├─ friendsContainer (contains friends title and list)
//      └─ requestsBox (container for friend requests)

export interface ProfileViewWindow {
    root: HTMLElement;
    picture: HTMLImageElement;
    avatarInput: HTMLInputElement;
    hoverOverlay: HTMLElement;
    picframe: HTMLElement;
    infoBox: HTMLElement;
    loginLabel: HTMLElement;
    emailLabel: HTMLElement;
    stats: HTMLTextAreaElement;
    friendsList: HTMLUListElement;
    requestsBox: HTMLElement;
    friendsContainer: HTMLElement;
}

export function createProfileViewWindow(): ProfileViewWindow {

    const root = el("main", "p-4");

    const section = el("section", "grid grid-cols-1 md:grid-cols-2 gap-6");

    // Avatar container and elements
    const picframe = el(
        "div",
        "relative flex items-center justify-center group"
    ) as HTMLDivElement;
    const picture = el(
        "img",
        "img-newspaper cursor-pointer"
    ) as HTMLImageElement;
    picture.src = "/imgs/avatar.png";
    picture.alt = "Avatar utilisateur";
    picture.loading = "lazy";
    picture.tabIndex = 0;
    picture.setAttribute("role", "img");
    picture.dataset.fallback = "false";
    picture.addEventListener("error", () => {
        // Fallback to default avatar if loading fails
        if (picture.dataset.fallback === "false") {
            picture.src = "/imgs/avatar.png";
            picture.dataset.fallback = "true";
        }
    });

    const avatarInput = document.createElement("input") as HTMLInputElement;
    avatarInput.type = "file";
    avatarInput.accept = "image/*";
    avatarInput.className = "hidden";

    const hoverOverlay = el(
        "div",
        [
            "absolute inset-0 flex items-center justify-center",
            "font-jmh text-3xl text-stone-100",
            "bg-black/40",
            "opacity-0 transition-opacity duration-200",
            "pointer-events-none group-hover:opacity-100",
        ].join(" ")
    );
    hoverOverlay.textContent = "Click to change avatar";

    picframe.append(picture, avatarInput, hoverOverlay);

    // Info box with username, email and stats
    const infoBox = el("div", "p-9 flex flex-col");
    const loginLabel = el("h1", "title-profile mt-4");
    const emailLabel = el("h2", "p-4 font-royalvogue text-xl");
    infoBox.append(loginLabel, emailLabel);
    const stats = el(
        "textarea",
        `p-4 m-4 border-2 border-black/50 mix-blend-multiply
         bg-white/70 resize-none h-full font-ocean-type text-md`
    ) as HTMLTextAreaElement;
    stats.readOnly = true;
    infoBox.append(stats);

    section.append(picframe, infoBox);

    // Friends section containing friends list and requests
    const friendsContainer = el("div", "mx-[10%]");
    const friendsTitle = el("h2", "font-royalvogue text-4xl mb-4");
    friendsTitle.append(text("Friends"));
    const friendsList = el(
        "ul",
        "list-disc list-inside font-modern-type text-lg space-y-1"
    ) as HTMLUListElement;
    friendsContainer.append(friendsTitle, friendsList);

    const requestsBox = el("div", "mx-[10%]");

    const friendsSection = el(
        "div",
        "grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
    );
    friendsSection.append(friendsContainer, requestsBox);

    root.append(section, friendsSection);

    return {
        root,
        picture,
        avatarInput,
        hoverOverlay,
        picframe,
        infoBox,
        loginLabel,
        emailLabel,
        stats,
        friendsList,
        requestsBox,
        friendsContainer,
    };
}

