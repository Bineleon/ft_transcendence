// src/modules/auth/index.ts
import { AuthService } from './auth.service.js';
import { UserService } from '../users/users.service.js';
import { RefreshService } from './refresh.service.js';
import { authController } from './auth.controller.js';
// src/modules/auth/index.ts
export function setupAuthModule(app, prisma) {
    const authService = new AuthService(prisma);
    const userService = new UserService(prisma);
    const refreshService = new RefreshService(prisma);
    // Passe RefreshService en 4ᵉ argument
    authController(app, authService, userService, refreshService);
}
