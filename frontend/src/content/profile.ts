import { el, text } from "./home";
import { logout } from "../content/utils/logout.ts";
import { deleteAccount } from "./utils/deleteAccount.ts";
import { pongAlert } from "./utils/alertBox.ts";
import { getRouteTail } from "../router";
import { apiFetch } from "./utils/apiFetch";
import { getLoggedName } from "./utils/todb.ts"

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

// DECLARATION DES STRUCTURES DE BASE ************************************** //
    /// -- Avatar + Infos
    const section = el("section", "grid grid-cols-1 md:grid-cols-2 gap-6");

//---- AVATAR
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

    // - Option si IsSelf
    const avatarInput = document.createElement("input") as HTMLInputElement;
    avatarInput.type = "file";
    avatarInput.accept = "image/*";
    avatarInput.className = "hidden";

    // - Overlay de modification "Click To Change Avatar"
    const hoverOverlay = el(
        "div",
        "absolute inset-0 flex items-center font-jmh justify-center bg-black/40 text-stone-100 text-3xl opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100"
    );
    hoverOverlay.textContent = "Click to change avatar";

    const MAX_SIZE = 2 * 1024 * 1024;
    function openFilePicker() { avatarInput.click(); }

    picframe.append(picture, avatarInput, hoverOverlay);

//---- INFOS
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

//  --- Ajout Yoann pour dashboard : canvas pour le graphe ---
	// const statsChart = el(
	// 	"canvas",
	// 	"w-full h-40 m-4 border border-black/30 bg-white/70 rounded"
	// ) as HTMLCanvasElement;
    infoBox.append(stats); // Ajouter statsChart
    section.append(picframe, infoBox);


//---- FRIENDS
    const friendsSection = el("div", "grid grid-cols-1 md:grid-cols-2 gap-6 mt-8");

    // - Section Friends / Add Friend ---
    const list = el("div", "mx-[10%]");
    const friendsTitle = el("h2", "font-royalvogue text-4xl mb-4");
    friendsTitle.append(text("Friends"));
    const friendsList = el("ul", "list-disc list-inside font-modern-type text-lg space-y-1");
    const requestsBox = el("div", "mx-[10%]");

    list.append(friendsTitle, friendsList);

//---- ASSEMBLAGE
    friendsSection.append(list, requestsBox);
    main.append(section, friendsSection);

//---- CHARGER LE PROFIL
    loadProfileData(
        picture,
        loginLabel,
        emailLabel,
        stats,
		// statsChart, // Ajout Yoann : DashBoard
        friendsList,
        requestsBox,
        viewedUsername
    );

//---- LOGIQUE SELF vs OTHER

    getLoggedName().then((loggedName) => {
        const isSelf = !!loggedName && (!viewedUsername || viewedUsername === loggedName);

        if (isSelf) {
            setupSelfMode(
                loggedName,
                picture,
                avatarInput,
                hoverOverlay,
                picframe,
                infoBox,
                friendsList,
                requestsBox,
                list
            );
        } else {
            setupOtherMode(
                viewedUsername,
                picture,
                hoverOverlay,
                list
            );
        }
    })
    .catch((err) => {
        console.error("Error checking logged user in Profile:", err);
        setupOtherMode(viewedUsername, picture, hoverOverlay, list);
    });



// *** Les Helpers
    function setupSelfMode(
        loggedName: string,
        picture: HTMLImageElement,
        avatarInput: HTMLInputElement,
        hoverOverlay: HTMLElement,
        picframe: HTMLElement,
        infoBox: HTMLElement,
        friendsList: HTMLUListElement,
        requestsBox: HTMLElement,
        list: HTMLElement
    ): void {
        // --- Avatar éditable ---
        picture.setAttribute("aria-label", "Change avatar");
        picture.classList.add("cursor-pointer");
        picture.style.pointerEvents = ""; // réactive si besoin

        picture.addEventListener("click", openFilePicker);
        picture.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFilePicker();
            }
        });
        picframe.append(hoverOverlay);

        avatarInput.addEventListener("change", async () => {
            const file = avatarInput.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) {
                pongAlert("Fichier non supporté", "error");
                return;
            }
            if (file.size > MAX_SIZE) {
                pongAlert("Image trop grosse (max 2MB)", "error");
                return;
            }
            const tmpUrl = URL.createObjectURL(file);
            picture.src = tmpUrl;

            try {
                const fd = new FormData();
                fd.append("file", file);
                const res = await apiFetch("/api/users/me/avatar", {
                    method: "POST",
                    body: fd,
                    credentials: "include",
                });
                const data = await res.json();
                if (!data.success) throw new Error("Upload failed");
                picture.src = data.data.avatarUrl || "/imgs/avatar.png";
            } catch (err) {
                console.error("Upload avatar error", err);
                pongAlert("Error while uploading your avatar. Please try again.", "error");
                picture.src = "/imgs/avatar.png";
            } finally {
                URL.revokeObjectURL(tmpUrl);
                avatarInput.value = "";
            }
        });

