import { el, text } from "./home";

function login(): HTMLElement {
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

    form.addEventListener("input", () => {
        inputSubmit.disabled = !form.checkValidity();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Empêche le rechargement de la page
        /* Basic checks */
        if (!inputLogin.value || !inputPassword.value) {
            alert("Please fill in all fields.");
            return;
        }
        /* on evite les soumissions multiples */
        inputSubmit.disabled = true;

        const payload = {
            username: inputLogin.value,
            password: inputPassword.value,
        };

        /****** POST ******/
        /* On envoie les données au backend */
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload), // <-- texte JSON, pas un fichier
				credentials: "include" // indispensable pour envoyer les cookies
            });

            /* Si c'est ok, on renvoi vers le profil */
            if (response.ok) {
                alert("Login successful!");
                window.location.hash = "#/profile";
            }
            else {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.error || errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            alert(`An error occurred: ${error}`);
        } finally {
            inputSubmit.disabled = false; // Réactive le bouton après la tentative
        }
    });


    form.append(inputLogin, inputPassword, inputSubmit);
    panel.append(loginBox, subTitle, form);
    return panel;
}

function register(): HTMLElement {
    const panel = el("div", "border-4 border-dashed border-black p-8");
    const title = el("h1", "font-modern-type text-6xl text-justify tracking-widest font-bold mb-2");
    title.append(text("SUBSCRIBE TODAY !!!"));
    
    const subTitle = el("h3", "font-modern-type text-2xl text-justify mb-6");
    subTitle.append(text("and receive exclusive access to the game, become a wonderful member of our community, and enjoy special perks! And maybe you'll enven find some easter eggs along the way..."));

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

    /* On clique sur submit */
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Empêche le rechargement de la page
        /* Basic checks */
        if (inputPassword.value !== confirmPassword.value) {
            alert("Passwords do not match!");
            return;
        }

        /* on evite les soumissions multiples */
        submit.disabled = true;

        const payload = {
            email: inputEmail.value,
            username: inputLogin.value,
            password: inputPassword.value,
        };

        /****** POST ******/
        /* On envoie les données au backend */
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload), // <-- texte JSON, pas un fichier
				credentials: "include" // indispensable pour envoyer les cookies
            });

            /* Si c'est ok, on renvoi vers le profil */
            if (response.ok) {
                alert("Registration successful! You can now log in.");
                window.location.hash = "#/profile";
            }
            else {
                const errorData = await response.json();
                alert(`Registration failed: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            alert(`An error occurred: ${error}`);
        } finally {
            submit.disabled = false; // Réactive le bouton après la tentative
        }
    });

    form.append(inputEmail, inputLogin, inputPassword, confirmPassword, submit);
    panel.append(title, subTitle, form);
    return panel;
}

export function LoginPage(): HTMLElement {
    const main = el("main", "p-4");
    const grid = el("section", "grid grid-cols-[30%_68%] gap-6");

    const p1 = login();
    const p2 = register();

    grid.append(p1, p2);
    main.append(grid);
    return main;
}

/****** MEMO ******
 * console vs alert vs throw new Error vs catch :
    * - console.log / console.warn / console.error : pour le débogage, affiche des messages dans la console du navigateur sans interrompre le flux.
    * - alert() : affiche une boîte de dialogue modale à l'utilisateur, interrompant le flux jusqu'à ce que l'utilisateur interagisse avec elle. Utile pour des messages critiques ou des confirmations.
    * - throw new Error() : interrompt immédiatement l'exécution du code en lançant une exception. Utile pour signaler des erreurs graves qui doivent être gérées par un bloc try/catch.
    * - try/catch : permet de gérer les exceptions lancées dans le bloc try. Utile pour capturer et traiter les erreurs sans interrompre complètement le flux du programme.
*/
