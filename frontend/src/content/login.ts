import { el, text } from "./home";
import { requestTwoFactorCode } from "./twoFactor";

/* --- FORMULAIRE DE LOGIN --- */
function createLoginForm(): HTMLElement {
    const panel = el("div", "bg-black mix-blend-multiply text-white border-4 border-dotted border-black px-8 py-12");
    const loginBox = el("h1", "font-jmh text-6xl text-center tracking-widest font-bold mb-4");
    loginBox.append(text("WELCOME BACK"));

    const subTitle = el("h3", "font-ocean-type text-2xl text-center mb-6");
    subTitle.append(text("Please login to access the game and continue your adventure! We missed you !"));

    const form = el("form", "flex flex-col gap-4");

    const inputLogin = el("input", "border-2 border-white/20 p-2 text-md font-modern-type");
    inputLogin.type = "text";
    inputLogin.placeholder = "Login"; 

    const inputPassword = el("input", "border-2 border-white/20 p-2 text-md font-modern-type");
    inputPassword.type = "password";
    inputPassword.placeholder = "Password";

    const inputSubmit = el("button", "bg-white text-black p-2 text-md font-modern-type hover:bg-gray-800 cursor-pointer");
    inputSubmit.type = "submit";
    inputSubmit.textContent = "Log In";

    // Conteneur pour le formulaire 2FA
    const twoFactorContainer = el("div", "mt-4");

    form.addEventListener("input", () => {
        inputSubmit.disabled = !form.checkValidity();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!inputLogin.value || !inputPassword.value) {
            alert("Please fill in all fields.");
            return;
        }

        inputSubmit.disabled = true;

        const payload = { username: inputLogin.value, password: inputPassword.value };

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            const data = await response.json();

            if (response.ok) {
                const needs2FA = data.requires2FA ?? false;

                if (needs2FA) {
                    renderTwoFactorForm(twoFactorContainer, data.userId, () => {
                        window.location.hash = "#/profile";
                    });
                } else {
                    window.location.hash = "#/profile";
                }
            } else {
                const errorMessage = data.error?.message || data.message || 'Unknown error';
                alert(`Login failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`);
        } finally {
            inputSubmit.disabled = false;
        }
    });

    form.append(inputLogin, inputPassword, inputSubmit, twoFactorContainer);
    panel.append(loginBox, subTitle, form);
    return panel;
}

/* --- FORMULAIRE 2FA --- */
function renderTwoFactorForm(container: HTMLElement, userId: number, onSuccess: () => void) {
    container.innerHTML = ""; // Reset
    const form = el("form", "flex flex-col gap-2 bg-gray-800 p-4 rounded");

    const inputCode = el("input", "p-2 text-md");
    inputCode.type = "text";
    inputCode.placeholder = "Enter your 2FA code";
    inputCode.required = true;

    const submit = el("button", "bg-white text-black p-2 hover:bg-gray-600 cursor-pointer");
    submit.type = "submit";
    submit.textContent = "Verify";

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submit.disabled = true;

        try {
            const res = await fetch("/api/auth/2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, code: inputCode.value }),
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok && data.success) {
                container.innerHTML = ""; // Supprime le formulaire 2FA
                onSuccess();
            } else {
                const msg = data.error?.message || "Invalid 2FA code";
                alert(msg);
                submit.disabled = false;
            }
        } catch (err) {
            console.error("2FA error:", err);
            alert("An error occurred during 2FA verification");
            submit.disabled = false;
        }
    });

    form.append(inputCode, submit);
    container.append(form);
}

/* --- FORMULAIRE D'INSCRIPTION --- */
function createRegisterForm(): HTMLElement {
    const panel = el("div", "border-4 border-dashed border-black p-8");
    const title = el("h1", "font-modern-type text-6xl text-justify tracking-widest font-bold mb-2");
    title.append(text("SUBSCRIBE TODAY !!!"));
    
    const subTitle = el("h3", "font-modern-type text-2xl text-justify mb-6");
    subTitle.append(text("and receive exclusive access to the game, become a wonderful member of our community, and enjoy special perks! And maybe you'll even find some easter eggs along the way..."));

    const form = el("form", "flex flex-col gap-4");
    
    const inputEmail = el("input", "border-2 border-black p-2 text-md font-modern-type");
    inputEmail.type = "email";
    inputEmail.placeholder = "Email Address";
    inputEmail.required = true;

    const inputLogin = el("input", "border-2 border-black p-2 text-md font-modern-type");
    inputLogin.type = "text";
    inputLogin.placeholder = "Login";
    inputLogin.required = true;
    
    const inputPassword = el("input", "border-2 border-black p-2 text-md font-modern-type");
    inputPassword.type = "password";
    inputPassword.placeholder = "Password";
    inputPassword.required = true;

    const confirmPassword = el("input", "border-2 border-black p-2 text-md font-modern-type");
    confirmPassword.type = "password";
    confirmPassword.placeholder = "Confirm Password";
    confirmPassword.required = true;

    const submit = el("button", "bg-black text-white p-2 text-md font-modern-type hover:bg-gray-800 cursor-pointer");
    submit.type = "submit";
    submit.textContent = "Submit";

    form.addEventListener("input", () => {
        submit.disabled = !form.checkValidity();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!inputEmail.value || !inputLogin.value || !inputPassword.value) {
            alert("Please fill in all fields.");
            return;
        }
        if (inputPassword.value !== confirmPassword.value) {
            alert("Passwords do not match!");
            return;
        }

        submit.disabled = true;

        const payload = { email: inputEmail.value, username: inputLogin.value, password: inputPassword.value };

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration successful! You can now log in.");
                window.location.hash = "#/profile";
            } else {
                const errorMessage = data.error?.message || data.message || 'Unknown error';
                alert(`Registration failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert(`An error occurred: ${error instanceof Error ? error.message : 'Network error'}`);
        } finally {
            submit.disabled = false;
        }
    });

    form.append(inputEmail, inputLogin, inputPassword, confirmPassword, submit);
    panel.append(title, subTitle, form);
    return panel;
}

/* --- PAGE LOGIN --- */
export function LoginPage(): HTMLElement {
    const main = el("main", "p-4");
    const grid = el("section", "grid grid-cols-[30%_68%] gap-6");

    const p1 = createLoginForm();
    const p2 = createRegisterForm();

    grid.append(p1, p2);
    main.append(grid);
    return main;
}
