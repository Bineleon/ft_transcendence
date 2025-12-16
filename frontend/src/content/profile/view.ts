import { el, } from "../home";

// root (conteneur global)
//  └─ sections                         rows-3
//     ├─ headSection                   cols-3
//     │  ├─ friendsBox
//     │  ├─ profileSection             rows-2
//     │  │  ├─ userTitle
//     │  │  └─ profileSubSection       cols-2
//     │  │      ├─ avatarBox
//     │  │      └─ infoBox
//     │  └─ addvertisementBox
//     ├─ dashboard                     cols-4
//     │  ├─ last7days
//     │  ├─ lastScores
//     │  ├─ last3Matches
//     │  └─ snakeStats
//     └─ isSelf


export interface ProfileViewWindow {
	root: HTMLElement;
	sections: HTMLElement;

	headSection: HTMLElement;
	friendsBox: HTMLElement;
	profileSection: HTMLElement;
	userTitle: HTMLElement;
	profileSubSection: HTMLElement;
	avatarBox: HTMLElement;
	infoBox: HTMLElement;
	addvertisementBox: HTMLElement;

	dashboard: HTMLElement;
	last7days: HTMLElement;
	lastScores: HTMLElement;
	last3Matches: HTMLElement;
	snakeStats: HTMLElement;

	isSelf: HTMLElement;
}

export function createProfileViewWindow(): ProfileViewWindow {
	const root = el("div", "profile-root");
	const sections = el("div", "profile-sections grid grid-rows-[1fr_auto_auto] gap-4");

	// headSection cols-3
	const headSection = el("div", "profile-head grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 mb-8");

	const friendsBox = el("div", "border-2 rounded-[12px] mt-8 p-4 flex flex-col justify-between h-full");

	// profileSection rows-2
	const profileSection = el("div", "profile-section grid grid-rows-[1fr_auto] gap-4");
	const userTitle = el("div", "user-title max-h-64 mb-4");

	// profileSubSection cols-2
	const profileSubSection = el("div", "profile-sub-section grid grid-cols-2 gap-4 flex justify-center");
	const avatarBox = el("div", "avatar-box");
	const infoBox = el("div", "flex items-center justify-center");

	profileSubSection.append(avatarBox, infoBox);
	profileSection.append(userTitle, profileSubSection);

	const addvertisementBox = el("div", "mt-4 p-4");
    const addPic = el("img", "img-newspaper flex justify-center");
    addPic.src = "/imgs/pongEscher.jpg";
    addvertisementBox.append(addPic);
	headSection.append(friendsBox, profileSection, addvertisementBox);

	// dashboard cols-4 (avec SnakeStats en 4e)
	const dashboard = el("div", "dashboard grid grid-cols-4 gap-4");
	const last7days = el("div", "dashboard-last7days");
	const lastScores = el("div", "dashboard-last-scores");
	const last3Matches = el("div", "dashboard-last-matches");
	const snakeStats = el("div", "dashboard-snake-stats");

	dashboard.append(last7days, lastScores, last3Matches, snakeStats);

	// isSelf stuff
	const isSelf = el("div", "");

	sections.append(headSection, dashboard, isSelf);
	root.append(sections);

	return {
		root,
		sections,

		headSection,
		friendsBox,
		profileSection,
		userTitle,
		profileSubSection,
		avatarBox,
		infoBox,
		addvertisementBox,

		dashboard,
		last7days,
		lastScores,
		last3Matches,
		snakeStats,

		isSelf
	};
}
