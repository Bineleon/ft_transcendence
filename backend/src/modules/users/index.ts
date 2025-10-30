/**
 * Point d'entrée du module Users
 */

export { UserService } from './users.service.js';
export { userController } from './users.controller.js';
export type { 
  UpdateUserRequest,
  UpdateUserData
} from './users.model.js';

// Re-exporter les types User communs
export type { FormattedUser, PublicUser } from '../../shared/types/user.js';