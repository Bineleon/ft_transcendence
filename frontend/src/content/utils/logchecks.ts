import { el, text } from "../home";
import type { PlayerInfo } from "../pong/game/types";
import { addUserAsPlayerToTournament, getLoggedName, getUserDatas } from "./todb";
import { apiFetch } from "../utils/apiFetch";

// ALERT SIMPLE (message + bouton)
type AlertOptions = {
    title?: string;
    onClose?: () => void; // in milliseconds
    where?: string;
};

type SimpleAlertDOM = {
    overlay: HTMLDivElement;
    box: HTMLDivElement;
    title: HTMLDivElement;
    message: HTMLParagraphElement;
    button: HTMLButtonElement;
};
let simpleAlertDOM: SimpleAlertDOM | null = null;

// RELOG (login + password + 2FA + boutons)
type ReLogDOM = {
    overlay: HTMLDivElement;
    box: HTMLDivElement;
    title: HTMLDivElement;
    tournamentRegLogged: HTMLButtonElement;
    tournamentRegNew: HTMLButtonElement;
    or: HTMLDivElement;
    inputGuest: HTMLInputElement;
    inputLogin: HTMLInputElement;
    inputPassword: HTMLInputElement;
    input2FA: HTMLInputElement;
    submitButton: HTMLButtonElement;
    googleSignIn: HTMLButtonElement;
    registerButton: HTMLButtonElement;
};
let reLogDOM: ReLogDOM | null = null;

export const closeOverlay = (overlay: HTMLDivElement) => {
    overlay.classList.add("hidden");
    document.body.classList.remove("no-scroll");
};

