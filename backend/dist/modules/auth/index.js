/**
 * Module Auth - Point d'entrée
 */
import { AuthService } from './auth.service.js';
import { UserService } from '../users/users.service.js'; // ← Ajouter
import { authController } from './auth.controller.js';
/**
 * Initialiser le module Auth
 *
 * @param app - Instance Fastify
 * @param prisma - Client Prisma
 */
export function setupAuthModule(app, prisma) {
    // Créer les services
    const authService = new AuthService(prisma);
    const userService = new UserService(prisma); // ← Ajouter
    // Enregistrer les routes (passer les 2 services)
    authController(app, authService, userService); // ← Ajouter userService
}
