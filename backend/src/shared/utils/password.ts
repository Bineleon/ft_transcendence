import bcrypt from 'bcrypt';

/**
 * Nombre de rounds pour le salage bcrypt
 * Plus le nombre est élevé, plus le hash est sécurisé mais lent
 * 
 * Recommandations:
 * - 10 rounds = ~65ms (développement, rapide)
 * - 12 rounds = ~260ms (production, équilibre)
 * - 14 rounds = ~1s (haute sécurité)
 */
const SALT_ROUNDS = 10; // En prod changer a 12 

/**
 * Hasher un mot de passe avec bcrypt
 * 
 * @param plainPassword - Mot de passe en clair
 * @returns Mot de passe hashé
 * 
 * @example
 * const hashed = await hashPassword('MySecretPassword123');
 * // Résultat: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Comparer un mot de passe en clair avec un hash
 * 
 * @param plainPassword - Mot de passe en clair à vérifier
 * @param hashedPassword - Hash stocké en base de données
 * @returns true si le mot de passe correspond, false sinon
 * 
 * @example
 * const isValid = await comparePassword('MyPassword', user.password);
 * if (isValid) {
 *   console.log('Mot de passe correct');
 * } else {
 *   console.log('Mot de passe incorrect');
 * }
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}