import { el, text } from "./home";
import { pongAlert } from "./utils/alertBox";
import { apiFetch } from "./utils/apiFetch";

/* Fonction Login */
function login(): HTMLElement {
    const panel = el("div", "bg-black mix-blend-multiply text-white border-4 border-dotted border-black px-8 py-12");
    const loginBox = el("h1", "font-jmh text-6xl text-center tracking-widest font-bold mb-4");
    loginBox.append(text("WELCOME BACK"));

    const subTitle = el("h3", "font-ocean-type text-2xl text-center mb-6");
    subTitle.append(
        text(
            "Please login to access the game and continue your adventure! We missed you !"
        )
    );

    const form = el("form", "flex flex-col gap-4") as HTMLFormElement;

    // --- Inputs login / password ---
    const inputLogin = el("input", "btn-input") as HTMLInputElement;
    inputLogin.type = "text";
    inputLogin.placeholder = "Login";

    const inputPassword = el("input", "btn-input") as HTMLInputElement;
    inputPassword.type = "password";
    inputPassword.placeholder = "Password";

    const inputSubmit = el("button", "btn-click") as HTMLButtonElement;
    inputSubmit.type = "submit";
    inputSubmit.textContent = "Log In";

    // --- Input pour 2FA (hidden au début) ---
    const input2FA = el("input", "btn-input hidden") as HTMLInputElement;
    input2FA.type = "text";
    input2FA.placeholder = "Enter 2FA code";

    form.addEventListener("input", () => {
        inputSubmit.disabled = !form.checkValidity();
    });

    form.addEventListener("submit", async (event) => {
  event.preventDefault();
  inputSubmit.disabled = true;

  try {
    // --- Phase 2: vérification du code 2FA ---
    if (!input2FA.classList.contains("hidden")) {
      const code = input2FA.value.trim();

      const response = await apiFetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: input2FA.dataset.userId, code }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        pongAlert("2FA verified! Login successful.");
        try {
          window.dispatchEvent(new Event("auth-changed"));
        } catch (_e) {}

        window.location.hash = `#/profile`;
      } else {
        const errorMessage = data.error?.message || data.message || "Invalid 2FA code";
        pongAlert(`2FA verification failed: ${errorMessage}`);
        inputSubmit.disabled = false;
      }
      return;
    }

    // --- Phase login classique ---
    if (!inputLogin.value || !inputPassword.value) {
      pongAlert("Please fill in all fields.");
      inputSubmit.disabled = false;
      return;
    }

    const payload = { username: inputLogin.value, password: inputPassword.value };
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ NOUVEAU : backend renvoie requires2FA
      const requires2FA = Boolean(data?.data?.requires2FA);

      if (requires2FA) {
        // comportement actuel (2FA requis)
        input2FA.classList.remove("hidden");
        input2FA.dataset.userId = data.data.userId;
        input2FA.value = "";
        input2FA.focus();
        pongAlert("Login successful! Please enter your 2FA code sent by email.");
        inputSubmit.disabled = false; // on réactive le bouton pour la phase 2
        return;
      }

      // ✅ 2FA désactivé => login direct (cookies déjà posés par le backend)
      pongAlert("Login successful!");
      try {
        window.dispatchEvent(new Event("auth-changed"));
      } catch (_e) {}
      window.location.hash = `#/profile`;
      return;
    } else {
      const errorMessage = data.error?.message || data.message || "Login failed";
      pongAlert(`Login failed: ${errorMessage}`);
      inputSubmit.disabled = false;
    }
  } catch (error) {
    console.error("Login error:", error);
    pongAlert(
      `An error occurred: ${error instanceof Error ? error.message : "Network error"}`
    );
    inputSubmit.disabled = false;
  }
});


    // --- Bouton Google OAuth ---
    const divider = el("div", "text-center text-sm text-gray-400 my-2");
    divider.textContent = "OR";

    // On ne met plus un href fixe, on construit l’URL avec le state côté JS
    const googleBtn = el(
        "button",
        "btn-click flex items-center justify-center gap-2"
    ) as HTMLButtonElement;
    googleBtn.type = "button";
    googleBtn.textContent = "Sign in with Google";
    const ID = inputLogin.value;

    googleBtn.addEventListener("click", () => {
        // On prend la route courante (hash) comme state
        window.location.hash = `#/profile/${ID}`;
        const state = encodeURIComponent(window.location.hash);
        window.location.href = `/api/auth/google?state=${state}`;
    });

    form.append(inputLogin, inputPassword, input2FA, inputSubmit, divider, googleBtn);
    panel.append(loginBox, subTitle, form);
    return panel;
}

