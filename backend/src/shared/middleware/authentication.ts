import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthError, ForbiddenError } from '../errors/index.js';
import { verifyToken, type JwtPayload } from '../utils/jwt.js';

/**
 * Déclaration TypeScript pour ajouter 'user' à FastifyRequest
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

/**
 * Middleware : Vérifier que l'utilisateur est authentifié
 * Lance une erreur 401 si pas de token valide
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  
  const token = request.cookies.token;
  
  if (!token) {
    throw new AuthError('Authentication required');
  }

  try {
    const decoded = verifyToken(token);
    request.user = decoded;
  } catch (error) {
    throw new AuthError('Invalid or expired token');
  }
}

/**
 * Middleware : Vérifier que l'utilisateur accède à sa propre ressource
 * Doit être utilisé APRÈS authenticate
 */
export async function requireOwner(
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply
): Promise<void> {
  
  if (!request.user) {
    throw new AuthError('Authentication required');
  }

  const resourceId = request.params.id;
  const userId = request.user.userId;

  if (resourceId !== userId) {
    throw new ForbiddenError('Access denied');
  }
}