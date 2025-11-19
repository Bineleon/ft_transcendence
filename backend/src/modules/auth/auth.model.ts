
/**
 * Modèle pour l'authentification
 * Définit les types de données pour l'inscription, la connexion et les tokens
 */

/**
 * Requête pour s'inscrire (créer un compte)
 */
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

/**
 * Requête pour se connecter
 */
export interface LoginRequest {
  username: string;
  password: string;
}


/**
 * Réponse après une inscription ou connexion réussie
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  token: string;  // JWT token (sera aussi dans un cookie httpOnly)
}

/**
 * Requête pour le refresh token (optionnel pour plus tard)
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Réponse du refresh token (optionnel pour plus tard)
 */
export interface RefreshTokenResponse {
  token: string;
}

/**
 * Requête pour activer/désactiver 2FA (optionnel pour plus tard)
 */
export interface TwoFARequest {
  code: string;
}

/**
 * Réponse pour setup 2FA (optionnel pour plus tard)
 */
export interface TwoFASetupResponse {
  secret: string;
  qrCode: string;  // Base64 image du QR code
}

