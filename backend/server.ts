
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

// 1) Plugins d'abord
await app.register(cors,   { origin: true, credentials: true });
await app.register(cookie, { secret: 'cookies-are-signed' });
await app.register(helmet, { contentSecurityPolicy: false });

// (optionnel) ping/health
app.get('/api/ping', async () => ({ pong: true }));

// 2) === TES 3 ROUTES AUTH ICI, À LA SUITE ===

// A) REGISTER
app.post('/api/auth/register', async (req, reply) => {
  const { email, username, password } = req.body as any;

  // unicité
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] }});
  if (exists) return reply.code(409).send({ error: 'Email or username already in use' });

  // hash + insert
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true, createdAt: true }
  });

  // cookie JWT (en DEV: secure:false, en PROD: true)
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  reply.setCookie('access_token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  return reply.code(201).send({ user });
});

// B) LOGIN
app.post('/api/auth/login', async (req, reply) => {
  const { username, password } = req.body as any;
  const user = await prisma.user.findFirst({ 
    where: { 
      OR: [
        { email: username }, 
        { username: username }
      ] 
    }
  });
  if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return reply.code(401).send({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  reply.setCookie('access_token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  return reply.send({ ok: true });
});

// C) ME
app.get('/api/me', async (req, reply) => {
  const token = (req.cookies as any)?.access_token;
  if (!token) return reply.code(401).send({ error: 'No session' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const me = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, username: true, createdAt: true }
    });
    if (!me) return reply.code(401).send({ error: 'Invalid session' });
    return reply.send({ user: me });
  } catch {
    return reply.code(401).send({ error: 'Invalid session' });
  }
});

// 3) listen en dernier
app.listen({ port: 3000, host: '0.0.0.0' });
