import { getRouteTail } from "../router";
import { createProfileViewWindow } from "./profile/view";
import { updateProfileView } from "./profile/load";

/**
 * Profile page component. This function creates the DOM structure for the
 * user profile using createProfileViewWindow() and then delegates data loading
 * and mode setup to updateProfileView(). It returns the root element to be
 * rendered by the router.
 */
export function Profile(): HTMLElement {
    // Build the DOM structure for the profile page
    const view = createProfileViewWindow();
    // Extract the username from the route (e.g., '#/profile/john' → 'john')
    const viewedUsername = getRouteTail("/profile");
    // Populate the view with user data and configure self/other modes
    updateProfileView(view, viewedUsername);
    // Return the root element for rendering
    return view.root;
}
