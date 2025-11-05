import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { setupErrorHandler } from "./utils/errorHandler.js";
import { ValidationError, AuthError, ConflictError } from "./utils/errors.js";
import { validateUserData } from "./utils/registration_policies.js";
import type { RegisterRequest, LoginRequest } from "./types/auth.js";
import { send2FACode, verify2FACode } from "./utils/twoFactor.js";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

// --- Plugins globaux ---
await app.register(cors, { origin: true, credentials: true });
await app.register(cookie, { secret: "cookies-are-signed" });
await app.register(helmet, { contentSecurityPolicy: false });

// --- Gestionnaire d'erreurs personnalisé ---
setupErrorHandler(app);

// --- Health check ---
app.get("/api/ping", async () => ({ pong: true }));

// --- REGISTER ---
app.post<{ Body: RegisterRequest }>(
  "/api/auth/register",
  async (req: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
    const validated = await validateUserData(req, reply);
    if (!validated) return;

    const { email, username, password } = validated;

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) throw new ConflictError("Email or username already in use");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
      select: { id: true, email: true, username: true, createdAt: true },
    });

    const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    reply.setCookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return reply.code(201).send({ success: true, user });
  }
);

// --- LOGIN (étape 1 : mot de passe) ---
app.post<{ Body: LoginRequest }>("/api/auth/login", async (req, reply) => {
  const { username, password } = req.body;
  if (!username || !password) throw new ValidationError("Username and password are required");

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: username }, { username }] },
  });
  if (!user) throw new AuthError("Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AuthError("Invalid credentials");

  // --- Générer et envoyer le code 2FA par email ---
  await send2FACode(user.id, user.email);

  return reply.send({ success: true, requires2FA: true, userId: user.id });
});

// --- LOGIN (étape 2 : validation du code 2FA) ---
app.post<{ Body: { userId: number; code: string } }>("/api/auth/2fa", async (req, reply) => {
  const { userId, code } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true },
  });
  if (!user) throw new AuthError("Utilisateur introuvable");

  const valid = await verify2FACode(userId, code);
  if (!valid) throw new AuthError("Code invalide ou expiré");

  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  reply.setCookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return reply.send({ success: true, user });
});

// --- ME (vérifie la session via JWT) ---
app.get("/api/me", async (req: FastifyRequest, reply: FastifyReply) => {
  const token = (req.cookies as any)?.access_token;
  if (!token) throw new AuthError("No session", "NO_SESSION");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; username: string };
    const userId = parseInt(decoded.sub, 10);

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    if (!me) throw new AuthError("Invalid session", "INVALID_SESSION");

    return reply.send({ success: true, user: me });
  } catch {
    throw new AuthError("Invalid session", "INVALID_TOKEN");
  }
});

// --- Lancement du serveur ---
app.listen({ port: 3000, host: "0.0.0.0" });
