import { getLoggedName } from "../utils/todb.ts";
import { setupSelfMode, setupOtherMode } from "./utils.ts";
import { apiFetch } from "../utils/apiFetch.ts";
import { pongAlert } from "../utils/alertBox.ts";
import type { ProfileViewWindow } from "./view";
import { loadDailyMatchesDashboard } from "./dashboard.ts"




// --- Contrôleur principal de la vue profil ---
export function updateProfileView(view: ProfileViewWindow, userName: string): void {
    // 1) Load the basic profile information (avatar, title, labels, stats)
    loadProfileData(
        view.picture,
        view.title,
        view.subtitle,
        view.loginLabel,
        view.emailLabel,
        view.stats,
		view.dashboard,
        view.friendsList,
        view.requestsBox,
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
                    view.picture,
                    view.avatarInput,
                    view.hoverOverlay,
                    view.picframe,
                    view.friendsList,
                    view.requestsBox,
                    view.friendsColumn,
                    view.editBox
                );
            } else {
                // Configure the view for another user's profile
                setupOtherMode(
                    userName,
                    view.picture,
                    view.hoverOverlay,
                    view.friendsColumn,
                    view.editBox
                );
            }
        })
        .catch((err) => {
            console.error("Error checking logged user in Profile:", err);
            // Fallback to other mode on error
            setupOtherMode(
                userName,
                view.picture,
                view.hoverOverlay,
                view.friendsColumn,
                view.editBox
            );
        });
}

async function loadProfileData(
    picture: HTMLImageElement,
    titleEl: HTMLElement,
    subtitleEl: HTMLElement,
    loginLabel: HTMLElement,
    emailLabel: HTMLElement,
    stats: HTMLElement,
    dashboard: HTMLElement,
    friendsList: HTMLElement | null,
    requestsBox: HTMLElement | null,
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

        // Populate avatar
        picture.src = user.avatarUrl || "/imgs/avatar.png";

        // Populate header title with the player's username
        titleEl.textContent = user.username ? `Profile of ${user.username}` : "Profile";

        // A fun tagline for the subtitle
        subtitleEl.textContent = user.username
            ? `Get to know ${user.username} better…`
            : "Player dossier";

        // Also update labels inside the article
        loginLabel.textContent = user.username || "(nom inconnu)";
        emailLabel.textContent = user.email || "(email privé)";

        // Build stats as a series of paragraphs for a more article-like feel
        const lines: string[] = [];
        lines.push("\u2022 ID: " + (user.id || "(inconnu)"));
        lines.push("\u2022 Username: " + (user.username || "(inconnu)"));
        lines.push("\u2022 Email: " + (user.email || "(privé)"));
        lines.push(
            "\u2022 Créé le: " +
                (user.createdAt
                    ? new Date(user.createdAt).toLocaleString()
                    : "(inconnu)")
        );
        lines.push(
            "\u2022 King Max Time: " +
                (user.kingMaxTime != null ? `${user.kingMaxTime} secondes` : "(aucun)")
        );
        lines.push(
            "\u2022 King Max Rounds: " +
                (user.kingMaxRounds != null ? user.kingMaxRounds : "(aucun)")
        );
        lines.push(
            "\u2022 Friends Count: " + (user.friendsCount ?? 0)
        );
        lines.push(
            "\u2022 Matches Won: " + (user.matchesWonCount ?? 0)
        );

        // Clear previous content and append each line as a <p>
        stats.innerHTML = "";
        lines.forEach((line) => {
            const p = document.createElement("p");
            p.className = "article-base";
            p.textContent = line;
            stats.append(p);
        });

        // 👉 Charger le dashboard SEULEMENT si c'est *ton* propre profil
        if (!viewedUsername) {
            await loadDailyMatchesDashboard(dashboard);
        }

    } catch (err) {
        console.error("loadProfileData error:", err);
        titleEl.textContent = "Erreur";
        subtitleEl.textContent = "Profil inaccessible";
        loginLabel.textContent = "Erreur";
        emailLabel.textContent = "Profil inaccessible";
        stats.innerHTML = "";
        const p = document.createElement("p");
        p.className = "article-base";
        p.textContent = "Une erreur est survenue lors du chargement du profil.";
        stats.append(p);

        // En cas d'erreur, on peut aussi vider / indiquer quelque chose dans le dashboard
        dashboard.innerHTML = "";
        const d = document.createElement("p");
        d.className = "article-base";
        d.textContent = "Dashboard indisponible.";
        dashboard.append(d);
    }
    // Profile data loaded
}




