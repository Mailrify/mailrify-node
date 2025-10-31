export interface MailrifyErrorPayload {
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
}

export interface MailrifyErrorOptions {
  status?: number;
  code?: string;
  details?: unknown;
  requestId?: string | null;
  cause?: unknown;
}

export class MailrifyError extends Error {
  public readonly status?: number;

  public readonly code?: string;

  public readonly details?: unknown;

  public readonly requestId?: string | null;

  constructor(message: string, options: MailrifyErrorOptions = {}) {
    super(message);
    this.name = 'MailrifyError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.requestId = options.requestId ?? undefined;
    if (options.cause) {
      (this as Error).cause = options.cause;
    }
  }
}

export class HTTPError extends MailrifyError {
  public readonly status: number;

  constructor(message: string, options: MailrifyErrorOptions & { status: number }) {
    super(message, options);
    this.name = 'HTTPError';
    this.status = options.status;
  }
}

export class ValidationError extends MailrifyError {
  constructor(message: string, options: MailrifyErrorOptions = {}) {
    super(message, { ...options, status: options.status ?? 400 });
    this.name = 'ValidationError';
  }
}

export class AuthError extends HTTPError {
  constructor(message: string, options: MailrifyErrorOptions & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 401 });
    this.name = 'AuthError';
  }
}

export class RateLimitError extends HTTPError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options: MailrifyErrorOptions & { status?: number; retryAfter?: number } = {},
  ) {
    super(message, { ...options, status: options.status ?? 429 });
    this.name = 'RateLimitError';
    this.retryAfter = options.retryAfter;
  }
}
