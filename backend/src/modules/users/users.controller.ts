/**
 * Controller pour les routes utilisateurs
 */

import type { FastifyInstance } from 'fastify';
import type { UserService } from './users.service.js';
import type {
  SearchUsersQuery,
  UpdateProfileRequest,
  ChangePasswordRequest
} from './users.model.js';
import { formatSuccess } from '../../shared/utils/formatters.js';
import { authenticate, requireOwner } from '../../shared/middleware/index.js';

/**
 * Enregistrer toutes les routes utilisateurs
 * 
 * @param app - Instance Fastify
 * @param userService - Service utilisateur
 */
export function userController(app: FastifyInstance, userService: UserService) {
  
  /**
   * GET /api/users/me
   * Récupérer son propre profil (avec email)
   * 
   * @requires Authentication
   * 
   * @returns UserProfile (avec email)
   * 
   * @example
   * GET /api/users/me
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "profile": {
   *       "id": "cm2xj5k8p0000uxvw9c1a2b3c",
   *       "email": "user@example.com",
   *       "username": "johndoe",
   *       "avatarUrl": "https://example.com/avatar.jpg",
   *       "createdAt": "2024-10-30T14:30:00.000Z",
   *       "updatedAt": "2024-10-30T14:30:00.000Z"
   *     }
   *   }
   * }
   */
  app.get('/api/users/me', 
    { preHandler: authenticate },
    async (request) => {
      const userId = request.user!.userId;
      const profile = await userService.getOwnProfile(userId);
      
      return formatSuccess({ profile });
    }
  );

  /**
   * GET /api/users/:id
   * Récupérer le profil d'un utilisateur
   * 
   * @requires Authentication
   * 
   * @returns UserProfile (si c'est son propre profil) ou PublicUserProfile (si c'est un autre)
   * 
   * @example
   * GET /api/users/cm2xj5k8p0000uxvw9c1a2b3c
   * Response (profil public):
   * {
   *   "success": true,
   *   "data": {
   *     "profile": {
   *       "id": "cm2xj5k8p0000uxvw9c1a2b3c",
   *       "username": "johndoe",
   *       "avatarUrl": "https://example.com/avatar.jpg",
   *       "createdAt": "2024-10-30T14:30:00.000Z"
   *     }
   *   }
   * }
   */
  app.get<{ Params: { id: string } }>(
    '/api/users/:id', 
    { preHandler: authenticate },
    async (request) => {
      const userId = request.params.id;
      const myId = request.user!.userId;
      
      // Si c'est son propre profil → profil complet avec email
      if (userId === myId) {
        const profile = await userService.getOwnProfile(userId);
        return formatSuccess({ profile });
      }
      
      // Sinon → profil public (sans email)
      const profile = await userService.getPublicProfile(userId);
      return formatSuccess({ profile });
    }
  );

  /**
   * PUT /api/users/:id
   * Mettre à jour son profil
   * 
   * @requires Authentication
   * @requires Owner (seul le propriétaire peut modifier son profil)
   * 
   * @body UpdateProfileRequest { email?, username?, password?, avatarUrl? }
   * 
   * @returns UserProfile mis à jour
   * 
   * @throws ValidationError si les données sont invalides
   * @throws ConflictError si l'email/username est déjà pris
   * @throws NotFoundError si l'utilisateur n'existe pas
   * 
   * @example
   * PUT /api/users/cm2xj5k8p0000uxvw9c1a2b3c
   * Body:
   * {
   *   "email": "newemail@example.com",
   *   "username": "newusername",
   *   "avatarUrl": "https://example.com/new-avatar.jpg"
   * }
   * Response:
   * {
   *   "success": true,
   *   "message": "Profile updated successfully",
   *   "data": {
   *     "profile": {
   *       "id": "cm2xj5k8p0000uxvw9c1a2b3c",
   *       "email": "newemail@example.com",
   *       "username": "newusername",
   *       "avatarUrl": "https://example.com/new-avatar.jpg",
   *       "createdAt": "2024-10-30T14:30:00.000Z",
   *       "updatedAt": "2024-11-05T10:15:00.000Z"
   *     }
   *   }
   * }
   */
  app.put<{ 
    Params: { id: string }, 
    Body: UpdateProfileRequest 
  }>('/api/users/:id', 
    { preHandler: [authenticate, requireOwner] },
    async (request) => {
      const userId = request.params.id;
      const profile = await userService.updateProfile(userId, request.body);
      
      return formatSuccess({ profile }, 'Profile updated successfully');
    }
  );

  /**
   * PUT /api/users/:id/password
   * Changer son mot de passe
   * 
   * @requires Authentication
   * @requires Owner
   * 
   * @body ChangePasswordRequest { currentPassword, newPassword }
   * 
   * @throws ValidationError si les données sont invalides
   * @throws AuthError si le currentPassword est incorrect
   * @throws NotFoundError si l'utilisateur n'existe pas
   * 
   * @example
   * PUT /api/users/cm2xj5k8p0000uxvw9c1a2b3c/password
   * Body:
   * {
   *   "currentPassword": "oldPassword123",
   *   "newPassword": "newPassword456"
   * }
   * Response:
   * {
   *   "success": true,
   *   "message": "Password changed successfully"
   * }
   */
  app.put<{ 
    Params: { id: string }, 
    Body: ChangePasswordRequest 
  }>('/api/users/:id/password', 
    { preHandler: [authenticate, requireOwner] },
    async (request) => {
      const userId = request.params.id;
      await userService.changePassword(userId, request.body);
      
      return formatSuccess(undefined, 'Password changed successfully');
    }
  );

  /**
   * DELETE /api/users/:id
   * Supprimer son compte
   * 
   * @requires Authentication
   * @requires Owner
   * 
   * @throws NotFoundError si l'utilisateur n'existe pas
   * 
   * @example
   * DELETE /api/users/cm2xj5k8p0000uxvw9c1a2b3c
   * Response:
   * {
   *   "success": true,
   *   "message": "Account deleted successfully"
   * }
   */
  app.delete<{ Params: { id: string } }>(
    '/api/users/:id', 
    { preHandler: [authenticate, requireOwner] },
    async (request, reply) => {
      const userId = request.params.id;
      await userService.deleteAccount(userId);
      
      // Supprimer le cookie JWT (déconnexion)
      reply.clearCookie('token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return formatSuccess(undefined, 'Account deleted successfully');
    }
  );

  /**
   * GET /api/users
   * Rechercher des utilisateurs par username
   * 
   * @requires Authentication
   * 
   * @query search (optionnel) - Terme de recherche
   * 
   * @returns Liste d'utilisateurs (max 50) + métadonnées
   * 
   * @example
   * GET /api/users?search=john
   * Response:
   * {
   *   "items": [
   *     { "id": "1", "username": "john", "avatarUrl": "..." },
   *     { "id": "2", "username": "johnny", "avatarUrl": null }
   *   ],
   *   "total": 127,
   *   "limit": 50,
   *   "hasMore": true
   * }
   * 
   * @example
   * GET /api/users (tous les utilisateurs, 50 premiers)
   * Response:
   * {
   *   "items": [...],
   *   "total": 1024,
   *   "limit": 50,
   *   "hasMore": true
   * }
   */
  app.get<{ Querystring: SearchUsersQuery }>(
    '/api/users', 
    { preHandler: authenticate },
    async (request) => {
      const search = request.query.search || '';
      
      const result = await userService.searchUsers(search);
      
      // Retourner directement le résultat (pas de formatSuccess ici)
      // Car result contient déjà { items, total, limit, hasMore }
      return result;
    }
  );
}