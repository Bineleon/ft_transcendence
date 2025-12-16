/**
 * Service pour la gestion de l'authentification + 2FA
 */

import type { PrismaClient } from '@prisma/client';
import type { RegisterRequest, LoginRequest, AuthResponse } from './auth.model.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import { generateToken } from '../../shared/utils/jwt.js';
import { ValidationError, ConflictError, AuthError } from '../../shared/errors/index.js';
import bcrypt from 'bcrypt';
import { MailService } from '../../shared/services/mail.service.js';
import { validateLoginFields } from './auth.validation.js';
  
export class AuthService {
  private mailService: MailService;

  constructor(private prisma: PrismaClient) {
    this.mailService = new MailService();
  }

  /**
   * Enregistrement d’un nouvel utilisateur.
   */
  async register(data: RegisterRequest): Promise<{ userId: string; message: string }> {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new ConflictError('Email already in use');

    const existingUsername = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (existingUsername) throw new ConflictError('Username already in use');

    const passwordHash = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: { email: data.email, username: data.username, passwordHash }
    });

    return {
      userId: user.id,
      message: 'User registered successfully. 2FA code sent to email.'
    };
  }

  /**
   * Login avec vérification du mot de passe.
   */
  async login(
    data: LoginRequest
  ): Promise<
    | { requires2FA: true; userId: string; message: string }
    | { requires2FA: false; token: string; user: AuthResponse['user'] }
  > {
    const errors = validateLoginFields(data);

    if (errors.length > 0) {
      throw new ValidationError(errors.join(' | '));
    }

    const user = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (!user) throw new AuthError('Invalid username or password');

    // compte Google sans password
    if (!user.passwordHash) {
      throw new AuthError(
        'This account was created via Google OAuth and has no password. Please log in with Google.'
      );
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) throw new AuthError('Invalid username or password');

    // ✅ NOUVEAU: si 2FA désactivé => login direct
    if (!user.twoFactorEnabled) {
      const token = generateToken({ userId: user.id, email: user.email });

      return {
        requires2FA: false,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      };
    }

    // Sinon: flow actuel 2FA
    await this.prisma.twoFactor.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const code = await this.generateAndStore2FACode(user.id);
    await this.mailService.send2FACode(user.email, code);

    return {
      requires2FA: true,
      userId: user.id,
      message: '2FA code sent to your email. Please verify to complete login.',
    };
  }

  /**
   * Vérification du code 2FA
   */
  async verify2FA(userId: string, code: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AuthError('User not found');
	if (!user.twoFactorEnabled) {
  		throw new AuthError('2FA is not enabled for this user');
		}


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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.twoFactor.create({
      data: { userId, code: hashedCode, expiresAt }
    });

    return code;
  }
}
