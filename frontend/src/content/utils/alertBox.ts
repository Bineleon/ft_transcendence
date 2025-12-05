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
};
let pongAlertDOM: PongAlertDOM | null = null;

function createPongAlertDOM(): PongAlertDOM {
    if (pongAlertDOM) return pongAlertDOM;

    const overlay = el("div", "alert-overlay hidden") as HTMLDivElement;
    const box = el("div", "alert-box") as HTMLDivElement;
    const title = el("div", "alert-title") as HTMLDivElement;
    const message = el("p", "alert-message") as HTMLParagraphElement;
    const button = el("button", "alert-button") as HTMLButtonElement;
    button.textContent = "OK";

    box.append(title, message, button);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    pongAlertDOM = { overlay, box, title, message, button };
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
  | "JOIN"         // TOURNAMENT : login + 2FA -> No Log, just Join Tournament
  | "JOIN_NEW";

export type AuthResult =
  | { kind: "logged"; userName: string; userId: string; avatarUrl: string }
  | { kind: "guest"; userName: string }
  | { kind: "join"; userName: string; userId: string; avatarUrl: string }
  | { kind: "cancel" };
  

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
type AuthBehavior = "guest" | "login" | "sync" | "joinLogin" | "joinGuest" | "joinLogged";

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
        showGoogleBtn: true,
        showAltBtn: true,
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
        showLoginInputs: false,
        show2FA: false,
        showGoogleBtn: false,
        showAltBtn: true,
        submitLabel: "as Logged Player",
        altLabel: "as New Player",
        behavior: "joinLogin",
    },
    JOIN_NEW: {
        title: "Join the tournament",
        showGuestInput: false,
        showLoginInputs: true,
        show2FA: false,
        showGoogleBtn: true,
        showAltBtn: false,
        submitLabel: "as Logged Player",
        behavior: "joinLogin",
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


// -----------  Logique Principale    ----------- //
type RunAuthBoxOptions = {tournament?: Tournament, tCode?: string, onClick?: () => void};

export function runAuthBox(mode: AuthMode, options?: RunAuthBoxOptions): Promise<AuthResult> {
    return new Promise((resolve) => {
        const dom = createAuthDOMs();
        const config = setupAuthUi(mode, dom);
        
        const tCode = options?.tCode ?? null;

        let currentUserId: string | null = null;
        let currentLogin: string | null = null;

        let loggedName: string | null = null;
        let loggedAvatarUrl: string | null = null;

        // comportement courant, peut être modifié (JOIN -> guest)
        let handleSubmitBehavior: AuthBehavior = config.behavior;

        function finish(result: AuthResult): void {
            closeOverlay(dom.overlay);
            resolve(result);
        }

        dom.closeBtn.onclick = () => {
            finish({ kind: "cancel" });
        };

        dom.inputGuest.value = "";
        dom.inputLogin.value = "";
        dom.inputPassword.value = "";
        dom.input2FA.value = "";

        console.log("handleSubmitBehavior initial:", handleSubmitBehavior);
        
    // --- Cas particulier JOIN : si user déjà loggué, bouton direct --- //
        if (mode === "JOIN" && tCode) {
            getLoggedName().then(async (name) => {
                if (!name) {
                    dom.submitBtn.textContent = "Join the Tournament";
                    dom.altBtn.classList.add("hidden");
                    handleSubmitBehavior = "joinLogin";
                    return;
                }

                loggedName = name;
                const user = await getUserDatas(name).catch(() => null);
                loggedAvatarUrl = user?.data.user.avatarUrl || "/imgs/avatar.png";    // Je recccup l'avatar au cas ou si jamais j'ameliore plus tard :p

                dom.altBtn.textContent = "Join as New";
                dom.altBtn.classList.remove("hidden");
                
                dom.inputGuest.classList.add("hidden");
                dom.inputLogin.classList.add("hidden");
                dom.inputPassword.classList.add("hidden");
                dom.input2FA.classList.add("hidden");

                handleSubmitBehavior = "joinLogged";
            })
            .catch((err) => console.error("getLoggedName error:", err));
        }

        dom.googleBtn.onclick = () => {
            window.location.href = "/api/auth/google";
        };

        dom.submitBtn.onclick = async () => {
            try {
                dom.submitBtn.disabled = true;
                const twoFAVisible = !dom.input2FA.classList.contains("hidden");

                // 1) MODE INVITÉ
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

                // 2) JOIN en tant qu'utilisateur déjà loggué (JOIN + logged)
                if (handleSubmitBehavior === "joinLogged") {
                    if (!tCode || !loggedName) {
                        pongAlert("Missing logged user or tournament code.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }
                    try {
                        await addUserAsPlayerToTournament(tCode, loggedName, options!.tournament!);
                        finish({
                            kind: "join",
                            userName: loggedName,
                            userId: loggedName, // adapte si tu utilises un vrai userId côté front
                            avatarUrl: loggedAvatarUrl || "/imgs/avatar.png",
                        });
                    } catch (err) {
                        console.error("Join as logged user error:", err);
                        pongAlert("Failed to join tournament as logged user.", "error");
                        dom.submitBtn.disabled = false;
                    }
                    return;
                }

                // 3) JOIN invité (JOIN + pseudo guest) — si tu en as besoin un jour
                if (handleSubmitBehavior === "joinGuest") {
                    if (!tCode) {
                        pongAlert("Missing tournament code.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }
                    const guestName = dom.inputGuest.value.trim();
                    if (!guestName) {
                        pongAlert("Please enter a guest name.", "error");
                        dom.submitBtn.disabled = false;
                        return;
                    }
                    await addUserAsPlayerToTournament(tCode, guestName, options!.tournament!);
                    finish({
                        kind: "join",
                        userName: guestName,
                        userId: guestName,
                        avatarUrl: "/imgs/avatar.png",
                    });
                    return;
                }

                // 4) LOGIN / MATCH_SYNC / JOIN (via login) PHASE 1 (login/password)
                if ((handleSubmitBehavior === "login" || handleSubmitBehavior === "joinLogin") && !twoFAVisible) {

                    // *** IMPORTANT ***
                    // Dans le cas JOIN sans user loggé, la config peut dire
                    // "showLoginInputs = false" au début :
                    // -> premier click = révèle login/password, sans tenter la connexion.
                    if (!config.showLoginInputs &&
                        mode === "JOIN" &&
                        dom.inputLogin.classList.contains("hidden")) {

                        dom.inputLogin.classList.remove("hidden");
                        dom.inputPassword.classList.remove("hidden");
                        dom.inputGuest.classList.add("hidden");
                        dom.input2FA.classList.add("hidden");
                        dom.altBtn.classList.add("hidden");
                        dom.submitBtn.textContent = "Submit";

                        // la prochaine fois, on reste en joinLogin mais avec inputs visibles
                        dom.submitBtn.disabled = false;
                        return;
                    }

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

                // 5) LOGIN / MATCH_SYNC / JOIN (via login) PHASE 2 (2FA)
                if ((handleSubmitBehavior === "login" || handleSubmitBehavior === "joinLogin") && twoFAVisible) {
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

                    // 2FA OK : on récupère les infos user
                    const user = currentLogin
                        ? await getUserDatas(currentLogin).catch(() => null)
                        : null;

                    const userName = user ? user.data.user.username : currentLogin || "Player";
                    const avatarUrl = user?.data.user.avatarUrl || "/imgs/avatar.png";

                    if (mode === "JOIN" && tCode) {
                        // Ici on est dans le cas "Join as New" :
                        await addUserAsPlayerToTournament(tCode, userName, options!.tournament!);
                        finish({
                            kind: "join",
                            userName,
                            userId: currentUserId,
                            avatarUrl,
                        });
                    } else {
                        // LOGIN / MATCH_SYNC classique
                        finish({
                            kind: "logged",
                            userName,
                            userId: currentUserId,
                            avatarUrl,
                        });
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

                handleSubmitBehavior = "joinLogin";
                dom.submitBtn.disabled = false;
                return;
            }

            // Si un jour tu veux réutiliser altBtn pour un mode "joinGuest" ou autre,
            // tu pourras ajouter des branches ici.
        };
    });
}



// function createRelogRegisterDOM(mode: "RELOG" | "REGISTER" | "JOIN"): AuthDom {
//     if (authDom) return authDom;

//     const overlay = el("div", "alert-overlay whitespace-pre-line hidden") as HTMLDivElement;
//     const box = el("div", "alert-box") as HTMLDivElement;
//     const title = el("div", "alert-title") as HTMLDivElement;
    
//     const tournamentRegLogged = el("button", "alert-button hidden") as HTMLButtonElement;
//     tournamentRegLogged.type = "button";
//     tournamentRegLogged.textContent = "Join as Logged User";

//     const tournamentRegNew = el("button", "alert-button hidden") as HTMLButtonElement;
//     tournamentRegNew.type = "button";
//     tournamentRegNew.textContent = "Join as New User";

//     const inputGuest = el("input", "btn-input") as HTMLInputElement;
//     inputGuest.type = "text";
//     inputGuest.placeholder = "Guest Name";

//     const inputLogin = el("input", "btn-input") as HTMLInputElement;
//     inputLogin.type = "text";
//     inputLogin.placeholder = "Login";

//     const inputPassword = el("input", "btn-input") as HTMLInputElement;
//     inputPassword.type = "password";
//     inputPassword.placeholder = "Password";

//     const submitButton = el("button", "alert-button") as HTMLButtonElement;
//     submitButton.type = "button";
//     submitButton.textContent = "Log In";

//     const input2FA = el("input", "btn-input hidden") as HTMLInputElement;
//     input2FA.type = "text";
//     input2FA.placeholder = "Submit 2FA";

//     const or = el("div", "alert-title text-center text-base my-2", text("OR")) as HTMLDivElement;

//     const googleSignIn = el("button", "alert-button") as HTMLButtonElement;
//     googleSignIn.type = "button";
//     googleSignIn.textContent = "Sign in with Google";

//     googleSignIn.addEventListener("click", () => {
//         // On prend la route courante (hash) comme state
//         const currentHash = window.location.hash || "#/";
//         const state = encodeURIComponent(currentHash);
//         window.location.href = `/api/auth/google?state=${state}`;
//     });
//     const registerButton = el("button", "alert-button") as HTMLButtonElement;
//     registerButton.type = "button";
//     registerButton.textContent = "Register";
//     registerButton.onclick = () => {
//         closeOverlay(overlay);
//         window.location.href = "#/login";
//     };

//     if (mode === "RELOG") {
//         tournamentRegLogged.classList.add("hidden");
//         tournamentRegNew.classList.add("hidden");
//         or.classList.add("hidden");
//         googleSignIn.classList.add("hidden");
//         registerButton.classList.add("hidden");
//     } else if (mode === "REGISTER") {
//         inputLogin.classList.add("hidden");
//         inputPassword.classList.add("hidden");
//         input2FA.classList.add("hidden");
//         submitButton.classList.add("hidden");
//     }


//     box.append(title, tournamentRegLogged, tournamentRegNew, inputGuest, inputLogin,
//             inputPassword, input2FA, submitButton, or, googleSignIn, registerButton);
//     overlay.appendChild(box);
//     document.body.appendChild(overlay);

//     authDom = { overlay, box, title, tournamentRegLogged, tournamentRegNew, or,
//         inputGuest, inputLogin, inputPassword, input2FA, submitButton, googleSignIn, registerButton };
//     return authDom;
// }

// export function reLogAlert(message?: string): void {
//     const { overlay, title, tournamentRegLogged, tournamentRegNew, or,
//         inputGuest, inputLogin, inputPassword, input2FA, submitButton, googleSignIn, registerButton } = createRelogRegisterDOM("RELOG");

//     if (message) {
//         title.textContent = message;
//     } else {
//         title.textContent = `Session Expired.
//         Please log in again.`;
//     }


//     inputGuest.classList.add("hidden");
//     inputLogin.classList.remove("hidden");
//     inputPassword.classList.remove("hidden");
//     input2FA.classList.add("hidden");
//     inputLogin.value = "";
//     inputPassword.value = "";
//     input2FA.value = "";
//     delete input2FA.dataset.userId;
//     submitButton.classList.remove("hidden");
//     submitButton.disabled = false;
//     submitButton.textContent = "Log In";
//     or!.classList.add("hidden");
//     registerButton!.classList.add("hidden");
//     googleSignIn!.classList.remove("hidden");

//     tournamentRegLogged!.classList.add("hidden");
//     tournamentRegNew!.classList.add("hidden");

//     overlay.classList.remove("hidden");


//     if (message === "P1" || message === "P2") {
//         inputGuest.classList.remove("hidden");
//         inputLogin.classList.add("hidden");
//         inputPassword.classList.add("hidden");
//         submitButton.textContent = "Play as Guest";
//         or.classList.add("hidden");
//         registerButton.classList.add("hidden");
//         googleSignIn.classList.add("hidden");

//         const guestName = inputGuest.value.trim();
//         if (!guestName) {
//             pongAlert("Please enter a guest name.");
//             submitButton.disabled = false;
//         } else {
//             pongAlert(`Playing as Guest: ${guestName}`);
//             closeOverlay(overlay);
//         }
//     }


//     // Handlers aux clics
//     const handleSubmit = async (): Promise<void> => {
//         try {
//             if (!input2FA.classList.contains("hidden")) {
//                 or.classList.add("hidden");
//                 registerButton.classList.add("hidden");
                
//                 const code = input2FA.value.trim();
//                 const userId = input2FA.dataset.userId;
//                 if (!code || !userId) {
//                     pongAlert("Please enter the 2FA code.");
//                     submitButton.disabled = false;
//                 }
//                 const resp = await apiFetch("/api/auth/verify-2fa", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ userId, code }),
//                     credentials: "include"
//                 });
//                 if (resp.ok) {
//                     pongAlert("2FA verified! Login successful.");
//                     closeOverlay(overlay);
//                     window.location.reload();
//                 } else {
//                     closeOverlay(overlay);
//                     reLogAlert(`Wrong 2FA code.
//                         Please try again.`);
//                     submitButton.disabled = false;
//                 }
//             }

//             // Phase login
//             const username = inputLogin.value.trim();
//             const password = inputPassword.value;
//             if (!username || !password) {
//                 pongAlert("Please fill in all fields.");
//                 submitButton.disabled = false;
//             }

//             const resp = await apiFetch("/api/auth/login", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ username, password }),
//                 credentials: "include"
//             });
//             const data = await resp.json().catch(() => ({}));

//             if (resp.ok) {
//                 // server asks for 2FA (same behavior as login.ts)
//                 input2FA.classList.remove("hidden");
//                 input2FA.dataset.userId = data.data?.userId ?? "";
//                 input2FA.focus();
//                 submitButton.textContent = "Submit";
//                 pongAlert(`Login successful! Please enter your 2FA code.`);
//             } else {
//                 closeOverlay(overlay);
//                 reLogAlert(`Wrong Credentials.
//                     Please try again.`);
//                 submitButton.disabled = false;
//             }
//         } catch (err) {
//             console.error("reLogAlert submit error:", err);
//             pongAlert(`An error occurred: ${err instanceof Error ? err.message : 'Network error'}`);
//             submitButton.disabled = false;
//         }
//     };

//     // attach handler (remove previous to avoid duplicates)
//     submitButton.onclick = handleSubmit;
//     // allow Enter on inputs to trigger submit
//     [inputLogin, inputPassword, input2FA].forEach((inp) => {
//         if (!inp) return;
//         inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } };
//     });
// }

// export function registerAlertBox(tCode: string, t: Tournament): void {
//     const { overlay, title, tournamentRegLogged, tournamentRegNew, or,
//         inputGuest, inputLogin, inputPassword, input2FA, submitButton, registerButton } = createRelogRegisterDOM("REGISTER");

//     title.textContent = `Register for Tournament ${tCode}`;

//     tournamentRegLogged.classList.remove("hidden");
//     tournamentRegNew.classList.remove("hidden");
//     or.classList.remove("hidden");
//     inputLogin.classList.add("hidden");
//     inputPassword.classList.add("hidden");
//     input2FA.classList.add("hidden");
//     submitButton.classList.add("hidden");
//     registerButton.classList.add("hidden");
//     inputGuest.classList.add("hidden");

//     overlay.classList.remove("hidden");

//     // Handlers aux clics
//     tournamentRegLogged.onclick = async () => {
//         getLoggedName().then((name) => {
//             if (name) {
//                 closeOverlay(overlay);
//                 if (name) {
//                     addUserAsPlayerToTournament(tCode, name, t);
//                 } else {
//                     pongAlert("Could not retrieve logged user information.");
//                 }
//                 window.location.reload();
//             } else {
//                 closeOverlay(overlay);
//                 reLogAlert("Please log in to join the tournament.");
//             }
//         });
//     };

//     tournamentRegNew.onclick = () => {
//         tournamentRegLogged.classList.add("hidden");
//         tournamentRegNew.classList.add("hidden");
//         or.classList.add("hidden");
//         inputLogin.classList.remove("hidden");
//         inputPassword.classList.remove("hidden");
//         submitButton.classList.remove("hidden");
//         submitButton.disabled = false;
//         submitButton.textContent = "Register";
//         // registerButton.classList.add("hidden");

//         let currentUserId: string | null = null;   // ⬅️ au lieu de currentLogin uniquement
//         let currentLogin: string | null = null;

//         // New submit handler for registration
//         const handleRegister = async (): Promise<void> => {
//             try {
//                 submitButton.disabled = true;
//                 const visible2FA = !input2FA.classList.contains("hidden");

//                 if (!visible2FA) {
//                     const username = inputLogin.value.trim();
//                     const password = inputPassword.value;
//                     if (!username || !password) {
//                         pongAlert("Please fill in all fields.");
//                         submitButton.disabled = false;
//                         return;
//                     }

//                     const resp = await apiFetch(`/api/tournament/${tCode}/join`, {
//                         method: "POST",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({ username, password }),
//                         credentials: "include"
//                     });
//                     const data = await resp.json().catch(() => ({}));

//                     if (resp.ok) {
//                         pongAlert("Registration successful! You are now logged in.");
//                         closeOverlay(overlay);
//                         await addUserAsPlayerToTournament(username, tCode, t);
//                         window.location.reload();
//                     } else {
//                         closeOverlay(overlay);
//                         registerAlertBox(tCode, t);
//                         pongAlert(`Registration failed: ${data.error?.message || data.message || 'Unknown error'}`);
//                         submitButton.disabled = false;
//                     }
//                 }

//                 const code = input2FA.value.trim();
//                 if (!code) {
//                     pongAlert("Please enter the 2FA code.");
//                     input2FA.classList.remove("hidden");
//                     submitButton.classList.remove("hidden");
//                     submitButton.disabled = false;
//                     return;
//                 }

//                 const verifyResp = await apiFetch("/api/auth/verify-2fa", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ userId: currentUserId, code }),
//                     credentials: "include"
//                 });

//                 const verifyData = await verifyResp.json();
//                 if (verifyResp.ok) {
//                     pongAlert("2FA verified! Registration and login successful.");
//                     closeOverlay(overlay);
//                     // await addUserAsPlayerToTournament(tCode, currentLogin || "");
//                     // window.location.reload();
//                     return;
//                 } else {
//                     closeOverlay(overlay);
//                     registerAlertBox(tCode, t);
//                     pongAlert(`2FA verification error: ${verifyData.error?.message || verifyData.message || 'Unknown error'}`);
//                     submitButton.disabled = false;
//                 }

//                 const errorMessage = verifyData.error?.message || verifyData.message || "Invalid 2FA code";
//                 pongAlert(`2FA verification error: ${errorMessage}`);
//                 submitButton.disabled = false;
//             } catch (err) {
//                 console.error("registerAlertBox submit error:", err);
//                 pongAlert(`An error occurred: ${err instanceof Error ? err.message : 'Network error'}`);
//                 submitButton.disabled = false;
//             }
//         };
        
//         // attach handler (remove previous to avoid duplicates)
//         submitButton.onclick = handleRegister;
//         // allow Enter on inputs to trigger submit
//         [inputLogin, inputPassword, input2FA].forEach((inp) => {
//             if (!inp) return;
//             inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleRegister(); } };
//         });
//     };
//     return;
// }

// export function matchAlert(mode: "sync" | "guest"): Promise<PlayerInfo | null> {
//     return new Promise((resolve) => {
//     const { overlay, title, tournamentRegLogged, tournamentJoinNew, or,
//         inputGuest, inputLogin, inputPassword, input2FA, submitButton, registerButton, googleSignIn } = createRelogRegisterDOM("REGISTER");
//     if (mode === "sync") {
//         title.textContent = `Sync Profile for Match`;
//         tournamentRegLogged.classList.add("hidden");
//         tournamentJoinNew.classList.add("hidden");
//         or.classList.add("hidden");
//         inputGuest.classList.add("hidden");
//         inputLogin.classList.remove("hidden");
//         inputPassword.classList.remove("hidden");
//         submitButton.classList.remove("hidden");
//         submitButton.disabled = false;
//         submitButton.textContent = "Sync Profile";
//         registerButton.classList.add("hidden");
//         googleSignIn!.classList.remove("hidden");
//         googleSignIn.textContent = "Sync with Google";
//     } else if (mode === "guest") {
//         title.textContent = `Play as Guest for Match`;
//         tournamentRegLogged.classList.add("hidden");
//         tournamentJoinNew.classList.add("hidden");
//         or.classList.add("hidden");
//         inputGuest.classList.remove("hidden")
//         inputLogin.classList.add("hidden");
//         inputPassword.classList.add("hidden");
//         input2FA.classList.add("hidden");
//         submitButton.classList.remove("hidden");
//         submitButton.disabled = false;
//         submitButton.textContent = "Play as Guest";
//         registerButton.classList.add("hidden");
//         googleSignIn!.classList.add("hidden");
//     }

//     overlay.classList.remove("hidden");

//     function finish(info: PlayerInfo | null) {
//         closeOverlay(overlay);
//         resolve(info);
//     }

//     let currentUserId: string | null = null;   // ⬅️ au lieu de currentLogin uniquement
//     let currentLogin: string | null = null;

//     const handleSubmit = async (): Promise<void> => {
//         try {
//             submitButton.disabled = true;

//             const visible2FA = !input2FA.classList.contains("hidden");

//             // MODE GUEST
//             if (mode === "guest") {
//                 const guestName = inputGuest.value.trim();
//                 if (!guestName) {
//                     pongAlert("Please enter a valid guest name.");
//                     submitButton.disabled = false;
//                     return;
//                 }
//                 finish({ userName: guestName, avatarUrl: "/imgs/avatar.png" });
//                 return;
//             }

//             // PHASE 1 : login/password (comme login.ts)
//             if (!visible2FA) {
//                 const username = inputLogin.value.trim();
//                 const password = inputPassword.value;

//                 if (!username || !password) {
//                     pongAlert("Please fill in all fields.");
//                     submitButton.disabled = false;
//                     return;
//                 }

//                 const resp = await apiFetch("/api/auth/login", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ username, password }),  // ⬅️ même payload que login.ts
//                     credentials: "include",
//                 });

//                 const data = await resp.json();

//                 if (resp.ok) {
//                     currentLogin = username;
//                     currentUserId = data.data?.userId || null;     // ⬅️ récupérer userId
//                     input2FA.classList.remove("hidden");
//                     input2FA.dataset.userId = currentUserId || "";
//                     submitButton.textContent = "Submit";
//                     pongAlert("Login successful! Please enter your 2FA code sent by email.");
//                     submitButton.disabled = false;
//                     return;
//                 }

//                 const errorMessage = data.error?.message || data.message || "Login failed";
//                 pongAlert(`Login failed: ${errorMessage}`);
//                 submitButton.disabled = false;
//                 return;
//             }

//             // PHASE 2 : vérif 2FA (comme login.ts)
//             const code = input2FA.value.trim();
//             if (!code) {
//                 pongAlert("Please enter the 2FA code.");
//                 submitButton.disabled = false;
//                 return;
//             }

//             if (!currentUserId) {
//                 pongAlert("Missing userId, please try again.");
//                 submitButton.disabled = false;
//                 return;
//             }

//             const verifyResp = await apiFetch("/api/auth/verify-2fa", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ userId: currentUserId, code }),   // ⬅️ userId, pas login
//                 credentials: "include",
//             });

//             const verifyData = await verifyResp.json();

//             if (verifyResp.ok) {
//                 const user = await getUserDatas(currentLogin || "");
//                 const info: PlayerInfo = {
//                     userName: user ? user.userName : (currentLogin || "Player"),
//                     avatarUrl: user?.avatarUrl || "/imgs/avatar.png",
//                 };
//                 pongAlert("2FA verified! Login Successful.");
//                 finish(info);
//                 return;
//             }

//             const errorMessage = verifyData.error?.message || verifyData.message || "Invalid 2FA code";
//             pongAlert(`2FA verification error: ${errorMessage}`);
//             submitButton.disabled = false;
//         } catch (err) {
//             console.error("matchAlert submit error:", err);
//             pongAlert("An error occurred. Please try again.");
//             submitButton.disabled = false;
//         }
//     };
//     // attach handler (remove previous to avoid duplicates)
//     submitButton.onclick = handleSubmit;
// });
// }