//---- LES OPTIONS DE PROFILE (uniquement IsSelf)        
        // --- Les Bouttons 
        const settingsBtn = el("a", "big-link cursor-pointer") as HTMLAnchorElement;
        settingsBtn.href = "#/settings";
        settingsBtn.append(text("Edit Profile"));

        const logoutBtn = el("button", "big-link");
        logoutBtn.append(text("Logout"));
        logoutBtn.onclick = () => logout();

        const deleteButton = el("button", "big-link");
        deleteButton.append(text("Supprimer mon compte"));
        deleteButton.onclick = async () => {
            const sure = confirm(
                "This action is a one way ticket out. Are you Sure ?"
            );
            if (!sure) return;
            const ok = await deleteAccount();
            if (ok) window.location.href = "/#/home";
            else pongAlert("Impossible to delete account.", "error");
        };


        // --- GDPR / Privacy box ---
        const privacyBox = el("div", "mt-6 flex flex-col gap-2 border-t border-zinc-700 pt-4");
        const privacyTitle = el("h3", "font-royalvogue text-2xl");
        privacyTitle.textContent = "Privacy / My Datas";

        // Voir mes données (rapport GDPR)
        const viewDataBtn = el("button", "big-link") as HTMLButtonElement;
        viewDataBtn.textContent = "Check on my personnal datas.";
        viewDataBtn.onclick = async () => {
            try {
                const res = await apiFetch("/api/privacy/me", { credentials: "include" });
                if (!res.ok) {
                    pongAlert("Impossible to load personnal datas.");
                    return;
                }
                const body = await res.json();
                const data = body.data;

                pongAlert(
                    "Account datas :\n" +
                        JSON.stringify(data.user, null, 2) +
                        "\n\nCounts :\n" +
                        JSON.stringify(data.counts, null, 2)
                );
            } catch (err) {
                console.error(err);
                pongAlert("Network issue while loading personnal datas.", "error");
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
                const res = await apiFetch("/api/privacy/anonymize", {
                    method: "POST",
                    credentials: "include",
                });
                if (!res.ok) {
                    pongAlert("Impossible to anonymize the account.", "error");
                    return;
                }
                pongAlert("Your are now Anonymized", "success");
                window.location.href = "/#/login";
            } catch (err) {
                console.error(err);
                pongAlert("Network issue while anonymization.", "error");
            }
        };

        // Nettoyer les données locales du navigateur
        const clearLocalBtn = el("button", "big-link") as HTMLButtonElement;
        clearLocalBtn.textContent = "Supprimer mes données locales (navigateur)";
        clearLocalBtn.onclick = () => {
            localStorage.clear();
            sessionStorage.clear();
            pongAlert("localStorage / sessionStorage cleaned.", "info");
        };

//---- ASSEMBLAGE
        privacyBox.append(privacyTitle, viewDataBtn, anonymizeBtn, clearLocalBtn);
        infoBox.append(settingsBtn, logoutBtn, deleteButton, privacyBox);


//---- FRIENDS 
        const addFriendBox = el("div", "mt-4 flex items-center");
        const addFriendInput = el("input", "border p-2 rounded flex-1 mr-2") as HTMLInputElement;
        addFriendInput.placeholder = "Enter friend's username";

        const addFriendBtn = el("button", `text-black/60 hover:text-black/80
            font-modern-type text-lg underline underline-offset-4 transition`) as HTMLButtonElement;
        addFriendBtn.textContent = "Add Friend";
        addFriendBtn.onclick = async () => {
            const friendUsername = addFriendInput.value.trim();
            if (!friendUsername) return;
            try {
                const res = await apiFetch("/api/friends/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ username: friendUsername }),
                });
                const data = await res.json();
                if (data.success) {
                    pongAlert("Demande envoyée !", "success");
                    addFriendInput.value = "";
                    loadFriends(friendsList, requestsBox);
                } else pongAlert("Impossible d'envoyer la demande.", "error");
            } catch {
                pongAlert("Erreur réseau.", "error");
            }
        };

        addFriendBox.append(addFriendInput, addFriendBtn);
        list.append(addFriendBox);

        loadFriends(friendsList, requestsBox);
    }

    function setupOtherMode(
        viewedUsername: string,
        picture: HTMLImageElement,
        hoverOverlay: HTMLElement,
        list: HTMLElement
    ): void {
        // --- Désactiver l'édition de l'avatar ---
        picture.style.pointerEvents = "none";
        picture.classList.remove("cursor-pointer");
        hoverOverlay.classList.add("hidden");

        if (viewedUsername) {
            const addFriendBtn = el("button", "big-link mt-2");
            addFriendBtn.append(text("Add as Friend"));
            addFriendBtn.onclick = async () => {
                try {
                    const res = await apiFetch("/api/friends/request", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ username: viewedUsername }),
                    });
                    const data = await res.json();
                    if (data.success) pongAlert("Request sent!", "success");
                    else pongAlert("Unable to send the request.", "error");
                } catch {
                    pongAlert("Network error.", "error");
                }
            };
            list.append(addFriendBtn);
        }
    }
    return main;
}

