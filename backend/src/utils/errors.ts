export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(400, message, code);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code = 'AUTH_ERROR') {
    super(401, message, code);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(404, message, code);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(409, message, code);
    this.name = 'ConflictError';
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(500, message, code);
    this.name = 'InternalError';
  }
}

// Format de réponse d'erreur normalisé
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
  };
}

export function formatError(
  error: AppError | Error,
  path?: string
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        path
      }
    };
  }

  // Erreur non gérée (ne jamais exposer le détail en production)
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path
    }
  };
}