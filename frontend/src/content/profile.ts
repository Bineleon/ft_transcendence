import { el, text } from "./home";
import { logout } from "../content/utils/logout.ts";
import { deleteAccount } from "./utils/deleteAccount.ts";
import { pongAlert } from "./utils/logchecks";
import { getRouteTail } from "../router";

type FriendSummary = {
    id: string;
    username: string;
    avatarUrl?: string | null;
    online: boolean;
};

type FriendRequestSummary = FriendSummary & {
    createdAt?: string;
};

export function Profile(): HTMLElement {
    const main = el("main", "p-4");

    const viewedUsername = getRouteTail("/profile");
    const isSelf = viewedUsername === "" || viewedUsername === undefined;

    const section = el("section", "grid grid-cols-1 md:grid-cols-2 gap-6");

    const picframe = el("div", "frame-photo relative flex items-center justify-center group");
    const picture = el("img", "frame-photo-img img-newspaper cursor-pointer") as HTMLImageElement;

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

    const editHint = el(
        "div",
        "absolute bottom-2 right-2 bg-white/80 rounded-full p-1 shadow pointer-events-none"
    );
    editHint.innerHTML = "✎";

    const hoverOverlay = el(
        "div",
        "absolute inset-0 flex items-center font-jmh justify-center bg-black/40 text-stone-100 text-3xl opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100"
    );
    hoverOverlay.textContent = "Click to change avatar";

    const MAX_SIZE = 2 * 1024 * 1024;
    function openFilePicker() {
        avatarInput.click();
    }

    if (isSelf) {
        picture.setAttribute("aria-label", "Change avatar");
        picture.addEventListener("click", openFilePicker);
        picture.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFilePicker();
            }
        });

        avatarInput.addEventListener("change", async () => {
            const file = avatarInput.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) {
                pongAlert("Fichier non supporté");
                return;
            }
            if (file.size > MAX_SIZE) {
                pongAlert("Image trop grosse (max 2MB)");
                return;
            }

            const tmpUrl = URL.createObjectURL(file);
            picture.src = tmpUrl;

            try {
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/users/me/avatar", {
                    method: "POST",
                    body: fd,
                    credentials: "include",
                });
                const data = await res.json();
                if (!data.success) throw new Error("Upload failed");
                picture.src = data.data.avatarUrl || "/imgs/avatar.png";
            } catch (err) {
                console.error("Upload avatar error", err);
                pongAlert("Erreur lors de l'envoi. Réessaye.");
                picture.src = "/imgs/avatar.png";
            } finally {
                URL.revokeObjectURL(tmpUrl);
                avatarInput.value = "";
            }
        });
    } else {
        picture.classList.remove("cursor-pointer");
        picture.style.pointerEvents = "none";
        editHint.remove();
        hoverOverlay.remove();
    }

    picframe.append(picture, avatarInput);
    if (isSelf) picframe.append(editHint, hoverOverlay);

    const infoBox = el("div", "frame-photo p-9 flex flex-col");
    const loginLabel = el("h1", "title-profile mt-4");
    const emailLabel = el("h2", "p-4 font-royalvogue text-xl");
    infoBox.append(loginLabel, emailLabel);

    const stats = el(
        "textarea",
        `
        p-4 m-4 border-2 border-black/50 mix-blend-multiply
        bg-white/70 resize-none h-full font-ocean-type text-md
    `
    ) as HTMLTextAreaElement;
    stats.readOnly = true;
    infoBox.append(stats);

    if (isSelf) {

            // ---- EDIT PROFILE ----
        const settingsBtn = el("a", "big-link cursor-pointer") as HTMLAnchorElement;
        settingsBtn.href = "#/settings";
        settingsBtn.append(text("Edit Profile"));
        infoBox.append(settingsBtn);

        // --- Logout ---
        const logoutBtn = el("button", "big-link");
        logoutBtn.append(text("Logout"));
        logoutBtn.onclick = () => logout();
        infoBox.append(logoutBtn);

        // --- Delete account ---
        const deleteButton = el("button", "big-link");
        deleteButton.append(text("Supprimer mon compte"));
        deleteButton.onclick = async () => {
            const sure = confirm(
                "Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?"
            );
            if (!sure) return;
            const ok = await deleteAccount();
            if (ok) window.location.href = "/#/login";
            else alert("Impossible de supprimer le compte.");
        };
        infoBox.append(deleteButton);

        // --- GDPR / Privacy box ---
        const privacyBox = el(
            "div",
            "mt-6 flex flex-col gap-2 border-t border-zinc-700 pt-4"
        );

        const privacyTitle = el("h3", "font-royalvogue text-2xl");
        privacyTitle.textContent = "Privacy / Mes données";

        // Voir mes données (rapport GDPR)
        const viewDataBtn = el("button", "big-link") as HTMLButtonElement;
        viewDataBtn.textContent = "Voir mes données personnelles";
        viewDataBtn.onclick = async () => {
            try {
                const res = await fetch("/api/privacy/me", { credentials: "include" });
                if (!res.ok) {
                    alert("Impossible de charger le rapport de données.");
                    return;
                }
                const body = await res.json();
                const data = body.data;

                alert(
                    "Données de compte :\n" +
                        JSON.stringify(data.user, null, 2) +
                        "\n\nCompteurs :\n" +
                        JSON.stringify(data.counts, null, 2)
                );
            } catch (err) {
                console.error(err);
                alert("Erreur réseau lors de la récupération des données.");
            }
        };

        // Anonymiser mon compte
        const anonymizeBtn = el("button", "big-link") as HTMLButtonElement;
        anonymizeBtn.textContent = "Anonymiser mon compte";
        anonymizeBtn.onclick = async () => {
            const sure = confirm(
                "Votre pseudonyme, email, avatar et identifiants seront anonymisés.\n" +
                    "Vos matches et tournois resteront visibles, mais sous un nom générique.\n\n" +
                    "Confirmer l'anonymisation ?"
            );
            if (!sure) return;

            try {
                const res = await fetch("/api/privacy/anonymize", {
                    method: "POST",
                    credentials: "include",
                });
                if (!res.ok) {
                    alert("Impossible d'anonymiser le compte.");
                    return;
                }
                alert("Compte anonymisé. Vous allez être déconnecté.");
                window.location.href = "/#/login";
            } catch (err) {
                console.error(err);
                alert("Erreur réseau lors de l'anonymisation.");
            }
        };

        // Nettoyer les données locales du navigateur
        const clearLocalBtn = el("button", "big-link") as HTMLButtonElement;
        clearLocalBtn.textContent = "Supprimer mes données locales (navigateur)";
        clearLocalBtn.onclick = () => {
            localStorage.clear();
            sessionStorage.clear();
            alert("localStorage / sessionStorage nettoyés.");
        };

        privacyBox.append(privacyTitle, viewDataBtn, anonymizeBtn, clearLocalBtn);
        infoBox.append(privacyBox);
    }

    section.append(picframe, infoBox);
    main.append(section);

    const friendsSection = el("div", "grid grid-cols-1 md:grid-cols-2 gap-6 mt-8");

    // --- Section Friends / Add Friend ---
    const list = el("div", "mx-[10%]");
    const friendsTitle = el("h2", "font-royalvogue text-4xl mb-4");
    friendsTitle.append(text("Friends"));
    list.append(friendsTitle);

    const friendsList = el(
        "ul",
        "list-disc list-inside font-modern-type text-lg space-y-1"
    );
    list.append(friendsList);

    if (isSelf) {
        // Formulaire interne pour ajouter des amis
        const addFriendBox = el("div", "mt-4 flex items-center");
        const addFriendInput = el(
            "input",
            "border p-2 rounded flex-1 mr-2"
        ) as HTMLInputElement;
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
                    body: JSON.stringify({ username: friendUsername }),
                });
                const data = await res.json();
                if (data.success) {
                    alert("Demande envoyée !");
                    addFriendInput.value = "";
                    loadFriends(friendsList, requestsBox);
                } else alert("Impossible d'envoyer la demande.");
            } catch {
                alert("Erreur réseau.");
            }
        };
        addFriendBox.append(addFriendInput, addFriendBtn);
        list.append(addFriendBox);
    } else {
        // Si on consulte un profil tiers, juste un bouton Add Friend
        const addFriendBtn = el("button", "big-link mt-2");
        addFriendBtn.append(text("Add Friend"));
        addFriendBtn.onclick = async () => {
            try {
                const res = await fetch("/api/friends/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ username: viewedUsername }),
                });
                const data = await res.json();
                if (data.success) alert("Demande envoyée !");
                else alert("Impossible d'envoyer la demande.");
            } catch {
                alert("Erreur réseau.");
            }
        };
        list.append(addFriendBtn);
    }

    const requestsBox = el("div", "mx-[10%]");
    friendsSection.append(list, requestsBox);
    main.append(friendsSection);

    loadProfileData(
        picture,
        loginLabel,
        emailLabel,
        stats,
        friendsList,
        requestsBox,
        viewedUsername
    );

    return main;
}

