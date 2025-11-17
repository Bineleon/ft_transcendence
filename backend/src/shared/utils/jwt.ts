import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

/**
 * Payload du JWT
 */
export interface JwtPayload {
  userId: string;
  email?: string;

  // Champs ajoutés par le JWT lui-même (décodage)
  iat?: number;
  exp?: number;
}


/**
 * Générer un token JWT
 */
export function generateToken(payload: JwtPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

/**
 * Générer un refresh token JWT
 */
export function generateRefreshToken(payload: JwtPayload, expiresIn: string = env.REFRESH_TOKEN_EXPIRES_IN): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

/**
 * Vérifier un token JWT
 * @throws Erreur si token invalide ou expiré
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
