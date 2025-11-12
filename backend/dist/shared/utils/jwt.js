import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';
/**
 * Générer un token JWT
 */
export function generateToken(payload, expiresIn = env.JWT_EXPIRES_IN) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn });
}
/**
 * Générer un refresh token JWT
 */
export function generateRefreshToken(payload, expiresIn = env.REFRESH_TOKEN_EXPIRES_IN) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn });
}
/**
 * Vérifier un token JWT
 * @throws Erreur si token invalide ou expiré
 */
export function verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
