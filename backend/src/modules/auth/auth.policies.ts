import type { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterRequest } from './auth.model.js';
import { validateRegisterFields } from './auth.validation.js';
/**
 * Valider les données d'inscription avec messages personnalisés
 */

export async function validateUserData(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<RegisterRequest | null> {
  const { email, username, password } = req.body as any;

  const errors = validateRegisterFields({ email, username, password });

  if (errors.length > 0) {
    await reply.code(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: errors.join(" | "),
        messages: errors,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.url
      }
    });
    return null;
  }

  // On sait ici que les champs sont valides
  return { email, username, password };
}
