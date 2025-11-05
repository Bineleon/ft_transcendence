/**
 * Module Users - Point d'entrée
 * 
 * Ce module gère toutes les opérations liées aux utilisateurs :
 * - Récupération de profil (complet ou public)
 * - Mise à jour de profil
 * - Changement de mot de passe
 * - Suppression de compte
 * - Recherche d'utilisateurs
 */

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { UserService } from './users.service.js';
import { userController } from './users.controller.js';

/**
 * Initialiser le module Users
 * 
 * @param app - Instance Fastify
 * @param prisma - Client Prisma
 */
export function setupUserModule(app: FastifyInstance, prisma: PrismaClient) {
  // Créer le service
  const userService = new UserService(prisma);

  // Enregistrer les routes
  userController(app, userService);
}

/**
 * Exporter les types publics du module
 */
export type {
  UserProfile,           // Profil complet avec email (pour l'utilisateur connecté)
  PublicUserProfile,     // Profil public sans email (pour les autres utilisateurs)
  UserListItem,          // Utilisateur dans une liste de recherche
  UpdateProfileRequest,  // Requête pour mettre à jour son profil
  ChangePasswordRequest, // Requête pour changer son mot de passe
  SearchUsersQuery       // Requête pour rechercher des utilisateurs
} from './users.model.js';