import { el, text } from "./home";
import { logout } from "../content/utils/logout.ts";
import { deleteAccount } from "./utils/deleteAccount.ts";

export function Profile(): HTMLElement {
    const main = el("main", "p-4");

    // ——— Structure principale ———
    const section = el("section", "grid grid-cols-1 md:grid-cols-2 gap-6");

    // ——— Frame photo ———
    const picframe = el("div", "frame-photo");
    const picture = el("img", "frame-photo-img img-newspaper");
    picframe.append(picture);

    // ——— Info box ———
    const infoBox = el("div", "frame-photo p-9 flex flex-col");

    const loginLabel = el("h1", "p-4 font-jmh w-full text-8xl mb-4");
    const emailLabel = el("h2", "p-4 font-modern-type text-3xl mb-4");
    infoBox.append(loginLabel, emailLabel);

    const stats = el("textarea", `
        p-4 m-4 border-2 border-black/50 mix-blend-multiply
        bg-white/70 resize-none h-full font-ocean-type text-md
    `) as HTMLTextAreaElement;
    stats.readOnly = true;
    infoBox.append(stats);

    // ——— Bouton Logout ———
    const logoutBtn = el(
        "button",
        "ml-auto mt-2 mr-2 text-black/60 hover:text-black/80 font-modern-type text-xl underline underline-offset-4 transition"
    );
    logoutBtn.append(text("Logout"));
    logoutBtn.onclick = () => logout();
    infoBox.append(logoutBtn);

    // ——— Bouton Delete Account ———
    const deleteButton = el(
        "button",
        "ml-auto mt-2 mr-2 text-red-600/60 hover:text-red-700/80 font-modern-type text-xl underline underline-offset-4 transition"
    );
    deleteButton.append(text("Supprimer mon compte"));
    deleteButton.onclick = async () => {
        const sure = confirm("Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?");
        if (!sure) return;

        const ok = await deleteAccount();
        if (ok) window.location.href = "/#/login";
        else alert("Impossible de supprimer le compte.");
    };
    infoBox.append(deleteButton);

    section.append(picframe, infoBox);
    main.append(section);

    // ——— Friends Section ———
    const friendsSection = el("div", "grid grid-cols-1 md:grid-cols-2 gap-6 mt-8");

    // Liste des amis
    const list = el("div", "mx-[10%]");
    const friendsTitle = el("h2", "font-royalvogue text-4xl mb-4");
    friendsTitle.append(text("Friends"));
    list.append(friendsTitle);

    const friendsList = el("ul", "relative list-disc list-inside font-modern-type text-lg");
    list.append(friendsList);

    // ——— Add Friend ———
    const addFriendBox = el("div", "mt-4 flex items-center");
    const addFriendInput = el("input", "border p-2 rounded flex-1 mr-2") as HTMLInputElement;
    addFriendInput.placeholder = "Nom ou ID de l'ami";

    const addFriendBtn = el(
        "button",
        "text-black/60 hover:text-black/80 font-modern-type text-lg underline underline-offset-4 transition"
    );
    addFriendBtn.textContent = "Add Friend";
    addFriendBtn.onclick = async () => {
        const friendUsername = addFriendInput.value.trim();
        if (!friendUsername) return;

        try {
            const res = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username: friendUsername })
            });
            const data = await res.json();
            if (data.success) {
                alert("Demande envoyée !");
                addFriendInput.value = "";
                loadFriends(friendsList, requestsBox);
            } else {
                alert("Impossible d'envoyer la demande.");
            }
        } catch {
            alert("Erreur réseau.");
        }
    };

    addFriendBox.append(addFriendInput, addFriendBtn);
    list.append(addFriendBox);

    // ——— Demandes d'amis ———
    const requestsBox = el("div", "mx-[10%]");
    const requestsTitle = el("h3", "font-royalvogue text-4xl mb-4 text-right");
    requestsTitle.append(text("Requests"));
    requestsBox.append(requestsTitle);

    friendsSection.append(list, requestsBox);
    main.append(friendsSection);

    // ——— Charger dynamiquement le profil et les amis ———
    loadProfileData(picture, loginLabel, emailLabel, stats, friendsList, requestsBox);

    return main;
}

// ——— Fonction pour charger le profil ———
async function loadProfileData(
    picture: HTMLImageElement,
    loginLabel: HTMLElement,
    emailLabel: HTMLElement,
    stats: HTMLTextAreaElement,
    friendsList: HTMLElement,
    requestsBox: HTMLElement
) {
    try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("Impossible de charger le profil");

        const data = await res.json();
        const user = data.data.user;

        picture.src = user.avatarUrl || "/public/imgs/default-avatar.png";
        loginLabel.textContent = user.username;
        emailLabel.textContent = user.email;
        stats.value =
            "Informations du compte:\n\n" +
            `ID: ${user.id}\n` +
            `Créé le: ${new Date(user.createdAt).toLocaleString()}\n\n` +
            "Statistiques:\n" +
            "(À connecter bientôt à la DB)";

        loadFriends(friendsList, requestsBox);
    } catch (err) {
        loginLabel.textContent = "Erreur";
        emailLabel.textContent = "Impossible de charger le profil";
        stats.value = "Une erreur est survenue.";
    }
}

// ——— Fonction pour charger amis + demandes depuis le backend ———
async function loadFriends(friendsList: HTMLElement, requestsBox: HTMLElement) {
    friendsList.innerHTML = "";
    // garde le titre Requests
    const requestsTitle = el("h3", "font-royalvogue text-4xl mb-4 text-right");
    requestsTitle.append(text("Requests"));
    requestsBox.innerHTML = "";
    requestsBox.append(requestsTitle);

    try {
        // — Liste amis —
        const friendsRes = await fetch("/api/friends", { credentials: "include" });
        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
            friendsData.data.forEach((friend: any) => {
                const li = el("li", "");
                li.textContent = friend.username;
                friendsList.append(li);
            });
        }

        // — Demandes reçues —
        const requestsRes = await fetch("/api/friends/requests", { credentials: "include" });
        const requestsData = await requestsRes.json();
        if (requestsData.success && Array.isArray(requestsData.data)) {
            requestsData.data.forEach((req: any) => {
                const reqDiv = el("div", "flex items-center mb-2");
                const nameSpan = el("span", "flex-1 font-modern-type text-lg");
                nameSpan.textContent = req.user.username; // expéditeur

                const acceptBtn = el("button", "btn-click mr-2") as HTMLButtonElement;
                acceptBtn.textContent = "Accept";
                acceptBtn.onclick = async () => {
                    await fetch(`/api/friends/${req.userId}`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "accept" })
                    });
                    loadFriends(friendsList, requestsBox);
                };

                const declineBtn = el("button", "btn-click") as HTMLButtonElement;
                declineBtn.textContent = "Decline";
                declineBtn.onclick = async () => {
                    await fetch(`/api/friends/${req.userId}`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "reject" })
                    });
                    loadFriends(friendsList, requestsBox);
                };

                reqDiv.append(nameSpan, acceptBtn, declineBtn);
                requestsBox.append(reqDiv);
            });
        }
    } catch (err) {
        console.error("Erreur chargement amis :", err);
    }
}
