import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

/**
 * Payload du JWT
 */
export interface JwtPayload {
  userId: string;
}

/**
 * Générer un token JWT
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Vérifier un token JWT
 * @throws Erreur si token invalide ou expiré
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}