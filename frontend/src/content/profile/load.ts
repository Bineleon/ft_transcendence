import { getLoggedName } from "../utils/todb.ts";
import { setupSelfMode, setupOtherMode } from "./utils.ts";
import { apiFetch } from "../utils/apiFetch.ts";
import { pongAlert } from "../utils/alertBox.ts";
import type { ProfileViewWindow } from "./view";
import { loadProfileDashboardSections } from "./dashboard.ts";
import { el, text } from "../home";




// --- Contrôleur principal de la vue profil ---
export function updateProfileView(view: ProfileViewWindow, userName: string): void {
    // Crée les sous-noeuds internes nécessaires (sans les exposer dans l'interface).
    const ui = ensureProfileUI(view);

    // 1) Load the basic profile information (avatar, title, labels, stats)
    loadProfileData(
        ui.picture,
        ui.title,
        ui.stats,
        view.last7days,
        view.lastScores,
        view.last3Matches,
        view.snakeStats,
        ui.friendsList,
        ui.requestsBox,
        userName
    );

    // 2) Determine whether the viewer is looking at their own profile or someone else's
    getLoggedName()
        .then((loggedName) => {
            const isSelf = !!loggedName && (!userName || userName === loggedName);

            if (!isSelf && !userName) {
                // Not logged in and no username specified → self page not accessible
                pongAlert(
                    "You must Log In to view the profile setup page.",
                    "error",
                    {
                        onClose: () => {
                            window.location.hash = "#/login";
                        },
                    }
                );
            } else if (isSelf && loggedName) {
                // Configure the view for the logged-in user
                setupSelfMode(
                    loggedName,
                    ui.picture,
                    ui.avatarInput,
                    ui.hoverOverlay,
                    ui.picframe,
                    ui.friendsList,
                    ui.requestsBox,
                    view.friendsBox,
                    ui.editBox
                );
            } else {
                // Configure the view for another user's profile
                setupOtherMode(
                    userName,
                    ui.picture,
                    ui.hoverOverlay,
                    view.friendsBox,
                    ui.editBox,
					view.last7days,
        			view.lastScores,
        			view.last3Matches,
        			view.snakeStats
                );
            }
        })
        .catch((err) => {
            console.error("Error checking logged user in Profile:", err);
            // Fallback to other mode on error
            setupOtherMode(
                userName,
                ui.picture,
                ui.hoverOverlay,
                view.friendsBox,
                ui.editBox,
				view.last7days,
        		view.lastScores,
        		view.last3Matches,
        		view.snakeStats
            );
        });
}

type ProfileInternalUI = {
    title: HTMLElement;
    picframe: HTMLElement;
    picture: HTMLImageElement;
    avatarInput: HTMLInputElement;
    hoverOverlay: HTMLElement;
    loginLabel: HTMLElement;
    emailLabel: HTMLElement;
    stats: HTMLElement;
    friendsList: HTMLUListElement;
    requestsBox: HTMLElement;
    editBox: HTMLElement;
};

