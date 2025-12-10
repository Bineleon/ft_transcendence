import { getLoggedName } from "../utils/todb.ts";
import { setupSelfMode, setupOtherMode } from "./utils.ts";
import { apiFetch } from "../utils/apiFetch.ts";
import { pongAlert } from "../utils/alertBox.ts";
import type { ProfileViewWindow } from "./view";

// --- Contrôleur principal de la vue profil ---
export function updateProfileView(view: ProfileViewWindow, userName: string): void {

    // 1) Load the basic profile information (avatar, labels, stats)
    loadProfileData(
        view.picture,
        view.loginLabel,
        view.emailLabel,
        view.stats,
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
                pongAlert("You must Log In to view the profile setup page.", "error", {
                    onClose: () => {
                        window.location.hash = "#/login";
                    },
                });
            } else if (isSelf && loggedName) {
                // Configure the view for the logged-in user
                setupSelfMode(
                    loggedName,
                    view.picture,
                    view.avatarInput,
                    view.hoverOverlay,
                    view.picframe,
                    view.infoBox,
                    view.friendsList,
                    view.requestsBox,
                    view.friendsContainer
                );
            } else {
                // Configure the view for another user's profile
                setupOtherMode(
                    userName,
                    view.picture,
                    view.hoverOverlay,
                    view.friendsContainer
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
                view.friendsContainer
            );
        });
}

async function loadProfileData(
    picture: HTMLImageElement,
    loginLabel: HTMLElement,
    emailLabel: HTMLElement,
    stats: HTMLTextAreaElement,
    friendsList: HTMLElement | null,
    requestsBox: HTMLElement | null,
    viewedUsername: string) {
    try {
        let res: Response;

        if (viewedUsername) {
            res = await apiFetch(`/api/profile/${viewedUsername}`, {
                credentials: "include",
            });
        } else {
            res = await apiFetch("/api/auth/me", { credentials: "include" });
        }

        if (!res.ok) throw new Error("Impossible de charger le profil");
        const data = await res.json();
        const user = data.data.user;

        picture.src = user.avatarUrl || "/imgs/avatar.png";
        loginLabel.textContent = user.username || "(nom inconnu)";
        emailLabel.textContent = user.email || "(email privé)";
        // Full profile information displayed in the stats textarea
        stats.value = `
        Informations du compte:

        ID: ${user.id || "(inconnu)"}
        Username: ${user.username || "(inconnu)"}
        Email: ${user.email || "(privé)"}
        Créé le: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : "(inconnu)"}
        King Max Time: ${user.kingMaxTime ?? "(aucun)"} secondes
        King Max Rounds: ${user.kingMaxRounds ?? "(aucun)"}
        Friends Count: ${user.friendsCount ?? 0}
        Matches Won: ${user.matchesWonCount ?? 0}
        `.trim();
    } catch (err) {
        console.error("loadProfileData error:", err);
        loginLabel.textContent = "Erreur";
        emailLabel.textContent = "Profil inaccessible";
        stats.value = "Une erreur est survenue lors du chargement du profil.";
    }
    // Profile data loaded
}


