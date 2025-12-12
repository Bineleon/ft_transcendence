import { el, text } from "../home";
import type { PlayerInfo } from "../pong/game/types";
import { addUserAsPlayerToTournament, getLoggedName, getUserDatas } from "./todb";
import type { Tournament } from "../tournament/uiTypes";
import { apiFetch } from "./apiFetch";

///////////////     WRAPPERS     ////////////////////
export const closeOverlay = (overlay: HTMLDivElement) => {
    overlay.classList.add("hidden");
    document.body.classList.remove("no-scroll");
};

export async function matchAlert(mode: "sync" | "guest"): Promise<PlayerInfo | null> {
    if (mode === "guest") {
        const res = await runAuthBox("M_GUEST");
        if (res.kind === "guest") {
            return { userName: res.userName, avatarUrl: "/imgs/avatar.png" };
        }
        return null;
    }

    const res = await runAuthBox("M_SYNC");
    if (res.kind === "logged") {
        return { userName: res.userName, avatarUrl: res.avatarUrl };
    }
    return null;
}

// ---------------------------------------------------- //
//              Simple PONG ALERT                       //
// ---------------------------------------------------- //
// ALERT SIMPLE (message + bouton)
type AlertOptions = {
    title?: string;
    onClose?: () => void; // in milliseconds
    where?: string;
};

type AlertKind = "info" | "error" | "success";

type PongAlertDOM = {
    overlay: HTMLDivElement;
    box: HTMLDivElement;
    title: HTMLDivElement;
    message: HTMLParagraphElement;
    button: HTMLButtonElement;
    closeBtn?: HTMLButtonElement;
};
let pongAlertDOM: PongAlertDOM | null = null;

function createPongAlertDOM(): PongAlertDOM {
    if (pongAlertDOM) return pongAlertDOM;

    const overlay = el("div", "alert-overlay hidden") as HTMLDivElement;
    const box = el("div", "alert-box") as HTMLDivElement;
    const title = el("div", "alert-title") as HTMLDivElement;
    const message = el("p", "alert-message") as HTMLParagraphElement;
    const button = el("button", "alert-button") as HTMLButtonElement;
    const closeBtn = el("button", "alert-close-button") as HTMLButtonElement;
    closeBtn.textContent = "✕";
    button.textContent = "OK";
    closeBtn.onclick = () => { closeOverlay(overlay); };
    box.append(closeBtn, title, message, button);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    pongAlertDOM = { overlay, box, title, message, button, closeBtn };
    return pongAlertDOM;
}

