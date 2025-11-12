import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { generateToken } from '../../shared/utils/jwt.js';
import { getPrismaClient } from '../../shared/database/prisma.js';

const prisma = getPrismaClient();

export async function verify2FA(req: FastifyRequest, rep: FastifyReply) {
  const { email, code } = req.body as { email: string; code: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return rep.status(404).send({ error: 'User not found' });

  const record = await prisma.twoFactor.findFirst({
    where: {
      userId: user.id,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { expiresAt: 'desc' },
  });

  if (!record) return rep.status(400).send({ error: 'No valid 2FA code found' });

  const isValid = await bcrypt.compare(code, record.code);
  if (!isValid) return rep.status(400).send({ error: 'Invalid 2FA code' });

  await prisma.twoFactor.update({
    where: { id: record.id },
    data: { used: true },
  });

  const token = generateToken({ userId: user.id, email: user.email });
  return rep.send({ token, user: { id: user.id, email: user.email, username: user.username } });
}
