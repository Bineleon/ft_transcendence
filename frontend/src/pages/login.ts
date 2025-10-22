import { el } from "./home";
import { text } from "./home";

function createLeftPanel(): HTMLElement {
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

    const inputSubmit = el("input", "bg-white text-black p-2 text-md font-modern-type hover:bg-gray-800 cursor-pointer");
    inputSubmit.type = "submit";
    inputSubmit.value = "Submit";

    form.append(inputLogin, inputPassword, inputSubmit);
    panel.append(loginBox, subTitle, form);
    return panel;
}

function createRightPanel(): HTMLElement {
    const panel = el("div", "border-4 border-dashed border-black p-8");
    const title = el("h1", "font-modern-type text-6xl text-justify tracking-widest font-bold mb-2");
    title.append(text("SUBSCRIBE TODAY !!!"));
    
    const subTitle = el("h3", "font-modern-type text-2xl text-justify mb-6");
    subTitle.append(text("and receive exclusive access to the game, become a wonderful member of our community, and enjoy special perks! And maybe you'll enven find some easter eggs along the way..."));

    const form = el("form", "flex flex-col gap-4");
    
    const inputEmail = el("input", "border-2 border-black p-2 text-md font-modern-type");
    inputEmail.type = "email";
    inputEmail.placeholder = "Email Address";

    const inputLogin = el("input", "border-2 border-black p-2 text-md font-modern-type");
    inputLogin.type = "text";
    inputLogin.placeholder = "Login"; 
    
    const inputPassword = el("input", "border-2 border-black p-2 text-md font-modern-type");
    inputPassword.type = "password";
    inputPassword.placeholder = "Password";

    const confirmPassword = el("input", "border-2 border-black p-2 text-md font-modern-type");
    confirmPassword.type = "password";
    confirmPassword.placeholder = "Confirm Password";

    const inputSubmit = el("input", "bg-black text-white p-2 text-md font-modern-type hover:bg-gray-800 cursor-pointer");
    inputSubmit.type = "submit";
    inputSubmit.value = "Submit";

    form.append(inputEmail, inputLogin, inputPassword, confirmPassword, inputSubmit);
    panel.append(title, subTitle, form);
    return panel;
}

export function Login(): HTMLElement {
    const main = el("main", "p-4");
    const grid = el("section", "grid grid-cols-[30%_65%] gap-6");

    const p1 = createLeftPanel();
    const p2 = createRightPanel();

    grid.append(p1, p2);
    main.append(grid);
    return main;
}

