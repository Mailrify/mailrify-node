import type { InterceptorConfig } from './interceptors.js';
import { ValidationError } from './errors.js';

export const DEFAULT_BASE_URL = 'https://app.mailrify.com/api';
export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_RETRY_DELAY = 500;

export interface RetryConfig {
  /** Maximum additional attempts after the initial request. */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff. */
  retryDelayMs?: number;
}

export interface ClientConfig extends RetryConfig {
  /** Mailrify API key. */
  apiKey: string;
  /** Mailrify API base URL. Defaults to production endpoint. */
  baseUrl?: string;
  /** Default timeout in milliseconds per request. */
  timeout?: number;
  /** Custom fetch implementation (useful for tests). Defaults to global fetch. */
  fetch?: typeof fetch;
  /** Additional headers appended to every request. */
  headers?: Record<string, string>;
  /** Optional interceptors for diagnostics, tracing, etc. */
  interceptors?: InterceptorConfig;
  /** When true, logs sanitized request/response metadata via console.debug. */
  debug?: boolean;
  /** Optional user agent segment appended to the default SDK agent. */
  userAgent?: string;
}

export interface ResolvedClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  fetch: typeof fetch;
  headers: Record<string, string>;
  interceptors: InterceptorConfig;
  debug: boolean;
  retry: {
    maxRetries: number;
    retryDelayMs: number;
  };
  userAgent?: string;
}

export function validateConfig(
  config: ClientConfig,
): asserts config is ClientConfig {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('Mailrify client configuration must be an object.');
  }

  if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim().length === 0) {
    throw new ValidationError('Mailrify client requires a non-empty apiKey.');
  }

  if (config.baseUrl && typeof config.baseUrl !== 'string') {
    throw new ValidationError('baseUrl must be a string when provided.');
  }

  if (config.timeout !== undefined) {
    if (!Number.isFinite(config.timeout) || config.timeout <= 0) {
      throw new ValidationError('timeout must be a positive number when provided.');
    }
  }

  if (config.maxRetries !== undefined && config.maxRetries < 0) {
    throw new ValidationError('maxRetries cannot be negative.');
  }

  if (config.retryDelayMs !== undefined && config.retryDelayMs < 0) {
    throw new ValidationError('retryDelayMs cannot be negative.');
  }
}

export function resolveConfig(config: ClientConfig): ResolvedClientConfig {
  validateConfig(config);
  const baseUrl = config.baseUrl?.replace(/\/+$/, '') ?? DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = config.retryDelayMs ?? DEFAULT_RETRY_DELAY;
  const fetchImpl = config.fetch ?? globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required (Node 18+ provides a global fetch).');
  }

  return {
    apiKey: config.apiKey,
    baseUrl,
    timeout,
    fetch: fetchImpl,
    headers: { ...(config.headers ?? {}) },
    interceptors: config.interceptors ?? {},
    debug: Boolean(config.debug),
    retry: {
      maxRetries,
      retryDelayMs,
    },
    userAgent: config.userAgent,
  };
}
