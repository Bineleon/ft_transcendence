import { el, text } from "./home";
import { logout } from "../content/utils/logout.ts";
import { deleteAccount } from "./utils/deleteAccount.ts";
import { pongAlert } from "./utils/logchecks";

export function Profile(): HTMLElement {
    const main = el("main", "p-4");

    const section = el("section", "grid grid-cols-1 md:grid-cols-2 gap-6");

    const picframe = el("div", "frame-photo relative flex items-center justify-center group");
    const picture = el("img", "frame-photo-img img-newspaper cursor-pointer") as HTMLImageElement;

    // ⚡ Placeholder uniforme
    picture.src = "/imgs/avatar.png";
    picture.alt = "Avatar utilisateur";
    picture.loading = "lazy";
    picture.tabIndex = 0;
    picture.setAttribute("role", "button");
    picture.setAttribute("aria-label", "Changer la photo de profil");

    // ⚡ Éviter boucle infinie sur erreur
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

    const editHint = el("div", "absolute bottom-2 right-2 bg-white/80 rounded-full p-1 shadow pointer-events-none");
    editHint.innerHTML = "✎";

    const hoverOverlay = el("div",
        "absolute inset-0 flex items-center font-jmh justify-center bg-black/40 text-stone-100 text-3xl opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100"
    );
    hoverOverlay.textContent = "Click to change avatar";

    const MAX_SIZE = 2 * 1024 * 1024;

    function openFilePicker() { avatarInput.click(); }

    picture.addEventListener("click", openFilePicker);
    picture.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFilePicker(); }
    });

    avatarInput.addEventListener("change", async () => {
        const file = avatarInput.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { pongAlert("Fichier non supporté"); return; }
        if (file.size > MAX_SIZE) { pongAlert("Image trop grosse (max 2MB)"); return; }

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
            // ⚡ Charger seulement l’avatar, pas tout le profil
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

    picframe.append(picture, avatarInput, editHint, hoverOverlay);

    // ——— Info box ———
    const infoBox = el("div", "frame-photo p-9 flex flex-col");

    const loginLabel = el("h1", "title-profile mt-4");
    const emailLabel = el("h2", "p-4 font-royalvogue text-xl");
    infoBox.append(loginLabel, emailLabel);

    const stats = el("textarea", `
        p-4 m-4 border-2 border-black/50 mix-blend-multiply
        bg-white/70 resize-none h-full font-ocean-type text-md
    `) as HTMLTextAreaElement;
    stats.readOnly = true;
    infoBox.append(stats);

    const logoutBtn = el(
        "button",
        "big-link"
    );
    logoutBtn.append(text("Logout"));
    logoutBtn.onclick = () => logout();
    infoBox.append(logoutBtn);

    // ——— Bouton Delete Account ———
    const deleteButton = el("button",
        `big-link`
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

    const list = el("div", "mx-[10%]");
    const friendsTitle = el("h2", "font-royalvogue text-4xl mb-4");
    friendsTitle.append(text("Friends"));
    list.append(friendsTitle);

    const friendsList = el("ul", "relative list-disc list-inside font-modern-type text-lg");
    list.append(friendsList);

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
            } else alert("Impossible d'envoyer la demande.");
        } catch {
            alert("Erreur réseau.");
        }
    };
    addFriendBox.append(addFriendInput, addFriendBtn);
    list.append(addFriendBox);

    const requestsBox = el("div", "mx-[10%]");
    const requestsTitle = el("h3", "font-royalvogue text-4xl mb-4 text-right");
    requestsBox.append(requestsTitle);

    friendsSection.append(list, requestsBox);
    main.append(friendsSection);

    // ⚡ Charger profil et amis une seule fois
    loadProfileData(picture, loginLabel, emailLabel, stats, friendsList, requestsBox);

    return main;
}

async function loadProfileData(picture: HTMLImageElement, loginLabel: HTMLElement, emailLabel: HTMLElement,
    stats: HTMLTextAreaElement, friendsList: HTMLElement, requestsBox: HTMLElement
) {
    try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("Impossible de charger le profil");
        const data = await res.json();
        const user = data.data.user;
        picture.src = user.avatarUrl || "/imgs/avatar.png";
        loginLabel.textContent = user.username;
        emailLabel.textContent = user.email;
        stats.value =
            `Informations du compte:\n\nID: ${user.id}\nCréé le: ${new Date(user.createdAt).toLocaleString()}\n\nStatistiques:\n(À connecter bientôt à la DB)`;
        loadFriends(friendsList, requestsBox);
    } catch (err) {
        loginLabel.textContent = "Erreur";
        emailLabel.textContent = "Impossible de charger le profil";
        stats.value = "Une erreur est survenue.";
    }
}

async function loadFriends(friendsList: HTMLElement, requestsBox: HTMLElement) {
    friendsList.innerHTML = "";
    requestsBox.innerHTML = "";
    const requestsTitle = el("h3", "font-royalvogue text-4xl mb-4 text-right");
    requestsBox.append(requestsTitle);

    try {
        const friendsRes = await fetch("/api/friends", { credentials: "include" });
        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
            friendsData.data.forEach((friend: any) => {
                const li = el("li", "");
                li.textContent = friend.username;
                friendsList.append(li);
            });
        }
        const requestsRes = await fetch("/api/friends/requests", { credentials: "include" });
        const requestsData = await requestsRes.json();
        if (requestsData.success && Array.isArray(requestsData.data)) {
            requestsData.data.forEach((req: any) => {
                const reqDiv = el("div", "flex items-center mb-2");
                const nameSpan = el("span", "flex-1 font-modern-type text-lg");
                nameSpan.textContent = req.user.username;

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
    } catch (err) { console.error("Erreur chargement amis :", err); }
}