async function loadProfileData(
    picture: HTMLImageElement,
    loginLabel: HTMLElement,
    emailLabel: HTMLElement,
    stats: HTMLTextAreaElement,
	// statsChart: HTMLCanvasElement,
    friendsList: HTMLElement | null,
    requestsBox: HTMLElement | null,
    viewedUsername: string
) {
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
//      --- Ajout Yoann Dashboard ---

		// const friendsCount = user.friendsCount ?? 0;
		// const winsCount = user.matchesWonCount ?? 0;
		// drawProfileStatsChart(statsChart, friendsCount, winsCount);

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
        const friendsRes = await apiFetch("/api/friends", {
            credentials: "include",
        });
        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
            (friendsData.data as FriendSummary[]).forEach((friend) => {
                const li = el("li", "flex items-center justify-between gap-2");

                // Bloc gauche : pastille + label
                const left = el("div", "flex items-center gap-2");

                const dot = el("a", "cursor-pointer") as HTMLAnchorElement;
                dot.href = `#/profile/${friend.username}`;
                dot.style.display = "inline-block";
                dot.style.width = "10px";
                dot.style.height = "10px";
                dot.style.borderRadius = "50%";
                dot.style.backgroundColor = friend.online ? "#22c55e" : "#9ca3af";
                left.append(dot);

                const label = el("a", "cursor-pointer") as HTMLAnchorElement;
                label.textContent = `${friend.username} – ${
                    friend.online ? "Online" : "Offline"
                }`;
                label.href = `#/profile/${friend.username}`;

                left.append(label);

                // Bouton Remove
                const removeBtn = el("button", "btn-click ml-2") as HTMLButtonElement;
                removeBtn.textContent = "Remove";
                removeBtn.onclick = async () => {
                    const sure = confirm(
                        `Supprimer ${friend.username} de votre liste d'amis ?`
                    );
                    if (!sure) return;

                    try {
                        const res = await apiFetch(`/api/friends/${friend.id}`, {
                            method: "DELETE",
                            credentials: "include",
                        });
                        if (!res.ok) {
                            console.error("Failed to remove friend", await res.text());
                            pongAlert("Impossible de supprimer cet ami.", "error");
                            return;
                        }
                        await loadFriends(friendsList, requestsBox);
                    } catch (err) {
                        console.error("Erreur suppression ami :", err);
                        pongAlert("Erreur réseau lors de la suppression.", "error");
                    }
                };

                li.append(left, removeBtn);
                friendsList.append(li);
            });
        }

        // --- Demandes reçues ---
        const requestsRes = await apiFetch("/api/friends/requests", {
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
                    await apiFetch(`/api/friends/${req.id}`, {
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
                    await apiFetch(`/api/friends/${req.id}`, {
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


// // --- Ajout Yoann Dashboard ----
// function drawProfileStatsChart(
//     canvas: HTMLCanvasElement,
//     friends: number,
//     wins: number
// ) {
//     const maybeCtx = canvas.getContext("2d");

//     if (!maybeCtx) {
//         console.warn("Canvas 2D context non disponible.");
//         return;
//     }

//     // À partir d’ici, ctx est typé CanvasRenderingContext2D (plus de null)
//     const ctx: CanvasRenderingContext2D = maybeCtx;

//     // Support retina / HiDPI
//     const dpr = window.devicePixelRatio || 1;
//     const cssWidth = canvas.clientWidth || 300;
//     const cssHeight = canvas.clientHeight || 160;
//     canvas.width = cssWidth * dpr;
//     canvas.height = cssHeight * dpr;
//     ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

//     const width = cssWidth;
//     const height = cssHeight;

//     ctx.clearRect(0, 0, width, height);

//     const padding = 24;
//     const chartWidth = width - padding * 2;
//     const chartHeight = height - padding * 2;

//     const maxValue = Math.max(friends, wins, 1);

//     // Axes
//     ctx.strokeStyle = "#000000";
//     ctx.lineWidth = 1;
//     ctx.beginPath();
//     ctx.moveTo(padding, padding);
//     ctx.lineTo(padding, padding + chartHeight);
//     ctx.lineTo(padding + chartWidth, padding + chartHeight);
//     ctx.stroke();

//     const barWidth = chartWidth / 4;

//     function drawBar(index: number, value: number, label: string) {
//         const x = padding + barWidth * (index * 1.5 + 0.5);
//         const barHeight = (value / maxValue) * (chartHeight - 20);
//         const y = padding + chartHeight - barHeight;

//         // Barre
//         ctx.fillStyle = "#111827"; // gris sombre neutre
//         ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

//         // Valeur au-dessus
//         ctx.fillStyle = "#000000";
//         ctx.font = "12px system-ui, sans-serif";
//         ctx.textAlign = "center";
//         ctx.textBaseline = "bottom";
//         ctx.fillText(String(value), x, y - 4);

//         // Label en dessous
//         ctx.textBaseline = "top";
//         ctx.fillText(label, x, padding + chartHeight + 4);
//     }

//     drawBar(0, friends, "Friends");
//     drawBar(1, wins, "Wins");
// }

