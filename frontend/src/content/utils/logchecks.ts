import { el, text } from "../home";
import { addUserAsPlayerToTournament, getLoggedName } from "./todb";

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
        const response = await fetch(`/api/auth/loggedIn`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await response.json();

        if (response.ok) {
            return data as boolean;
        } else {
            return true;
        }
    } catch (error) {
        console.error("Profile fetch error:", error);
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
function createRelogRegisterDOM(mode: "RELOG" | "REGISTER"): ReLogDOM {
    if (reLogDOM) return reLogDOM;

    const overlay = el("div", "alert-overlay whitespace-pre-line hidden") as HTMLDivElement;
    const box = el("div", "alert-box") as HTMLDivElement;
    const title = el("div", "alert-title") as HTMLDivElement;
    
    const tournamentRegLogged = el("button", "alert-button hidden") as HTMLButtonElement;
    tournamentRegLogged.type = "button";
    tournamentRegLogged.textContent = "Register as Logged User";
    const tournamentRegNew = el("button", "alert-button hidden") as HTMLButtonElement;
    tournamentRegNew.type = "button";
    tournamentRegNew.textContent = "Register as New User";

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


    box.append(title, tournamentRegLogged, tournamentRegNew, inputLogin,
            inputPassword, input2FA, submitButton, or, googleSignIn, registerButton);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    reLogDOM = { overlay, box, title, tournamentRegLogged, tournamentRegNew, or,
        inputLogin, inputPassword, input2FA, submitButton, googleSignIn, registerButton };
    return reLogDOM;
}

export function reLogAlert(message?: string): void {
    const { overlay, title, tournamentRegLogged, tournamentRegNew, or,
        inputLogin, inputPassword, input2FA, submitButton, googleSignIn, registerButton } = createRelogRegisterDOM("RELOG");

    if (message) {
        title.textContent = message;
    } else {
        title.textContent = `Session Expired.
        Please log in again.`;
    }

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
                    return;
                }
                const resp = await fetch("/api/auth/verify-2fa", {
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
                return;
            }

            // Phase login
            const username = inputLogin.value.trim();
            const password = inputPassword.value;
            if (!username || !password) {
                pongAlert("Please fill in all fields.");
                submitButton.disabled = false;
                return;
            }

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
                credentials: "include"
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
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
        inputLogin, inputPassword, input2FA, submitButton, registerButton } = createRelogRegisterDOM("REGISTER");

    title.textContent = `Register for Tournament ${tCode}`;

    tournamentRegLogged.classList.remove("hidden");
    tournamentRegNew.classList.remove("hidden");
    or.classList.remove("hidden");
    inputLogin.classList.add("hidden");
    inputPassword.classList.add("hidden");
    input2FA.classList.add("hidden");
    submitButton.classList.add("hidden");
    registerButton.classList.add("hidden");

    overlay.classList.remove("hidden");

    // Handlers aux clics
    tournamentRegLogged.onclick = async () => {
        closeOverlay(overlay);
        const loggedName = await getLoggedName();
        if (loggedName) {
            await addUserAsPlayerToTournament(loggedName, tCode);
        } else {
            pongAlert("Could not retrieve logged user information.");
        }
        window.location.reload();
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
        registerButton.classList.remove("hidden");

        // New submit handler for registration
        const handleRegister = async (): Promise<void> => {
            try {
                const username = inputLogin.value.trim();
                const password = inputPassword.value;
                if (!username || !password) {
                    pongAlert("Please fill in all fields.");
                    submitButton.disabled = false;
                    return;
                }

                const response = await fetch(`/api/tournament/${tCode}/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                    credentials: "include"
                });
                const data = await response.json().catch(() => ({}));

                if (response.ok) {
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
}