import type { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterRequest } from './auth.model.js';

/**
 * Regex pour email basique
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valider les données d'inscription avec messages personnalisés
 */
export async function validateUserData(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<RegisterRequest | null> {
  const { email, username, password } = req.body as any;
  const errors: string[] = [];

  // Email
  if (!email || typeof email !== 'string') errors.push('Email is required');
  else if (!emailRegex.test(email)) errors.push('Invalid email format');
  else if (email.length > 255) errors.push('Email too long');

  // Username
  if (!username || typeof username !== 'string') errors.push("Username is required");
  else if (username.length < 3) errors.push("Username too short");
  else if (username.length > 20) errors.push("Username too long");
  else if (!/^[a-zA-Z0-9]+$/.test(username)) errors.push("Username can only contain letters and numbers");

  // Password
  if (!password || typeof password !== 'string') errors.push("Password is required");
  else {
    if (password.length < 8) errors.push("Password must be at least 8 characters long");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
    if (!/\d/.test(password)) errors.push("Password must contain at least one digit");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must contain at least one special character");
  }

  if (errors.length > 0) {
    await reply.code(400).send({
      error: {
        code: "VALIDATION_ERROR",
        messages: errors,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.url
      }
    });
    return null;
  }

  return { email, username, password };
}