export async function notLoggedIn(): Promise<boolean> {
    try {
        const resp = await apiFetch(`/api/auth/loggedIn`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await resp.json();

        if (resp.ok) {
            return data as boolean;
        } else {
            return true;
        }
    } catch (error) {
        console.error("Profile apiFetch error:", error);
        pongAlert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`);
        throw error;
    }
}

function createSimpleAlertDOM(): SimpleAlertDOM {
    if (simpleAlertDOM) return simpleAlertDOM;

    const overlay = el("div", "alert-overlay hidden") as HTMLDivElement;
    const box = el("div", "alert-box") as HTMLDivElement;
    const title = el("div", "alert-title") as HTMLDivElement;
    const message = el("p", "alert-message") as HTMLParagraphElement;
    const button = el("button", "alert-button") as HTMLButtonElement;
    button.textContent = "OK";

    box.append(title, message, button);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    simpleAlertDOM = { overlay, box, title, message, button };
    return simpleAlertDOM;
}

export function pongAlert(mess: string, options?: AlertOptions): void {
    const { overlay, title, message, button } = createSimpleAlertDOM();

    title.textContent = options?.title ?? "Alert";
    message.textContent = mess;

    overlay.classList.remove("hidden");
    document.body.classList.add("no-scroll");

    button.onclick = () => {
        closeOverlay(overlay);
        if (options?.where) {
            window.location.hash = options.where;
        }
        if (options?.onClose) {
            options.onClose();
        }
    };
}

// ----------- Re-Login / Register Alert Box ----------- //
function createRelogRegisterDOM(mode: "RELOG" | "REGISTER" | "JOIN"): ReLogDOM {
    if (reLogDOM) return reLogDOM;

    const overlay = el("div", "alert-overlay whitespace-pre-line hidden") as HTMLDivElement;
    const box = el("div", "alert-box") as HTMLDivElement;
    const title = el("div", "alert-title") as HTMLDivElement;
    
    const tournamentRegLogged = el("button", "alert-button hidden") as HTMLButtonElement;
    tournamentRegLogged.type = "button";
    tournamentRegLogged.textContent = "Join as Logged User";

    const tournamentRegNew = el("button", "alert-button hidden") as HTMLButtonElement;
    tournamentRegNew.type = "button";
    tournamentRegNew.textContent = "Join as New User";

    const inputGuest = el("input", "btn-input") as HTMLInputElement;
    inputGuest.type = "text";
    inputGuest.placeholder = "Guest Name";

    const inputLogin = el("input", "btn-input") as HTMLInputElement;
    inputLogin.type = "text";
    inputLogin.placeholder = "Login";

    const inputPassword = el("input", "btn-input") as HTMLInputElement;
    inputPassword.type = "password";
    inputPassword.placeholder = "Password";

    const submitButton = el("button", "alert-button") as HTMLButtonElement;
    submitButton.type = "button";
    submitButton.textContent = "Log In";

    const input2FA = el("input", "btn-input hidden") as HTMLInputElement;
    input2FA.type = "text";
    input2FA.placeholder = "Submit 2FA";

    const or = el("div", "alert-title text-center text-base my-2", text("OR")) as HTMLDivElement;

    const googleSignIn = el("button", "alert-button") as HTMLButtonElement;
    googleSignIn.type = "button";
    googleSignIn.textContent = "Sign in with Google";

    googleSignIn.addEventListener("click", () => {
        // On prend la route courante (hash) comme state
        const currentHash = window.location.hash || "#/";
        const state = encodeURIComponent(currentHash);
        window.location.href = `/api/auth/google?state=${state}`;
    });
    const registerButton = el("button", "alert-button") as HTMLButtonElement;
    registerButton.type = "button";
    registerButton.textContent = "Register";
    registerButton.onclick = () => {
        closeOverlay(overlay);
        window.location.href = "#/login";
    };

    if (mode === "RELOG") {
        tournamentRegLogged.classList.add("hidden");
        tournamentRegNew.classList.add("hidden");
        or.classList.add("hidden");
        googleSignIn.classList.add("hidden");
        registerButton.classList.add("hidden");
    } else if (mode === "REGISTER") {
        inputLogin.classList.add("hidden");
        inputPassword.classList.add("hidden");
        input2FA.classList.add("hidden");
        submitButton.classList.add("hidden");
    }


    box.append(title, tournamentRegLogged, tournamentRegNew, inputGuest, inputLogin,
            inputPassword, input2FA, submitButton, or, googleSignIn, registerButton);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    reLogDOM = { overlay, box, title, tournamentRegLogged, tournamentRegNew, or,
        inputGuest, inputLogin, inputPassword, input2FA, submitButton, googleSignIn, registerButton };
    return reLogDOM;
}

export function reLogAlert(message?: string): void {
    const { overlay, title, tournamentRegLogged, tournamentRegNew, or,
        inputGuest, inputLogin, inputPassword, input2FA, submitButton, googleSignIn, registerButton } = createRelogRegisterDOM("RELOG");

    if (message) {
        title.textContent = message;
    } else {
        title.textContent = `Session Expired.
        Please log in again.`;
    }


    inputGuest.classList.add("hidden");
    inputLogin.classList.remove("hidden");
    inputPassword.classList.remove("hidden");
    input2FA.classList.add("hidden");
    inputLogin.value = "";
    inputPassword.value = "";
    input2FA.value = "";
    delete input2FA.dataset.userId;
    submitButton.classList.remove("hidden");
    submitButton.disabled = false;
    submitButton.textContent = "Log In";
    or!.classList.add("hidden");
    registerButton!.classList.add("hidden");
    googleSignIn!.classList.remove("hidden");

    tournamentRegLogged!.classList.add("hidden");
    tournamentRegNew!.classList.add("hidden");

    overlay.classList.remove("hidden");


    if (message === "P1" || message === "P2") {
        inputGuest.classList.remove("hidden");
        inputLogin.classList.add("hidden");
        inputPassword.classList.add("hidden");
        submitButton.textContent = "Play as Guest";
        or.classList.add("hidden");
        registerButton.classList.add("hidden");
        googleSignIn.classList.add("hidden");

        const guestName = inputGuest.value.trim();
        if (!guestName) {
            pongAlert("Please enter a guest name.");
            submitButton.disabled = false;
        } else {
            pongAlert(`Playing as Guest: ${guestName}`);
            closeOverlay(overlay);
        }
    }


    // Handlers aux clics
    const handleSubmit = async (): Promise<void> => {
        try {
            if (!input2FA.classList.contains("hidden")) {
                or.classList.add("hidden");
                registerButton.classList.add("hidden");
                
                const code = input2FA.value.trim();
                const userId = input2FA.dataset.userId;
                if (!code || !userId) {
                    pongAlert("Please enter the 2FA code.");
                    submitButton.disabled = false;
                }
                const resp = await apiFetch("/api/auth/verify-2fa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, code }),
                    credentials: "include"
                });
                if (resp.ok) {
                    pongAlert("2FA verified! Login successful.");
                    closeOverlay(overlay);
                    window.location.reload();
                } else {
                    closeOverlay(overlay);
                    reLogAlert(`Wrong 2FA code.
                        Please try again.`);
                    submitButton.disabled = false;
                }
            }

            // Phase login
            const username = inputLogin.value.trim();
            const password = inputPassword.value;
            if (!username || !password) {
                pongAlert("Please fill in all fields.");
                submitButton.disabled = false;
            }

            const resp = await apiFetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
                credentials: "include"
            });
            const data = await resp.json().catch(() => ({}));

            if (resp.ok) {
                // server asks for 2FA (same behavior as login.ts)
                input2FA.classList.remove("hidden");
                input2FA.dataset.userId = data.data?.userId ?? "";
                input2FA.focus();
                submitButton.textContent = "Submit";
                pongAlert(`Login successful! Please enter your 2FA code.`);
            } else {
                closeOverlay(overlay);
                reLogAlert(`Wrong Credentials.
                    Please try again.`);
                submitButton.disabled = false;
            }
        } catch (err) {
            console.error("reLogAlert submit error:", err);
            pongAlert(`An error occurred: ${err instanceof Error ? err.message : 'Network error'}`);
            submitButton.disabled = false;
        }
    };

    // attach handler (remove previous to avoid duplicates)
    submitButton.onclick = handleSubmit;
    // allow Enter on inputs to trigger submit
    [inputLogin, inputPassword, input2FA].forEach((inp) => {
        if (!inp) return;
        inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } };
    });
}

export function registerAlertBox(tCode: string): void {
    const { overlay, title, tournamentRegLogged, tournamentRegNew, or,
        inputGuest, inputLogin, inputPassword, input2FA, submitButton, registerButton } = createRelogRegisterDOM("REGISTER");

    title.textContent = `Register for Tournament ${tCode}`;

    tournamentRegLogged.classList.remove("hidden");
    tournamentRegNew.classList.remove("hidden");
    or.classList.remove("hidden");
    inputLogin.classList.add("hidden");
    inputPassword.classList.add("hidden");
    input2FA.classList.add("hidden");
    submitButton.classList.add("hidden");
    registerButton.classList.add("hidden");
    inputGuest.classList.add("hidden");

    overlay.classList.remove("hidden");

    // Handlers aux clics
    tournamentRegLogged.onclick = async () => {
        getLoggedName().then((name) => {
            if (name) {
                closeOverlay(overlay);
                if (name) {
                    addUserAsPlayerToTournament(tCode, name);
                } else {
                    pongAlert("Could not retrieve logged user information.");
                }
                window.location.reload();
            } else {
                closeOverlay(overlay);
                reLogAlert("Please log in to join the tournament.");
            }
        });
    };

    tournamentRegNew.onclick = () => {
        tournamentRegLogged.classList.add("hidden");
        tournamentRegNew.classList.add("hidden");
        or.classList.add("hidden");
        inputLogin.classList.remove("hidden");
        inputPassword.classList.remove("hidden");
        submitButton.classList.remove("hidden");
        submitButton.disabled = false;
        submitButton.textContent = "Register";
        // registerButton.classList.add("hidden");

        let currentUserId: string | null = null;   // ⬅️ au lieu de currentLogin uniquement
        let currentLogin: string | null = null;

        // New submit handler for registration
        const handleRegister = async (): Promise<void> => {
            try {
                submitButton.disabled = true;
                const visible2FA = !input2FA.classList.contains("hidden");

                if (!visible2FA) {
                    const username = inputLogin.value.trim();
                    const password = inputPassword.value;
                    if (!username || !password) {
                        pongAlert("Please fill in all fields.");
                        submitButton.disabled = false;
                        return;
                    }

                    const resp = await apiFetch(`/api/tournament/${tCode}/join`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username, password }),
                        credentials: "include"
                    });
                    const data = await resp.json().catch(() => ({}));

                    if (resp.ok) {
                        pongAlert("Registration successful! You are now logged in.");
                        closeOverlay(overlay);
                        await addUserAsPlayerToTournament(username, tCode);
                        window.location.reload();
                    } else {
                        closeOverlay(overlay);
                        registerAlertBox(tCode);
                        pongAlert(`Registration failed: ${data.error?.message || data.message || 'Unknown error'}`);
                        submitButton.disabled = false;
                    }
                }

                const code = input2FA.value.trim();
                if (!code) {
                    pongAlert("Please enter the 2FA code.");
                    input2FA.classList.remove("hidden");
                    submitButton.classList.remove("hidden");
                    submitButton.disabled = false;
                    return;
                }

                const verifyResp = await apiFetch("/api/auth/verify-2fa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: currentUserId, code }),
                    credentials: "include"
                });

                const verifyData = await verifyResp.json();
                if (verifyResp.ok) {
                    pongAlert("2FA verified! Registration and login successful.");
                    closeOverlay(overlay);
                    // await addUserAsPlayerToTournament(tCode, currentLogin || "");
                    // window.location.reload();
                    return;
                } else {
                    closeOverlay(overlay);
                    registerAlertBox(tCode);
                    pongAlert(`2FA verification error: ${verifyData.error?.message || verifyData.message || 'Unknown error'}`);
                    submitButton.disabled = false;
                }

                const errorMessage = verifyData.error?.message || verifyData.message || "Invalid 2FA code";
                pongAlert(`2FA verification error: ${errorMessage}`);
                submitButton.disabled = false;
            } catch (err) {
                console.error("registerAlertBox submit error:", err);
                pongAlert(`An error occurred: ${err instanceof Error ? err.message : 'Network error'}`);
                submitButton.disabled = false;
            }
        };
        
        // attach handler (remove previous to avoid duplicates)
        submitButton.onclick = handleRegister;
        // allow Enter on inputs to trigger submit
        [inputLogin, inputPassword, input2FA].forEach((inp) => {
            if (!inp) return;
            inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleRegister(); } };
        });
    };
    return;
}

export function matchAlert(mode: "sync" | "guest"): Promise<PlayerInfo | null> {
    return new Promise((resolve) => {
    const { overlay, title, tournamentRegLogged, tournamentRegNew, or,
        inputGuest, inputLogin, inputPassword, input2FA, submitButton, registerButton, googleSignIn } = createRelogRegisterDOM("REGISTER");
    if (mode === "sync") {
        title.textContent = `Sync Profile for Match`;
        tournamentRegLogged.classList.add("hidden");
        tournamentRegNew.classList.add("hidden");
        or.classList.add("hidden");
        inputGuest.classList.add("hidden");
        inputLogin.classList.remove("hidden");
        inputPassword.classList.remove("hidden");
        submitButton.classList.remove("hidden");
        submitButton.disabled = false;
        submitButton.textContent = "Sync Profile";
        registerButton.classList.add("hidden");
        googleSignIn!.classList.remove("hidden");
        googleSignIn.textContent = "Sync with Google";
    } else if (mode === "guest") {
        title.textContent = `Play as Guest for Match`;
        tournamentRegLogged.classList.add("hidden");
        tournamentRegNew.classList.add("hidden");
        or.classList.add("hidden");
        inputGuest.classList.remove("hidden")
        inputLogin.classList.add("hidden");
        inputPassword.classList.add("hidden");
        input2FA.classList.add("hidden");
        submitButton.classList.remove("hidden");
        submitButton.disabled = false;
        submitButton.textContent = "Play as Guest";
        registerButton.classList.add("hidden");
        googleSignIn!.classList.add("hidden");
    }

    overlay.classList.remove("hidden");

    function finish(info: PlayerInfo | null) {
        closeOverlay(overlay);
        resolve(info);
    }

    let currentUserId: string | null = null;   // ⬅️ au lieu de currentLogin uniquement
    let currentLogin: string | null = null;

    const handleSubmit = async (): Promise<void> => {
        try {
            submitButton.disabled = true;

            const visible2FA = !input2FA.classList.contains("hidden");

            // MODE GUEST
            if (mode === "guest") {
                const guestName = inputGuest.value.trim();
                if (!guestName) {
                    pongAlert("Please enter a valid guest name.");
                    submitButton.disabled = false;
                    return;
                }
                finish({ userName: guestName, avatarUrl: "/imgs/avatar.png" });
                return;
            }

            // PHASE 1 : login/password (comme login.ts)
            if (!visible2FA) {
                const username = inputLogin.value.trim();
                const password = inputPassword.value;

                if (!username || !password) {
                    pongAlert("Please fill in all fields.");
                    submitButton.disabled = false;
                    return;
                }

                const resp = await apiFetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),  // ⬅️ même payload que login.ts
                    credentials: "include",
                });

                const data = await resp.json();

                if (resp.ok) {
                    currentLogin = username;
                    currentUserId = data.data?.userId || null;     // ⬅️ récupérer userId
                    input2FA.classList.remove("hidden");
                    input2FA.dataset.userId = currentUserId || "";
                    submitButton.textContent = "Submit";
                    pongAlert("Login successful! Please enter your 2FA code sent by email.");
                    submitButton.disabled = false;
                    return;
                }

                const errorMessage = data.error?.message || data.message || "Login failed";
                pongAlert(`Login failed: ${errorMessage}`);
                submitButton.disabled = false;
                return;
            }

            // PHASE 2 : vérif 2FA (comme login.ts)
            const code = input2FA.value.trim();
            if (!code) {
                pongAlert("Please enter the 2FA code.");
                submitButton.disabled = false;
                return;
            }

            if (!currentUserId) {
                pongAlert("Missing userId, please try again.");
                submitButton.disabled = false;
                return;
            }

            const verifyResp = await apiFetch("/api/auth/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUserId, code }),   // ⬅️ userId, pas login
                credentials: "include",
            });

            const verifyData = await verifyResp.json();

            if (verifyResp.ok) {
                const user = await getUserDatas(currentLogin || "");
                const info: PlayerInfo = {
                    userName: user ? user.userName : (currentLogin || "Player"),
                    avatarUrl: user?.avatarUrl || "/imgs/avatar.png",
                };
                pongAlert("2FA verified! Login Successful.");
                finish(info);
                return;
            }

            const errorMessage = verifyData.error?.message || verifyData.message || "Invalid 2FA code";
            pongAlert(`2FA verification error: ${errorMessage}`);
            submitButton.disabled = false;
        } catch (err) {
            console.error("matchAlert submit error:", err);
            pongAlert("An error occurred. Please try again.");
            submitButton.disabled = false;
        }
    };
    // attach handler (remove previous to avoid duplicates)
    submitButton.onclick = handleSubmit;
});
}