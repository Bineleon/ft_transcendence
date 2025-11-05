import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
const prisma = new PrismaClient();

export async function send2FACode(userId: number, email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.twoFactor.create({
    data: {
      user_id: userId,
      code,
      expires_at: expiresAt,
      used: false,
    },
  });

  // Envoi email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // TLS explicite STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // ton token d'application
    },
  });

  await transporter.sendMail({
    from: `"Transcendence" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Votre code 2FA",
    text: `Votre code 2FA est : ${code}`,
  });
}

export async function verify2FACode(userId: number, code: string) {
  const entry = await prisma.twoFactor.findFirst({
    where: { user_id: userId, code, used: false, expires_at: { gte: new Date() } },
    orderBy: { expires_at: "desc" },
  });

  if (!entry) return false;

  await prisma.twoFactor.update({
    where: { id: entry.id },
    data: { used: true },
  });

  return true;
}
