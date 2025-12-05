// import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';

// twofa.service.ts
export async function generate2FACode(prisma: PrismaClient, userId: string) {
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const hashedCode = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.twoFactor.create({
    data: { userId, code: hashedCode, expiresAt },
  });

  return code;
}


// export async function send2FACode(email: string, code: string) {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT),
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: '"ft_transcendance" <no-reply@ft_transcendance.com>',
//     to: email,
//     subject: 'Your 2FA verification code',
//     text: `Your 2FA code is: ${code}. It expires in 5 minutes.`,
//   });
// }