export function pongAlert(mess: string, kind?: AlertKind, options?: AlertOptions): void {
    const { overlay, title, message, button } = createPongAlertDOM();

    title.textContent = kind ?? "- Pong Alert -";
    message.textContent = mess;

    overlay.classList.remove("hidden");
    // document.body.classList.add("no-scroll");

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
// ---------------------------------------------------- //


// ---------------------------------------------------- //
//              Auth Multi Modes AlertBOX               //
// ---------------------------------------------------- //
///////////////     ALERT MODES     ////////////////
export type AuthMode =
  | "LOGIN"         // LOGIN : juste login + 2FA -> Log In
  | "M_SYNC"        // MATCH : lier un compte au P1/P2
  | "M_GUEST"       // MATCH : pseudo invité
  | "JOIN";     // TOURNAMENT : join tournament as new User, login + 2FA -> No Log

/// Definir les retours possibles
export type AuthResult =
  | { kind: "logged"; userName: string; }
  | { kind: "guest"; id?: string; userName?: string; avatarUrl?: string; }
  | { kind: "sync"; id?: string; userName?: string; avatarUrl?: string; }
  | { kind: "join"; userName: string; }
  | { kind: "cancel" }
  | { kind: "unregister"; userName: string; };
  

//////////////      DOMs        ////////////////
// Tout les DOMs de la boite d'Alerte
type AuthDom = {
    overlay: HTMLDivElement;
    box: HTMLDivElement;
    title: HTMLDivElement;

    inputGuest: HTMLInputElement;
    inputLogin: HTMLInputElement;
    inputPassword: HTMLInputElement;
    input2FA: HTMLInputElement;

    submitBtn: HTMLButtonElement;       // Btn principal (login / guest/ verify/ join)
    altBtn: HTMLButtonElement;          // Btn secondaire si multi-choix
    googleBtn: HTMLButtonElement;       // Google Sign-In
    closeBtn: HTMLButtonElement;        // pour Close une alerte
};
let authDom: AuthDom | null = null;

function createAuthDOMs(): AuthDom {
    if (authDom) return authDom;

    const overlay = el("div", "alert-overlay whitespace-pre-line hidden") as HTMLDivElement;
    const box = el("div", "alert-box") as HTMLDivElement;

    const title = el("div", "alert-title") as HTMLDivElement;

    const inputGuest = el("input", "btn-input") as HTMLInputElement;
    inputGuest.type = "text";
    inputGuest.placeholder = "Guest Name";

    const inputLogin = el("input", "btn-input") as HTMLInputElement;
    inputLogin.type = "text";
    inputLogin.placeholder = "Login";

    const inputPassword = el("input", "btn-input") as HTMLInputElement;
    inputPassword.type = "password";
    inputPassword.placeholder = "Password";

    const input2FA = el("input", "btn-input hidden") as HTMLInputElement;
    input2FA.type = "text";
    input2FA.placeholder = "2FA Code";

    const submitBtn = el("button", "alert-button") as HTMLButtonElement;
    submitBtn.type = "button";
    submitBtn.textContent = "Submit";

    const altBtn = el("button", "alert-button hidden") as HTMLButtonElement;
    altBtn.type = "button";
    altBtn.textContent = "Alternative";

    const googleBtn = el("button", "alert-button hidden") as HTMLButtonElement;
    googleBtn.type = "button";
    googleBtn.textContent = "Sign in with Google";

    const closeBtn = el("button", "alert-close") as HTMLButtonElement;
    closeBtn.type = "button";
    closeBtn.textContent = "✕";

    // Assemblage
    box.append(
        closeBtn,
        title,
        inputGuest,
        inputLogin,
        inputPassword,
        input2FA,
        submitBtn,
        altBtn,
        googleBtn
    );
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    authDom = {
        overlay,
        box,
        title,
        inputGuest,
        inputLogin,
        inputPassword,
        input2FA,
        submitBtn,
        altBtn,
        googleBtn,
        closeBtn,
    };

    return authDom;
}

///////////////      Config       ////////////////
type AuthBehavior = "guest" | "login" | "sync" | "join";

interface AuthUiConfig {
    title: string;
    showGuestInput: boolean;
    showLoginInputs: boolean;   // login + password
    show2FA: boolean;           // au départ (souvent false)
    showGoogleBtn: boolean; 
    showAltBtn: boolean;
    submitLabel: string;
    altLabel?: string;
    behavior: AuthBehavior;
}

const AUTH_CONFIG: Record<AuthMode, AuthUiConfig> = {
    LOGIN: {
        title: "Log in to your account",
        showGuestInput: false,
        showLoginInputs: true,
        show2FA: false,
        showGoogleBtn: true,
        showAltBtn: false,
        submitLabel: "Log In",
        behavior: "login",
    },
    M_SYNC: {
        title: "Sync your profile for this match",
        showGuestInput: false,
        showLoginInputs: true,
        show2FA: false,
        showGoogleBtn: false,
        showAltBtn: false,
        submitLabel: "Sync Profile",
        behavior: "sync",
    },
    M_GUEST: {
        title: "Play as Guest",
        showGuestInput: true,
        showLoginInputs: false,
        show2FA: false,
        showGoogleBtn: false,
        showAltBtn: false,
        submitLabel: "Play as Guest",
        behavior: "guest",
    },
    JOIN: {
        title: "Join the tournament",
        showGuestInput: false,
        showLoginInputs: true,
        show2FA: false,
        showGoogleBtn: false,
        showAltBtn: false,
        submitLabel: "Submit",
        behavior: "join",
    }
};

function setupAuthUi(mode: AuthMode, dom: AuthDom): AuthUiConfig {
    const config = AUTH_CONFIG[mode];

    dom.title.textContent = config.title;

    dom.inputGuest.classList.toggle("hidden", !config.showGuestInput);
    dom.inputLogin.classList.toggle("hidden", !config.showLoginInputs);
    dom.inputPassword.classList.toggle("hidden", !config.showLoginInputs);
    // 2FA toujours caché au début, sauf si show2FA === true (mode spécial)
    dom.input2FA.classList.toggle("hidden", !config.show2FA);

    dom.googleBtn.classList.toggle("hidden", !config.showGoogleBtn);

    dom.submitBtn.textContent = config.submitLabel;
    dom.submitBtn.disabled = false;

    dom.altBtn.textContent = config.altLabel ?? "";
    dom.altBtn.classList.toggle("hidden", !config.showAltBtn);

    dom.overlay.classList.remove("hidden");
    // document.body.classList.add("no-scroll");

    return config;
}


///////////////      Main Fn      ////////////////
type RunAuthBoxOptions = {tournament?: Tournament, tCode?: string, onClick?: () => void};

export function runAuthBox(mode: AuthMode, options?: RunAuthBoxOptions): Promise<AuthResult> {
    return new Promise((resolve) => {
        const dom = createAuthDOMs();
        const config = setupAuthUi(mode, dom);        
        const tCode = options?.tCode ?? null;
        const t = options?.tournament ?? null;

        let currentUserId: string | null = null;
        let currentLogin: string | null = null;

        let loggedName: string | null = null;
        let loggedAvatarUrl: string | null = null;

        // comportement au CLikc ( login / guest / join / sync )
        let handleSubmitBehavior: AuthBehavior = config.behavior;

        function finish(result: AuthResult): void {
            closeOverlay(dom.overlay);
            resolve(result);
        }

        dom.inputGuest.value = "";
        dom.inputLogin.value = "";
        dom.inputPassword.value = "";
        dom.input2FA.value = "";

        dom.closeBtn.onclick = () => { finish({ kind: "cancel" }); };
        dom.googleBtn.onclick = () => { window.location.href = "/api/auth/google"; }; 

        dom.submitBtn.onclick = async () => {
            try {
                dom.submitBtn.disabled = true;
                const twoFAVisible = !dom.input2FA.classList.contains("hidden");

                console.log("SubmitBehavior:", handleSubmitBehavior, "TwoFAVisible:", twoFAVisible, "Mode:", mode);

                // 1) M_GUEST /// Rejoindre un match simple
                if (handleSubmitBehavior === "guest") {
                    const guestName = dom.inputGuest.value.trim();
                    if (!guestName) {
                        pongAlert("Please enter a guest name.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }
                    finish({ kind: "guest", userName: guestName });
                    return;
                }

                // 2) MATCH SYNC - Utilisateur déjà loggué
                if (handleSubmitBehavior === "sync") {
                    dom.googleBtn.classList.add("hidden");

                    const userName = dom.inputLogin.value.trim();
                    if (!userName) {
                        pongAlert("Please enter your login to sync.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }
                    const password = dom.inputPassword.value;
                    if (!password) {
                        pongAlert("Please enter your password to sync.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }

                    const resp = await apiFetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: userName, password }),
                        credentials: "include",
                    });

                    const data = await resp.json();

                    if (!resp.ok) {
                        const msg = data.error?.message || data.message || "Login failed";
                        pongAlert(msg, "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }

                    currentLogin = userName;

                    console.log("Sync profile for logged user:", currentLogin);
                    const user = await getUserDatas(currentLogin).catch(() => null);
                    const avatarUrl = user?.data.user.avatarUrl || "/imgs/avatar.png";
                    finish({ kind: "sync", userName, avatarUrl });
                    return;
                }

                // 3) LOGIN -- Vrai Boite de LogIn
                if (handleSubmitBehavior === "login" && !twoFAVisible) {

                    const username = dom.inputLogin.value.trim();
                    const password = dom.inputPassword.value;
                    if (!username || !password) {
                        pongAlert("Please fill in all fields.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }

                    const resp = await apiFetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username, password }),
                        credentials: "include",
                    });

                    const data = await resp.json();

                    if (resp.ok) {
                        currentLogin = username;
                        currentUserId = data.data?.userId ?? null;
                        dom.input2FA.classList.remove("hidden");
                        dom.submitBtn.textContent = "Verify 2FA";
                        pongAlert("Login successful! Please enter your 2FA code sent by email.", "info");
                        dom.submitBtn.disabled = false;
                        return;
                    }

                    const msg = data.error?.message || data.message || "Login failed";
                    pongAlert(msg, "error");
                    dom.submitBtn.disabled = false;
                    return;
                }

                // 3bis) LOGIN - PHASE 2 (2FA)
                if (handleSubmitBehavior === "login" && twoFAVisible) {
                    const code = dom.input2FA.value.trim();
                    if (!code || !currentUserId) {
                        pongAlert("Missing 2FA code or userId.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }


                    const verifyResp = await apiFetch("/api/auth/verify-2fa", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: currentUserId, code }),
                        credentials: "include",
                    });

                    const verifyData = await verifyResp.json();
                    if (!verifyResp.ok) {
                        const msg = verifyData.error?.message || verifyData.message || "Invalid 2FA code";
                        pongAlert(msg, "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }
                    finish({ kind: "logged" });
                    return;
                }

                // 4) JOIN - Affiche Login/pswd puis 2FA, puis rejoint le tournoi == PAS DE LOG.
                if (handleSubmitBehavior === "join" && !twoFAVisible) {

                    dom.googleBtn.classList.add("hidden");
                    const username = dom.inputLogin.value.trim();
                    const password = dom.inputPassword.value;
                    if (!username || !password) {
                        pongAlert("Please fill in all fields.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }

                    const resp = await apiFetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username, password }),
                        credentials: "include",
                    });

                    const data = await resp.json();

                    if (resp.ok) {
                        currentLogin = username;
                        currentUserId = data.data?.userId ?? null;
                        dom.input2FA.classList.remove("hidden");
                        dom.submitBtn.textContent = "Verify 2FA";
                        pongAlert("Login successful! Please enter your 2FA code sent by email.", "info");
                        dom.submitBtn.disabled = false;
                        handleSubmitBehavior = "join";
                    }

                    const msg = data.error?.message || data.message || "Login failed";
                    pongAlert(msg, "error");
                    dom.submitBtn.disabled = false;
                    return;
                }

                // 4bis) JOIN - PHASE 2 (2FA)
                if (handleSubmitBehavior === "join" && twoFAVisible) {
                    dom.googleBtn.classList.add("hidden");
                    const code = dom.input2FA.value.trim();
                    if (!code || !currentUserId) {
                        pongAlert("Missing 2FA code or userId.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }

                    const verifyResp = await apiFetch("/api/auth/verify-2fa/nolog", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: currentUserId, code }),
                        credentials: "include",
                    });

                    const verifyData = await verifyResp.json();
                    if (!verifyResp.ok) {
                        const msg = verifyData.error?.message || verifyData.message || "Invalid 2FA code";
                        pongAlert(msg, "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }

                    // 2FA OK : on récupère les infos user
                    const user = currentLogin
                        ? await getUserDatas(currentLogin).catch(() => null)
                        : null;

                    const userName = user ? user.data.user.username : currentLogin || "Player";
                    const avatarUrl = user?.data.user.avatarUrl || "/imgs/avatar.png";

                    try {
                        await addUserAsPlayerToTournament(tCode, userName, t!);
                        finish({ kind: "join", userName, });
                    } catch (err) {
                        console.error("Join as logged user error:", err);
                        pongAlert("Failed to join tournament as logged user.", "error");
                        dom.submitBtn.disabled = false;
                    }
                    return;
                }

                console.warn("Unhandled auth flow case.", { handleSubmitBehavior, mode });
                dom.submitBtn.disabled = false;
            } catch (err) {
                console.error("runAuthBox error:", err);
                pongAlert("An error occurred. Please try again.", "error");
                dom.submitBtn.disabled = false;
            }
        };

        dom.altBtn.onclick = () => {
            // Pour l’instant, on ne l’utilise que pour JOIN
            if (mode === "JOIN") {
                // "Join as New" : on montre les inputs login/password,
                // on cache le reste, et on passe en behavior joinLogin
                dom.inputGuest.classList.add("hidden");
                dom.inputLogin.classList.remove("hidden");
                dom.inputPassword.classList.remove("hidden");
                dom.input2FA.classList.add("hidden");
                dom.altBtn.classList.add("hidden");
                dom.submitBtn.textContent = "Submit";

                handleSubmitBehavior = "join";
                dom.submitBtn.disabled = false;
                return;
            }

            // Si un jour tu veux réutiliser altBtn pour un mode "joinGuest" ou autre,
            // tu pourras ajouter des branches ici.
        };
    });
}






