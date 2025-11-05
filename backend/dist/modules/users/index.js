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
import { UserService } from './users.service.js';
import { userController } from './users.controller.js';
/**
 * Initialiser le module Users
 *
 * @param app - Instance Fastify
 * @param prisma - Client Prisma
 */
export function setupUserModule(app, prisma) {
    // Créer le service
    const userService = new UserService(prisma);
    // Enregistrer les routes
    userController(app, userService);
}
