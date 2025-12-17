import { pongAlert } from "../utils/alertBox.ts";
import { apiFetch } from "../utils/apiFetch.ts";

// Maximum size for avatar uploads (2 MB)
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

// Friend summary types
export type FriendSummary = {
    id: string;
    username: string;
    avatarUrl?: string | null;
    online: boolean;
};

export type FriendRequestSummary = FriendSummary & {
    createdAt?: string;
};

/**
 * Performs a logout by calling the API and redirecting the user.
 */
async function logout(): Promise<void> {
    try {
        const res = await apiFetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
        });
        if (res.ok) {
            pongAlert("You have been logged out.", "info");
            window.location.href = "#/login";
        } else {
            pongAlert("Logout failed.", "error");
        }
    } catch (err) {
        console.error("Logout error:", err);
        pongAlert("Network error during logout.", "error");
    }
}

/**
 * Deletes the current user's account by calling the API.
 * Returns true if the deletion succeeded.
 */
async function deleteAccount(): Promise<boolean> {
  try {
    const res = await apiFetch("/api/auth/delete-account", {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("Delete account error:", err);
    return false;
  }
}


/**
 * Loads the current user's friends and friend requests and populates
 * the given DOM elements. This function empties the lists before
 * repopulating them.
 */
export async function loadFriends(friendsList: HTMLElement, requestsBox: HTMLElement): Promise<void> {
    friendsList.innerHTML = "";
    requestsBox.innerHTML = "";

    // Title for friend requests
    const requestsTitle = document.createElement("h3");
    requestsTitle.className = "font-oldprint text-3xl lg:text-xl mb-4 text-right";
    requestsTitle.textContent = "Requests";
    requestsBox.append(requestsTitle);

    try {
        // Fetch accepted friends
        const friendsRes = await apiFetch("/api/friends", {
            credentials: "include",
        });
        const friendsData = await friendsRes.json();
        if (friendsData.success && Array.isArray(friendsData.data)) {
            (friendsData.data as FriendSummary[]).forEach((friend) => {
                const li = document.createElement("li");
                li.className = "flex items-center justify-between gap-2";

                // Left side: status dot and label
                const left = document.createElement("div");
                left.className = "flex items-center gap-2";

                const dot = document.createElement("a") as HTMLAnchorElement;
                dot.href = `#/profile/${friend.username}`;
                dot.style.display = "inline-block";
                dot.style.width = "10px";
                dot.style.height = "10px";
                dot.style.borderRadius = "50%";
                dot.style.backgroundColor = friend.online ? "#22c55e" : "#9ca3af";
                left.append(dot);

                const label = document.createElement("a") as HTMLAnchorElement;
                label.textContent = `${friend.username} – ${
                    friend.online ? "Online" : "Offline"
                }`;
                label.href = `#/profile/${friend.username}`;

                left.append(label);

                // Remove button
                const removeBtn = document.createElement("button") as HTMLButtonElement;
                removeBtn.className = "btn-click px-2 py-0";
                removeBtn.textContent = "Remove";
                removeBtn.onclick = async () => {
                    const sure = confirm(`Supprimer ${friend.username} de votre liste d'amis ?`);
                    if (!sure) return;
                    try {
                        const res = await apiFetch(`/api/friends/${friend.id}`, {
                            method: "DELETE",
                            credentials: "include",
                        });
                        if (!res.ok) {
                            console.error(
                                "Failed to remove friend",
                                await res.text()
                            );
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

        // Fetch incoming friend requests
        const requestsRes = await apiFetch("/api/friends/requests", {
            credentials: "include",
        });
        const requestsData = await requestsRes.json();
        if (requestsData.success && Array.isArray(requestsData.data)) {
            (requestsData.data as FriendRequestSummary[]).forEach((req) => {
                const reqDiv = document.createElement("div");
                reqDiv.className = "flex items-center mb-2 gap-2";

                const left = document.createElement("div");
                left.className = "flex items-center gap-2 flex-1";

                // Create avatar element
                if (req.avatarUrl) {
                    const img = document.createElement("img");
                    img.className = "w-8 h-8 rounded-full object-cover grayscale contrast-200";
                    img.src = req.avatarUrl;
                    img.alt = req.username;
                    left.appendChild(img);
                } else {
                    const avatarPlaceholder = document.createElement("div");
                    avatarPlaceholder.className = "w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center";
                    left.appendChild(avatarPlaceholder);
                }

                // Create name span
                const nameSpan = document.createElement("span");
                nameSpan.className = "font-modern-type text-lg";
                nameSpan.textContent = req.username;
                left.appendChild(nameSpan);

                const acceptBtn = document.createElement("button") as HTMLButtonElement;
                acceptBtn.className = "btn-click mr-2";
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

                const declineBtn = document.createElement("button") as HTMLButtonElement;
                declineBtn.className = "btn-click";
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

/**
 * Configures the profile view for the logged in user. Enables avatar editing,
 * shows editing options, privacy controls and friend management. It also
 * populates the friends list via loadFriends().
 */
export function setupSelfMode(
    loggedName: string,
    picture: HTMLImageElement,
    avatarInput: HTMLInputElement,
    hoverOverlay: HTMLElement,
    picframe: HTMLElement,
    friendsList: HTMLUListElement,
    requestsBox: HTMLElement,
    friendsContainer: HTMLElement,
    editBox: HTMLElement
): void {
    // Avatar is editable
    picture.setAttribute("aria-label", "Change avatar");
    picture.classList.add("cursor-pointer");
    picture.style.pointerEvents = "";

    function openFilePicker() {
        avatarInput.click();
    }

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
        if (file.size > MAX_AVATAR_SIZE) {
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
            pongAlert("Error while uploading your avatar.", "error");
        } finally {
            URL.revokeObjectURL(tmpUrl);
            avatarInput.value = "";
        }
    });

    // Profile options: settings, logout, delete account
    const settingsBtn = document.createElement("a") as HTMLAnchorElement;
    settingsBtn.className = "big-link cursor-pointer";
    settingsBtn.href = "#/settings";
    settingsBtn.textContent = "Edit Profile";

    const logoutBtn = document.createElement("button") as HTMLButtonElement;
    logoutBtn.className = "big-link";
    logoutBtn.textContent = "Logout";
    logoutBtn.onclick = () => {
        logout();
    };

    const deleteButton = document.createElement("button") as HTMLButtonElement;
    deleteButton.className = "big-link";
    deleteButton.textContent = "Supprimer mon compte";
    deleteButton.onclick = async () => {
        const sure = confirm(
            "This action is a one way ticket out. Are you sure ?"
        );
        if (!sure) return;
        const ok = await deleteAccount();
        if (ok) {
            window.location.href = "/#/home";
        } else {
            pongAlert("Impossible to delete account.", "error");
        }
    };

    // Privacy / GDPR controls
    const privacyBox = document.createElement("div");
    privacyBox.className = "mt-6 flex flex-col gap-2 border-t border-zinc-700 pt-4";
    const privacyTitle = document.createElement("h3");
    privacyTitle.className = "font-royalvogue text-2xl";
    privacyTitle.textContent = "Privacy / My Datas";

    // Blockchain stats button
    const getBlockchainBtn = document.createElement("button") as HTMLButtonElement;
    getBlockchainBtn.className = "big-link";
    getBlockchainBtn.textContent = "Stats from Blockchain";
    getBlockchainBtn.onclick = async () => {
        try {
            const res = await apiFetch("/api/users/me/blockchain-stats", {
                credentials: "include",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || "Impossible de charger les stats blockchain.";
                pongAlert(errorMsg, "error");
                return;
            }
            const body = await res.json();
            const data = body.data;
            
            // Format the blockchain data for display
            let message = `Tournament name: ${data.tournament.name}\n`;
            message += `Date: ${new Date(data.tournament.onchainAt).toLocaleString()}\n\n`;
            message += `Winner: ${data.blockchainData.winner}\n`;
            message += `Players: ${data.blockchainData.players.join(", ")}\n`;
            message += `Timestamp: ${new Date(data.blockchainData.timestamp).toLocaleString()}\n\n`;
            message += `Matches (${data.blockchainData.matches.length}):\n`;
            
            data.blockchainData.matches.forEach((match: any, i: number) => {
                message += `\nMatch ${i + 1}:\n`;
                message += `  ${match.player1} vs ${match.player2}\n`;
                message += `  Score: ${match.scorePlayer1} - ${match.scorePlayer2}\n`;
                message += `  Winner: ${match.winner}\n`;
            });
            
            // Use pongAlert and add whitespace-pre-line class to message element
            pongAlert(message, "info", { title: "Blockchain" });
            
            // Add CSS to preserve line breaks and add clickable link
            const alertMessage = document.querySelector('.alert-message');
            if (alertMessage) {
                (alertMessage as HTMLElement).style.whiteSpace = 'pre-line';
                
                // Add clickable link to Snowtrace
                const linkElement = document.createElement('a');
                linkElement.href = data.tournament.explorerUrl;
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                linkElement.textContent = 'Verify transaction on Snowtrace';
                linkElement.style.display = 'block';
                linkElement.style.marginTop = '10px';
                linkElement.style.color = '#3b82f6';
                linkElement.style.textDecoration = 'underline';
                linkElement.style.cursor = 'pointer';
                
                alertMessage.appendChild(linkElement);
            }
			
        } catch (err) {
            console.error(err);
            pongAlert("Erreur réseau lors de la récupération des stats blockchain.", "error");
        }
    };

    // View personal data
    const viewDataBtn = document.createElement("button") as HTMLButtonElement;
    viewDataBtn.className = "big-link";
    viewDataBtn.textContent = "Check on my personal datas.";
    viewDataBtn.onclick = async () => {
        try {
            const res = await apiFetch("/api/privacy/me", { credentials: "include" });
            if (!res.ok) {
                pongAlert("Impossible to load personal datas.");
                return;
            }
            const body = await res.json();
            const data = body.data;
            pongAlert(
                "Account datas:\n" +
                    JSON.stringify(data.user, null, 2) +
                    "\n\nCounts:\n" +
                    JSON.stringify(data.counts, null, 2)
            );
        } catch (err) {
            console.error(err);
            pongAlert("Network issue while loading personal datas.", "error");
        }
    };

    // Anonymize account
    const anonymizeBtn = document.createElement("button") as HTMLButtonElement;
    anonymizeBtn.className = "big-link";
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
            pongAlert("You are now anonymized", "success");
            window.location.href = "/#/login";
        } catch (err) {
            console.error(err);
            pongAlert("Network issue while anonymization.", "error");
        }
    };

    // Clear local storage
    const clearLocalBtn = document.createElement("button") as HTMLButtonElement;
    clearLocalBtn.className = "big-link";
    clearLocalBtn.textContent = "Supprimer mes données locales (navigateur)";
    clearLocalBtn.onclick = () => {
        localStorage.clear();
        sessionStorage.clear();
        pongAlert("localStorage / sessionStorage cleaned.", "info");
    };

    privacyBox.append(privacyTitle, getBlockchainBtn, viewDataBtn, anonymizeBtn, clearLocalBtn);
    // Insert the action buttons and privacy controls into the editBox.
    // Clear previous content and make the box visible
    editBox.innerHTML = "";
    editBox.classList.remove("hidden");
    editBox.append(settingsBtn, logoutBtn, deleteButton, privacyBox);

    // Friends: Add friend input and button
    const addFriendBox = document.createElement("div");
    addFriendBox.className = "mx-auto flex items-center";
    const addFriendInput = document.createElement("input") as HTMLInputElement;
    addFriendInput.className = "flex btn-input w-[70%] mr-2";
    addFriendInput.placeholder = "";

    const addFriendBtn = document.createElement("button") as HTMLButtonElement;
    addFriendBtn.className = "btn-click px-2 py-0";
    addFriendBtn.textContent = "Add";
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
            } else {
                pongAlert("Impossible d'envoyer la demande.", "error");
            }
        } catch {
            pongAlert("Erreur réseau.", "error");
        }
    };

    addFriendBox.append(addFriendInput, addFriendBtn);
    friendsContainer.append(addFriendBox);

    // Finally, load existing friends and requests
    loadFriends(friendsList, requestsBox);
}

/**
 * Configures the profile view for viewing another user. Disables avatar
 * editing and provides an option to send a friend request.
 */
export function setupOtherMode(
    viewedUsername: string,
    picture: HTMLImageElement,
    hoverOverlay: HTMLElement,
    friendsContainer: HTMLElement,
    editBox: HTMLElement,
	last7days : HTMLElement,
    lastScores : HTMLElement,
    last3Matches : HTMLElement,
    snakeStats : HTMLElement
): void {
    // Disable avatar editing
    picture.style.pointerEvents = "none";
    picture.classList.remove("cursor-pointer");
    hoverOverlay.classList.add("hidden");

    // Hide the edit box if viewing another profile
    if (editBox) {
        editBox.classList.add("hidden");
        editBox.innerHTML = "";
    }

    // Provide a button to add as friend if username is known
    if (viewedUsername) {
        const addFriendBtn = document.createElement("button") as HTMLButtonElement;
        addFriendBtn.className = "big-link mt-2";
        addFriendBtn.textContent = "Add";
        addFriendBtn.onclick = async () => {
            try {
                const res = await apiFetch("/api/friends/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ username: viewedUsername }),
                });
                const data = await res.json();
                if (data.success) {
                    pongAlert("Request sent!", "success");
                } else {
                    pongAlert("Unable to send the request.", "error");
                }
            } catch {
                pongAlert("Network error.", "error");
            }
        };
        friendsContainer.append(addFriendBtn);
    }
}
