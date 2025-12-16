// backend/src/modules/auth/auth.validation.ts

import type { RegisterRequest, LoginRequest } from './auth.model.js';

/**
 * Regex pour email basique
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide les champs d'inscription (register) et renvoie un tableau d'erreurs.
 */
export function validateRegisterFields(data: Partial<RegisterRequest>): string[] {
  const { email, username, password } = data;
  const errors: string[] = [];

  // Email
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  } else if (email.length > 255) {
    errors.push('Email too long');
  }

  // Username
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
  } else if (username.length < 3) {
    errors.push('Username too short');
  } else if (username.length > 10) {
    errors.push('Username too long');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    // ⇧ ici tu mets la règle que tu veux garder : avec ou sans _ / -
    errors.push('Username can only contain letters, numbers, underscores and hyphens');
  }

  // Password
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one digit');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return errors;
}

/**
 * Valide les champs de login et renvoie un tableau d'erreurs.
 */
export function validateLoginFields(data: Partial<LoginRequest>): string[] {
  const errors: string[] = [];

  if (!data.username || typeof data.username !== 'string') {
    errors.push('Username is required');
  }
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  }

  return errors;
}