/* Fonction Register */
function register(): HTMLElement {
    const panel = el("div", "mix-blend-multiply border-4 border-dashed border-black p-8");
    const title = el("h1", "font-modern-type text-6xl text-justify tracking-widest font-bold mb-2");
    title.append(text("SUBSCRIBE TODAY !!!"));

    const subTitle = el("h3", "font-modern-type text-2xl text-justify mb-6");
    subTitle.append(
        text(
            "and receive exclusive access to the game, become a wonderful member of our community, and enjoy special perks!"
        )
    );

    const form = el("form", "flex flex-col gap-4") as HTMLFormElement;
    form.noValidate = true; // on laisse le backend gérer la validation métier

    const inputEmail = el("input", "btn-input") as HTMLInputElement;
    inputEmail.type = "email";
    inputEmail.placeholder = "Email Address";
    inputEmail.required = true;

    const inputLogin = el("input", "btn-input") as HTMLInputElement;
    inputLogin.type = "text";
    inputLogin.placeholder = "Login";
    inputLogin.required = true;

    const inputPassword = el("input", "btn-input") as HTMLInputElement;
    inputPassword.type = "password";
    inputPassword.placeholder = "Password";
    inputPassword.required = true;

    const confirmPassword = el("input", "btn-input") as HTMLInputElement;
    confirmPassword.type = "password";
    confirmPassword.placeholder = "Confirm Password";
    confirmPassword.required = true;

    const submit = el("button", "btn-click") as HTMLButtonElement;
    submit.type = "submit";
    submit.textContent = "Submit";

    form.addEventListener("input", () => (submit.disabled = !form.checkValidity()));

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!inputEmail.value || !inputLogin.value || !inputPassword.value) {
            pongAlert("Please fill in all fields.");
            return;
        }
        if (inputPassword.value !== confirmPassword.value) {
            pongAlert("Passwords do not match!");
            return;
        }

        submit.disabled = true;
        const payload = { email: inputEmail.value, username: inputLogin.value, password: inputPassword.value };

        try {
            const response = await apiFetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });
            const data = await response.json();

            if (response.ok) {
                pongAlert("Registration successful! You can now log in.");
                window.location.hash = "#/login";
            } else {
                const errorMessage =
                    (Array.isArray(data?.error?.messages) && data.error.messages.join("\n")) ||
                    data?.error?.message ||
                    data?.message ||
                    "Unknown error";

                pongAlert(`Registration failed:\n${errorMessage}`);
            }
        } catch (error) {
            console.error("Registration error:", error);
            pongAlert(
                `An error occurred: ${
                    error instanceof Error ? error.message : "Network error"
                }`
            );
        } finally {
            submit.disabled = false;
        }
    });

    form.append(inputEmail, inputLogin, inputPassword, confirmPassword, submit);
    panel.append(title, subTitle, form);
    return panel;
}

/* Page complète LoginPage */
export function LoginPage(): HTMLElement {
    const main = el("main", "p-4 flex flex-col grid grid-row-2 gap-6 items-center justify-center min-h-full");
    const bornesBox = el("div", "");
    const bornesPic = el("img", "img-newspaper object-contain mx-auto") as HTMLImageElement;
    bornesPic.src = "/imgs/Bornes.png";
    bornesPic.alt = "bornes";
    bornesBox.append(bornesPic);

    const grid = el("section", "grid grid-cols-[30%_68%] gap-6");

    grid.append(login(), register());
    main.append(bornesBox, grid);
    return main;
}
