import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';
/**
 * Générer un token JWT
 */
export function generateToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}
/**
 * Vérifier un token JWT
 * @throws Erreur si token invalide ou expiré
 */
export function verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
