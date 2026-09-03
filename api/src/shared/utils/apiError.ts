/**
 * API error codes. These match docs/api-contract.md §1.3 exactly.
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * Every expected error is thrown as an ApiError. The error handler recognises
 * it and maps it to the right status and envelope; anything else becomes a 500.
 *
 * Messages here are developer-facing. Clients switch on `code`, and the
 * frontend decides what an end user actually sees.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static validation(message: string, details?: ErrorDetail[]) {
    return new ApiError(ErrorCode.VALIDATION_ERROR, message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(ErrorCode.UNAUTHORIZED, message);
  }
  static forbidden(message = "You do not have access to this resource") {
    return new ApiError(ErrorCode.FORBIDDEN, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(ErrorCode.NOT_FOUND, message);
  }
  static conflict(message: string) {
    return new ApiError(ErrorCode.CONFLICT, message);
  }
}
