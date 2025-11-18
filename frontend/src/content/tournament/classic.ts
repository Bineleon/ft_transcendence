

export function classicTournament(): HTMLElement {
    // if (notLoggedIn()) {
    //     return redirectToLogin();
    // }
    const container = document.createElement("div");
    container.innerHTML = `
        <h1>Classic Tournament</h1>
        <p>Welcome to the Classic Tournament! Compete against other players in a traditional knockout format.</p>
        <button id="join-tournament">Join Tournament</button>
    `;
    return container;
}