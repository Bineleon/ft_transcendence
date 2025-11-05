/**
 * Controller pour les routes d'authentification
 */

import type { FastifyInstance } from 'fastify';
import type { AuthService } from './auth.service.js';
import type { UserService } from '../users/users.service.js';  // ← Ajouter
import type { RegisterRequest, LoginRequest } from './auth.model.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { authenticate } from '../../shared/middleware/index.js';

/**
 * Enregistrer toutes les routes d'authentification
 * 
 * @param app - Instance Fastify
 * @param authService - Service d'authentification
 * @param userService - Service utilisateur  ← Ajouter
 */
export function authController(
  app: FastifyInstance,
  authService: AuthService,
  userService: UserService  // ← Ajouter ce paramètre
) {
  
  /**
   * POST /api/auth/register
   * Inscription d'un nouvel utilisateur
   * 
   * @body RegisterRequest { email, username, password }
   * 
   * @returns AuthResponse { user, token }
   * 
   * @throws ValidationError si les données sont invalides
   * @throws ConflictError si l'email ou username existe déjà
   * 
   * @example
   * POST /api/auth/register
   * Body:
   * {
   *   "email": "user@example.com",
   *   "username": "johndoe",
   *   "password": "SecurePassword123"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "message": "Registration successful",
   *   "data": {
   *     "user": {
   *       "id": "cm2xj5k8p0000uxvw9c1a2b3c",
   *       "email": "user@example.com",
   *       "username": "johndoe",
   *       "avatarUrl": null,
   *       "createdAt": "2024-11-05T14:30:00.000Z"
   *     },
   *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *   }
   * }
   * 
   * + Cookie: token=eyJhbG... (httpOnly, secure)
   */
  app.post<{ Body: RegisterRequest }>(
    '/api/auth/register',
    async (request, reply) => {
      // Appeler le service pour créer l'utilisateur
      const result = await authService.register(request.body);
      
      // Définir le cookie JWT
      reply.setCookie('token', result.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60  // 24 heures
      });
      
      // Retourner la réponse
      return formatSuccess(result, 'Registration successful');
    }
  );

  /**
   * POST /api/auth/login
   * Connexion d'un utilisateur existant
   * 
   * @body LoginRequest { email, password }
   * 
   * @returns AuthResponse { user, token }
   * 
   * @throws ValidationError si les données sont invalides
   * @throws AuthError si l'email ou password est incorrect
   * 
   * @example
   * POST /api/auth/login
   * Body:
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePassword123"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "message": "Login successful",
   *   "data": {
   *     "user": {
   *       "id": "cm2xj5k8p0000uxvw9c1a2b3c",
   *       "email": "user@example.com",
   *       "username": "johndoe",
   *       "avatarUrl": null,
   *       "createdAt": "2024-11-05T14:30:00.000Z"
   *     },
   *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *   }
   * }
   * 
   * + Cookie: token=eyJhbG... (httpOnly, secure)
   */
  app.post<{ Body: LoginRequest }>(
    '/api/auth/login',
    async (request, reply) => {
      // Appeler le service pour connecter l'utilisateur
      const result = await authService.login(request.body);
      
      // Définir le cookie JWT
      reply.setCookie('token', result.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60  // 24 heures
      });
      
      // Retourner la réponse
      return formatSuccess(result, 'Login successful');
    }
  );

  /**
   * POST /api/auth/logout
   * Déconnexion de l'utilisateur
   * 
   * @requires Authentication
   * 
   * @example
   * POST /api/auth/logout
   * 
   * Response:
   * {
   *   "success": true,
   *   "message": "Logout successful"
   * }
   * 
   * + Cookie supprimé
   */
  app.post(
    '/api/auth/logout',
    { preHandler: authenticate },
    async (_request, reply) => {
      // Supprimer le cookie JWT
      reply.clearCookie('token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Retourner la réponse
      return formatSuccess(undefined, 'Logout successful');
    }
  );

  /**
   * GET /api/auth/me
   * Récupérer l'utilisateur connecté
   * 
   * @requires Authentication
   * 
   * @returns User connecté
   * 
   * @example
   * GET /api/auth/me
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "user": {
   *       "id": "cm2xj5k8p0000uxvw9c1a2b3c",
   *       "email": "user@example.com",
   *       "username": "johndoe",
   *       "avatarUrl": null,
   *       "createdAt": "2024-11-05T14:30:00.000Z"
   *     }
   *   }
   * }
   */
  app.get(
    '/api/auth/me',
    { preHandler: authenticate },
    async (request) => {
      const userId = request.user!.userId;
      
      // ✅ Utiliser UserService au lieu d'accéder directement à prisma
      const profile = await userService.getOwnProfile(userId);
      
      // Retourner l'utilisateur
      return formatSuccess({ user: profile });
    }
  );
}