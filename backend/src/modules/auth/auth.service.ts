/**
 * Service pour la gestion de l'authentification
 */

import type { PrismaClient } from '@prisma/client';
import type { RegisterRequest, LoginRequest, AuthResponse } from './auth.model.js';
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import { generateToken } from '../../shared/utils/jwt.js';
import {
  ValidationError,
  ConflictError,
  AuthError
} from '../../shared/errors/index.js';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Inscription d'un nouvel utilisateur
   * 
   * @param data - Données d'inscription (email, username, password)
   * @returns Utilisateur créé + token JWT
   * 
   * @throws ValidationError si les données sont invalides
   * @throws ConflictError si l'email ou le username existe déjà
   * 
   * @example
   * const result = await authService.register({
   *   email: 'user@example.com',
   *   username: 'johndoe',
   *   password: 'SecurePassword123'
   * });
   * // { user: {...}, token: 'eyJhbG...' }
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // 1. Validation des données
    this.validateRegisterData(data);

    // 2. Vérifier si l'email existe déjà
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingEmail) {
      throw new ConflictError('Email already in use');
    }

    // 3. Vérifier si le username existe déjà
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: data.username }
    });

    if (existingUsername) {
      throw new ConflictError('Username already in use');
    }

    // 4. Hasher le mot de passe
    const passwordHash = await hashPassword(data.password);

    // 5. Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash
      }
    });

    // 6. Générer le token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // 7. Retourner l'utilisateur + token
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
   * Connexion d'un utilisateur existant
   * 
   * @param data - Données de connexion (email, password)
   * @returns Utilisateur connecté + token JWT
   * 
   * @throws ValidationError si les données sont invalides
   * @throws AuthError si l'email ou le mot de passe est incorrect
   * 
   * @example
   * const result = await authService.login({
   *   email: 'user@example.com',
   *   password: 'SecurePassword123'
   * });
   * // { user: {...}, token: 'eyJhbG...' }
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // 1. Validation des données
    this.validateLoginData(data);

    // 2. Récupérer l'utilisateur par email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    // 3. Vérifier que l'utilisateur existe
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    // 4. Vérifier le mot de passe
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password');
    }

    // 5. Générer le token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    // 6. Retourner l'utilisateur + token
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
   * Vérifier si un utilisateur existe par email
   * 
   * @param email - Email à vérifier
   * @returns true si l'utilisateur existe, false sinon
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email }
    });

    return count > 0;
  }

  /**
   * Vérifier si un utilisateur existe par username
   * 
   * @param username - Username à vérifier
   * @returns true si l'utilisateur existe, false sinon
   */
  async userExistsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username }
    });

    return count > 0;
  }

  

  /**
   * Valider les données d'inscription
   * 
   * @private
   * @throws ValidationError si les données sont invalides
   */
  private validateRegisterData(data: RegisterRequest): void {
    // Validation email
    if (!data.email || typeof data.email !== 'string') {
      throw new ValidationError('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validation username
    if (!data.username || typeof data.username !== 'string') {
      throw new ValidationError('Username is required');
    }

    if (data.username.length < 3 || data.username.length > 20) {
      throw new ValidationError('Username must be between 3 and 20 characters');
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(data.username)) {
      throw new ValidationError('Username can only contain letters, numbers, underscores and hyphens');
    }

    // Validation password
    if (!data.password || typeof data.password !== 'string') {
      throw new ValidationError('Password is required');
    }

    if (data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
  }

  /**
   * Valider les données de connexion
   * 
   * @private
   * @throws ValidationError si les données sont invalides
   */
  private validateLoginData(data: LoginRequest): void {
    // Validation email
    if (!data.email || typeof data.email !== 'string') {
      throw new ValidationError('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validation password
    if (!data.password || typeof data.password !== 'string') {
      throw new ValidationError('Password is required');
    }

    if (data.password.length < 1) {
      throw new ValidationError('Password is required');
    }
  }
}