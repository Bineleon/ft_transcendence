/**
 * Types communs backend/frontend
 */

export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;