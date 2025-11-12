/**
 * Service pour la gestion de l'authentification + 2FA
 */

import type { PrismaClient } from '@prisma/client';
import type { RegisterRequest, LoginRequest, AuthResponse } from './auth.model.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import { generateToken } from '../../shared/utils/jwt.js';
import { ValidationError, ConflictError, AuthError } from '../../shared/errors/index.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Enregistrement d’un nouvel utilisateur.
   * Crée le user et lui envoie un code 2FA obligatoire par email.
   */
  async register(data: RegisterRequest): Promise<{ userId: string; message: string }> {
    this.validateRegisterData(data);

    const existingEmail = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new ConflictError('Email already in use');

    const existingUsername = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (existingUsername) throw new ConflictError('Username already in use');

    const passwordHash = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: { email: data.email, username: data.username, passwordHash }
    });

    // Nettoyage des anciens codes expirés
    await this.prisma.twoFactor.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    // Génération + stockage du code 2FA
    const code = await this.generateAndStore2FACode(user.id);

    // Envoi par email
    await this.send2FACode(user.email, code);

    return {
      userId: user.id,
      message: 'User registered successfully. 2FA code sent to email.'
    };
  }

  /**
   * Login avec vérification du mot de passe.
   */
  async login(data: LoginRequest): Promise<{ userId: string; message: string }> {
    this.validateLoginData(data);

    const user = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (!user) throw new AuthError('Invalid username or password');

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) throw new AuthError('Invalid username or password');

    // Nettoyage anciens codes expirés
    await this.prisma.twoFactor.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    // Génération + stockage du code 2FA
    const code = await this.generateAndStore2FACode(user.id);

    // Envoi par email
    await this.send2FACode(user.email, code);

    return {
      userId: user.id,
      message: '2FA code sent to your email. Please verify to complete login.'
    };
  }

  /**
   * Vérification du code 2FA
   */
  async verify2FA(userId: string, code: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AuthError('User not found');

    const record = await this.prisma.twoFactor.findFirst({
      where: { userId, used: false, expiresAt: { gte: new Date() } },
      orderBy: { expiresAt: 'desc' }
    });

    if (!record) throw new AuthError('No valid 2FA code found or code expired');

    const isValid = await bcrypt.compare(code, record.code);
    if (!isValid) throw new AuthError('Invalid 2FA code');

    await this.prisma.twoFactor.update({ where: { id: record.id }, data: { used: true } });

    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      token
    };
  }

  /**
   * Génération et stockage d’un code 2FA
   */
  private async generateAndStore2FACode(userId: string): Promise<string> {
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.twoFactor.create({
      data: { userId, code: hashedCode, expiresAt }
    });

    return code;
  }

  /**
   * Envoi du code 2FA par email
   */
  private async send2FACode(email: string, code: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM || '"ft_transcendance" <no-reply@ft_transcendance.com>',
      to: email,
      subject: 'Your 2FA verification code',
      text: `Your 2FA code is: ${code}. It expires in 10 minutes.`,
    });
  }

  /**
   * Validation des données
   */
  private validateRegisterData(data: RegisterRequest): void {
    if (!data.email || typeof data.email !== 'string') throw new ValidationError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new ValidationError('Invalid email format');

    if (!data.username || typeof data.username !== 'string') throw new ValidationError('Username is required');
    if (data.username.length < 3 || data.username.length > 20) throw new ValidationError('Username must be between 3 and 20 characters');
    if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) throw new ValidationError('Username can only contain letters, numbers, underscores and hyphens');

    if (!data.password || typeof data.password !== 'string') throw new ValidationError('Password is required');
    if (data.password.length < 8) throw new ValidationError('Password must be at least 8 characters long');
  }

  private validateLoginData(data: LoginRequest): void {
    if (!data.username || typeof data.username !== 'string') throw new ValidationError('Username is required');
    if (!data.password || typeof data.password !== 'string') throw new ValidationError('Password is required');
  }
}
