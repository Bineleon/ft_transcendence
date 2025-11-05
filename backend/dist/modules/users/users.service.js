/**
 * Service pour la gestion des utilisateurs
 */
import { hashPassword, comparePassword } from '../../shared/utils/password.js';
import { formatUser } from '../../shared/utils/formatters.js';
import { ValidationError, NotFoundError, ConflictError, AuthError } from '../../shared/errors/index.js';
export class UserService {
    prisma;
    // Limite fixe pour la recherche d'utilisateurs
    SEARCH_LIMIT = 50;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Récupérer son propre profil (avec email)
     *
     * @param userId - ID de l'utilisateur connecté
     * @returns Profil complet avec email
     *
     * @throws NotFoundError si l'utilisateur n'existe pas
     *
     * @example
     * const profile = await userService.getOwnProfile('cm2xj5k8p0000uxvw9c1a2b3c');
     * // { id: '...', email: 'user@example.com', username: 'john', ... }
     */
    async getOwnProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return formatUser(user);
    }
    /**
     * Récupérer le profil public d'un autre utilisateur (sans email)
     *
     * @param userId - ID de l'utilisateur à consulter
     * @returns Profil public sans email
     *
     * @throws NotFoundError si l'utilisateur n'existe pas
     *
     * @example
     * const profile = await userService.getPublicProfile('cm2xj5k8p0000uxvw9c1a2b3c');
     * // { id: '...', username: 'john', createdAt: '...' }
     */
    async getPublicProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                createdAt: true
            }
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt.toISOString()
        };
    }
    /**
     * Mettre à jour son profil
     *
     * @param userId - ID de l'utilisateur
     * @param data - Données à mettre à jour (email, username, password)
     * @returns Profil mis à jour
     *
     * @throws NotFoundError si l'utilisateur n'existe pas
     * @throws ValidationError si les données sont invalides
     * @throws ConflictError si l'email/username est déjà pris
     *
     * @example
     * const profile = await userService.updateProfile('cm2xj5k8p0000uxvw9c1a2b3c', {
     *   email: 'newemail@example.com',
     *   username: 'newusername'
     * });
     */
    async updateProfile(userId, data) {
        // Vérifier que l'utilisateur existe
        const exists = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!exists) {
            throw new NotFoundError('User not found');
        }
        // Validation email
        if (data.email !== undefined) {
            // Vérifier si l'email est déjà utilisé par un autre utilisateur
            const emailTaken = await this.prisma.user.findFirst({
                where: {
                    email: data.email,
                    id: { not: userId } // Exclure l'utilisateur actuel
                }
            });
            if (emailTaken) {
                throw new ConflictError('Email already in use');
            }
            // Validation basique du format email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                throw new ValidationError('Invalid email format');
            }
        }
        // Validation username
        if (data.username !== undefined) {
            if (data.username.length < 3 || data.username.length > 20) {
                throw new ValidationError('Username must be between 3 and 20 characters');
            }
            // Vérifier si le username est déjà pris
            const usernameTaken = await this.prisma.user.findFirst({
                where: {
                    username: data.username,
                    id: { not: userId }
                }
            });
            if (usernameTaken) {
                throw new ConflictError('Username already in use');
            }
        }
        // Validation password
        if (data.password !== undefined) {
            if (data.password.length < 8) {
                throw new ValidationError('Password must be at least 8 characters long');
            }
        }
        // Préparer les données pour Prisma
        const updateData = {
            ...(data.email && { email: data.email }),
            ...(data.username && { username: data.username }),
            ...(data.password && { password: await hashPassword(data.password) })
        };
        // Mettre à jour
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        return formatUser(user);
    }
    /**
     * Changer son mot de passe (avec vérification de l'ancien)
     *
     * @param userId - ID de l'utilisateur
     * @param data - Ancien et nouveau password
     *
     * @throws NotFoundError si l'utilisateur n'existe pas
     * @throws ValidationError si les données sont invalides
     * @throws AuthError si l'ancien password est incorrect
     *
     * @example
     * await userService.changePassword('cm2xj5k8p0000uxvw9c1a2b3c', {
     *   currentPassword: 'oldPassword123',
     *   newPassword: 'newPassword456'
     * });
     */
    async changePassword(userId, data) {
        // Validation
        if (!data.currentPassword || !data.newPassword) {
            throw new ValidationError('Current and new password are required');
        }
        if (data.newPassword.length < 8) {
            throw new ValidationError('New password must be at least 8 characters long');
        }
        if (data.currentPassword === data.newPassword) {
            throw new ValidationError('New password must be different from current password');
        }
        // Récupérer l'utilisateur
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        // Vérifier l'ancien password
        const isValid = await comparePassword(data.currentPassword, user.passwordHash);
        if (!isValid) {
            throw new AuthError('Current password is incorrect');
        }
        // Mettre à jour le password
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: await hashPassword(data.newPassword)
            }
        });
    }
    /**
     * Rechercher des utilisateurs par username
     *
     * Limite fixe à 50 résultats pour des raisons de performance et sécurité
     *
     * @param search - Terme de recherche (optionnel, vide = tous les users)
     * @returns Liste d'utilisateurs (max 50) + info sur le total
     *
     * @example
     * // Rechercher "john"
     * const result = await userService.searchUsers('john');
     * // {
     * //   items: [{ id: '1', username: 'john' }, ...],
     * //   total: 127,
     * //   limit: 50,
     * //   hasMore: true
     * // }
     *
     * @example
     * // Tous les utilisateurs (50 premiers)
     * const result = await userService.searchUsers('');
     */
    async searchUsers(search) {
        const limit = this.SEARCH_LIMIT;
        // Construire le filtre de recherche
        const where = search
            ? {
                username: {
                    contains: search,
                    mode: 'insensitive' // Case-insensitive
                }
            }
            : {}; // Pas de filtre si search vide
        // Récupérer les utilisateurs
        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                avatarUrl: true
            },
            take: limit,
            orderBy: { username: 'asc' }
        });
        // Compter le total (pour savoir s'il y a plus de résultats)
        const total = await this.prisma.user.count({ where });
        // Retourner les résultats + métadonnées
        return {
            items: users,
            total,
            limit,
            hasMore: total > limit
        };
    }
    /**
     * Supprimer son compte
     *
     * ⚠️ Action irréversible !
     *
     * @param userId - ID de l'utilisateur à supprimer
     *
     * @throws NotFoundError si l'utilisateur n'existe pas
     *
     * @example
     * await userService.deleteAccount('cm2xj5k8p0000uxvw9c1a2b3c');
     */
    async deleteAccount(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        // TODO: Supprimer aussi les données associées (games, etc.)
        // Pour l'instant, Prisma cascade delete devrait s'en charger
        // selon votre schema.prisma (onDelete: Cascade)
        await this.prisma.user.delete({
            where: { id: userId }
        });
    }
    /**
     * Vérifier si un utilisateur existe
     *
     * Utile pour valider un userId avant une action
     *
     * @param userId - ID de l'utilisateur
     * @returns true si l'utilisateur existe, false sinon
     *
     * @example
     * const exists = await userService.userExists('cm2xj5k8p0000uxvw9c1a2b3c');
     * if (!exists) {
     *   throw new NotFoundError('User not found');
     * }
     */
    async userExists(userId) {
        const count = await this.prisma.user.count({
            where: { id: userId }
        });
        return count > 0;
    }
    /**
     * Obtenir le nombre total d'utilisateurs
     *
     * Utile pour les statistiques, dashboard admin, etc.
     *
     * @returns Nombre total d'utilisateurs
     *
     * @example
     * const total = await userService.getTotalUsers();
     * console.log(`Total users: ${total}`);
     */
    async getTotalUsers() {
        return this.prisma.user.count();
    }
}
