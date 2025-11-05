/**
 * Classe de base pour toutes les erreurs applicatives
 * Toutes les erreurs custom héritent de cette classe
 */
export class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        // Maintient la stack trace correcte
        Error.captureStackTrace(this, this.constructor);
        // Set le nom de la classe pour les logs
        this.name = this.constructor.name;
    }
}