function ensureProfileUI(view: ProfileViewWindow): ProfileInternalUI {
    // --- userTitle (title + subtitle) ---
    view.userTitle.innerHTML = "";
    const title = el("h2", "title-profile font-barcade text-center -tracking-[.015em] text-[60px] lg:text-[100px] xl:text-[140px]", text(""));
    view.userTitle.append(title);

    // --- avatarBox (frame + img + input + overlay) ---
    view.avatarBox.innerHTML = "";
    const picframe = el("div", "relative flex items-center justify-center group") as HTMLDivElement;
    const picture = el("img", "img-newspaper cursor-pointer max-w-full") as HTMLImageElement;
    picture.src = "/imgs/avatar.png";
    picture.alt = "Avatar utilisateur";
    picture.loading = "lazy";
    picture.tabIndex = 0;
    picture.setAttribute("role", "img");
    picture.dataset.fallback = "false";
    picture.addEventListener("error", () => {
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
        "absolute inset-0 flex items-center justify-center font-jmh text-2xl text-stone-100 bg-black/50 opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100",
        text("Click to change avatar")
    );

    picframe.append(picture, avatarInput, hoverOverlay);
    view.avatarBox.append(picframe);

    // --- infoBox (login, email, stats) ---
    view.infoBox.innerHTML = "";
    const loginLabel = el("h3", "font-im-great text-3xl tracking-widest", text(""));
    const emailLabel = el("p", "font-modern-type text-md italic", text(""));
    const stats = el("div", "space-y-2 font-ocean-type text-md whitespace-pre-line");
    view.infoBox.append(loginLabel, emailLabel, stats);

    // --- friendsBox (list + requests) ---
    view.friendsBox.innerHTML = "";
    const friendsTitle = el("h2", "font-oldprint text-3xl lg:text-xl mb-2", text("Friends"));
    const friendsList = el("ul", "list-disc list-inside font-modern-type text-lg lg:text-sm space-y-1") as HTMLUListElement;
    const requestsBox = el("div", "space-y-2");
    view.friendsBox.append(friendsTitle, friendsList, requestsBox);

    // --- isSelf (editBox placeholder) ---
    view.isSelf.innerHTML = "";
    const editBox = el("div", "pt-6 border-t border-stone-400 space-y-2 hidden");
    view.isSelf.append(editBox);

    return {
        title,
        picframe,
        picture,
        avatarInput,
        hoverOverlay,
        loginLabel,
        emailLabel,
        stats,
        friendsList,
        requestsBox,
        editBox,
    };
}

async function loadProfileData(
    picture: HTMLImageElement,
    titleEl: HTMLElement,
    stats: HTMLElement,
    last7days: HTMLElement,
    lastScores: HTMLElement,
    last3Matches: HTMLElement,
    snakeStats: HTMLElement,
    friendsList: HTMLElement,
    requestsBox: HTMLElement,
    viewedUsername: string
) {
    try {
        let res: Response;

        if (viewedUsername) {
            // On consulte le profil de quelqu'un d'autre
            res = await apiFetch(`/api/profile/${viewedUsername}`, {
                credentials: "include",
            });
        } else {
            // On consulte son propre profil
            res = await apiFetch("/api/auth/me", { credentials: "include" });
        }

        if (!res.ok) throw new Error("Impossible de charger le profil");
        const data = await res.json();
        const user = data.data.user;

        // Debug: Log the user data to see what we're getting
        console.log('[loadProfileData] User data received:', user);
        console.log('[loadProfileData] viewedUsername:', viewedUsername);
        console.log('[loadProfileData] kingMaxTime:', user.kingMaxTime);
        console.log('[loadProfileData] friendsCount:', user.friendsCount);
        console.log('[loadProfileData] matchesWonCount:', user.matchesWonCount);

        // Populate avatar
        picture.src = user.avatarUrl || "/imgs/avatar.png";

        // Populate header title with the player's username
        titleEl.textContent = user.username ? `(${user.username})` : "Profile";

        // Build stats as a series of paragraphs for a more article-like feel
        const lines: string[] = [];
        lines.push("Username: " + (user.username || "(inconnu)"));
        lines.push("Email: " + (user.email || "(privé)"));
        lines.push("Créé le: " +
                (user.createdAt
                    ? new Date(user.createdAt).toLocaleString()
                    : "(inconnu)"));
        lines.push("King Max Time: " + (user.kingMaxTime != null ? `${user.kingMaxTime} secondes` : "(aucun)"));
        lines.push("King Max Rounds: " + (user.kingMaxRounds != null ? user.kingMaxRounds : "(aucun)"));
        lines.push("Friends Count: " + (user.friendsCount ?? 0));
        lines.push("Matches Won: " + (user.matchesWonCount ?? 0));

        // Clear previous content and append each line as a <p>
        stats.innerHTML = "";
        lines.forEach((line) => {
            const p = document.createElement("p");
            p.className = "font-origin-athletic text-xl";
            p.textContent = line;
            stats.append(p);
        });

        //  Charger le dashboard pour le profil consulté (propre profil ou celui d'un ami)
        await loadProfileDashboardSections(last7days, lastScores, last3Matches, snakeStats, viewedUsername);

    } catch (err) {
        console.error("loadProfileData error:", err);
        titleEl.textContent = "Erreur";
        stats.innerHTML = "";
        const p = document.createElement("p");
        p.className = "article-base";
        p.textContent = "Une erreur est survenue lors du chargement du profil.";
        stats.append(p);

        // En cas d'erreur, on peut aussi vider / indiquer quelque chose dans les sections dashboard
        last7days.innerHTML = "";
        lastScores.innerHTML = "";
        last3Matches.innerHTML = "";
        snakeStats.innerHTML = "";

        const d = document.createElement("p");
        d.className = "article-base";
        d.textContent = "Dashboard indisponible.";
        last7days.append(d);
    }
    // Profile data loaded
}