async function loadProfileData(
    picture: HTMLImageElement,
    loginLabel: HTMLElement,
    emailLabel: HTMLElement,
    stats: HTMLTextAreaElement,
    friendsList: HTMLElement | null,
    requestsBox: HTMLElement | null,
    viewedUsername: string
) {
    try {
        let res: Response;

        if (viewedUsername) {
            res = await fetch(`/api/profile/${viewedUsername}`, {
                credentials: "include",
            });
        } else {
            res = await fetch("/api/auth/me", { credentials: "include" });
        }

        if (!res.ok) throw new Error("Impossible de charger le profil");
        const data = await res.json();
        const user = data.data.user;

        picture.src = user.avatarUrl || "/imgs/avatar.png";
        loginLabel.textContent = user.username || "(nom inconnu)";
        emailLabel.textContent = user.email || "(email privé)";

        // Affichage complet des infos du profil
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

        if (!viewedUsername && friendsList && requestsBox) {
            loadFriends(friendsList, requestsBox);
        }
    } catch (err) {
        console.error("loadProfileData error:", err);
        loginLabel.textContent = "Erreur";
        emailLabel.textContent = "Profil inaccessible";
        stats.value = "Une erreur est survenue lors du chargement du profil.";
    }
}

async function loadFriends(friendsList: HTMLElement, requestsBox: HTMLElement) {
    friendsList.innerHTML = "";
    requestsBox.innerHTML = "";

    const requestsTitle = el(
        "h3",
        "font-royalvogue text-4xl mb-4 text-right"
    );
    requestsTitle.append(text("Friend Requests"));
    requestsBox.append(requestsTitle);

    try {
        // --- Friends (acceptés) ---
        const friendsRes = await fetch("/api/friends", {
            credentials: "include",
        });
        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
            (friendsData.data as FriendSummary[]).forEach((friend) => {
                const li = el("li", "flex items-center justify-between gap-2");

                // Bloc gauche : pastille + label
                const left = el("div", "flex items-center gap-2");

                const dot = el("span", "");
                dot.style.display = "inline-block";
                dot.style.width = "10px";
                dot.style.height = "10px";
                dot.style.borderRadius = "50%";
                dot.style.backgroundColor = friend.online ? "#22c55e" : "#9ca3af";

                const label = el("span", "");
                label.textContent = `${friend.username} – ${
                    friend.online ? "Online" : "Offline"
                }`;

                left.append(dot, label);

                // Bouton Remove
                const removeBtn = el("button", "btn-click ml-2") as HTMLButtonElement;
                removeBtn.textContent = "Remove";
                removeBtn.onclick = async () => {
                    const sure = confirm(
                        `Supprimer ${friend.username} de votre liste d'amis ?`
                    );
                    if (!sure) return;

                    try {
                        const res = await fetch(`/api/friends/${friend.id}`, {
                            method: "DELETE",
                            credentials: "include",
                        });
                        if (!res.ok) {
                            console.error("Failed to remove friend", await res.text());
                            alert("Impossible de supprimer cet ami.");
                            return;
                        }
                        await loadFriends(friendsList, requestsBox);
                    } catch (err) {
                        console.error("Erreur suppression ami :", err);
                        alert("Erreur réseau lors de la suppression.");
                    }
                };

                li.append(left, removeBtn);
                friendsList.append(li);
            });
        }

        // --- Demandes reçues ---
        const requestsRes = await fetch("/api/friends/requests", {
            credentials: "include",
        });
        const requestsData = await requestsRes.json();
        if (requestsData.success && Array.isArray(requestsData.data)) {
            (requestsData.data as FriendRequestSummary[]).forEach((req) => {
                const reqDiv = el("div", "flex items-center mb-2 gap-2");

                const left = el("div", "flex items-center gap-2 flex-1");

                let avatar: HTMLElement;
                if (req.avatarUrl) {
                    avatar = el("img", "w-8 h-8 rounded-full object-cover") as HTMLImageElement;
                    (avatar as HTMLImageElement).src = req.avatarUrl;
                    (avatar as HTMLImageElement).alt = req.username;
                } else {
                    avatar = el(
                        "div",
                        "w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center"
                    );
                }

                const nameSpan = el("span", "font-modern-type text-lg");
                nameSpan.textContent = req.username;

                left.append(avatar, nameSpan);

                const acceptBtn = el("button", "btn-click mr-2") as HTMLButtonElement;
                acceptBtn.textContent = "Accept";
                acceptBtn.onclick = async () => {
                    await fetch(`/api/friends/${req.id}`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "accept" }),
                    });
                    loadFriends(friendsList, requestsBox);
                };

                const declineBtn = el("button", "btn-click") as HTMLButtonElement;
                declineBtn.textContent = "Decline";
                declineBtn.onclick = async () => {
                    await fetch(`/api/friends/${req.id}`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "reject" }),
                    });
                    loadFriends(friendsList, requestsBox);
                };

                reqDiv.append(left, acceptBtn, declineBtn);
                requestsBox.append(reqDiv);
            });
        }
    } catch (err) {
        console.error("Erreur chargement amis :", err);
    }
}
