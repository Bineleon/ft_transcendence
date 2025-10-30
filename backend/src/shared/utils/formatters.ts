/**
 * Utilitaires de formatage pour standardiser les données
 */

/**
 * Formater un utilisateur (sans password)
 */
export function formatUser(user: {
  id: string;
  email: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

/**
 * Formater un profil public (sans email ni password)
 */
export function formatPublicUser(user: {
  id: string;
  username: string;
  email?: string;
  password?: string;
}) {
  return {
    id: user.id,
    username: user.username
  };
}

/**
 * Formater une date
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Formater une réponse de succès
 */
export function formatSuccess<T>(data?: T, message?: string) {
  return {
    success: true,
    ...(message && { message }),
    ...(data && { data })
  };
}

/**
 * Formater une réponse paginée
 */
// export function formatPaginatedResponse<T>(
//   items: T[],
//   total: number,
//   page: number,
//   limit: number
// ) {
//   return {
//     items,
//     pagination: {
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit)
//     }
//   };
// }