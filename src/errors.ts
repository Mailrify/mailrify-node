import type { ApiErrorPayload } from './types';

export class MailGlyphError extends Error {
  public readonly status: number | undefined;
  public readonly code: number | undefined;
  public readonly details: unknown;

  constructor(
    message: string,
    options?: { status?: number | undefined; code?: number | undefined; details?: unknown | undefined }
  ) {
    super(message);
    this.name = 'MailGlyphError';
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export class AuthenticationError extends MailGlyphError {
  constructor(
    message = 'Authentication failed',
    options?: { status?: number | undefined; code?: number | undefined; details?: unknown | undefined }
  ) {
    super(message, options);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends MailGlyphError {
  constructor(
    message = 'Validation failed',
    options?: { status?: number | undefined; code?: number | undefined; details?: unknown | undefined }
  ) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends MailGlyphError {
  constructor(
    message = 'Resource not found',
    options?: { status?: number | undefined; code?: number | undefined; details?: unknown | undefined }
  ) {
    super(message, options);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends MailGlyphError {
  public readonly retryAfter: number | undefined;

  constructor(
    message = 'Rate limit exceeded',
    options?: {
      status?: number | undefined;
      code?: number | undefined;
      details?: unknown | undefined;
      retryAfter?: number | undefined;
    }
  ) {
    super(message, options);
    this.name = 'RateLimitError';
    this.retryAfter = options?.retryAfter;
  }
}

export class ApiError extends MailGlyphError {
  constructor(
    message = 'API error',
    options?: { status?: number | undefined; code?: number | undefined; details?: unknown | undefined }
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}

export function createMailGlyphError(
  status: number,
  payload?: ApiErrorPayload,
  retryAfter?: number
): MailGlyphError {
  const message = payload?.message ?? payload?.error ?? `Request failed with status ${status}`;
  const base: { status: number; code?: number; details?: unknown } = { status };

  if (payload?.code !== undefined) {
    base.code = payload.code;
  }

  if (payload !== undefined) {
    base.details = payload;
  }

  if (status === 400) {
    return new ValidationError(message, base);
  }

  if (status === 401) {
    return new AuthenticationError(message, base);
  }

  if (status === 404) {
    return new NotFoundError(message, base);
  }

  if (status === 429) {
    return new RateLimitError(message, { ...base, retryAfter });
  }

  if (status >= 500) {
    return new ApiError(message, base);
  }

  return new MailGlyphError(message, base);
}
