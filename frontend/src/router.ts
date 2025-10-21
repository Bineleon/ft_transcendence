function render(html: string) {
  const app = document.getElementById('app');
  if (app) app.innerHTML = html;
}

const Home = () => `<h1>Home</h1><p>Welcome to the Daily Pong!</p>`;
const Game = () => `<h1>Game</h1><p>Here is your Pong.</p>`;
const Profile = () => `<h1>Profile</h1><p>Your profile.</p>`;

export function navigateTo(path: string) {
  switch (path) {
    case '/game':    render(Game()); break;
    case '/profile': render(Profile()); break;
    default:         render(Home());
  }
}

export function linkHandler(ev: Event, path: string) {
  ev.preventDefault();
  history.pushState({}, '', path);
  navigateTo(path);
}
