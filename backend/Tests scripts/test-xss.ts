import fetch from 'node-fetch';
import 'dotenv/config';

const BASE_URL = 'http://localhost:3000';

async function main() {
  let cookies: string[] = [];

  // 1️⃣ REGISTER
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
	  username: 'testuser1',
	  email: 'testuser1@example.com',
	  password: 'Password123!'
	}),
  });

  const registerData = await registerRes.json();
  console.log('Register:', registerData);

  if (!registerRes.ok) return;

  // 2️⃣ LOGIN
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
	  username: 'testuser1',
	  password: 'Password123!'
	}),
  });

  const loginData = await loginRes.json();
  console.log('Login:', loginData);

  if (!loginRes.ok) return;

  // Récupérer les cookies (token + refreshToken)
  cookies = loginRes.headers.raw()['set-cookie'] || [];
  console.log('Cookies reçus:', cookies);

  // 3️⃣ REFRESH
  const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
	method: 'POST',
	headers: { Cookie: cookies.join('; ') },
  });
  const refreshData = await refreshRes.json();
  console.log('Refresh token:', refreshData);

  if (!refreshRes.ok) return;

  // 4️⃣ GET /me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
	headers: { Cookie: cookies.join('; ') },
  });
  const meData = await meRes.json();
  console.log('Me:', meData);

  if (!meRes.ok) return;

  // 5️⃣ LOGOUT
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
	method: 'POST',
	headers: { Cookie: cookies.join('; ') },
  });
  const logoutData = await logoutRes.json();
  console.log('Logout:', logoutData);
}

main().catch(console.error);
