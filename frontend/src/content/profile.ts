import { getRouteTail } from "../router";
import { createProfileViewWindow } from "./profile/view";
import { updateProfileView } from "./profile/load";

export function Profile(): HTMLElement {

    const view = createProfileViewWindow();             // On construit le squelette

    const viewedUsername = getRouteTail("/profile");    // On extrait le nom d'utilisateur de l'URL

    updateProfileView(view, viewedUsername);            // et on injecte dans le squelette les données chargées

    return view.root;                   // et paf, ca fait des chocapics !
}
