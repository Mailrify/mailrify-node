import { resolveConfig, type ClientConfig, type ResolvedClientConfig } from './config.js';
import {
  AuthError,
  HTTPError,
  MailrifyError,
  RateLimitError,
  type MailrifyErrorPayload,
} from './errors.js';
import type { InterceptorConfig, RequestContext, ResponseContext } from './interceptors.js';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface RequestOptions {
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeout?: number;
  idempotent?: boolean;
}

interface InternalRequestOptions extends RequestOptions {
  attempt: number;
}

const DEFAULT_HEADERS = {
  Accept: 'application/json',
};

export class HttpClient {
  private readonly config: ResolvedClientConfig;

  private readonly interceptors: InterceptorConfig;

  constructor(config: ClientConfig) {
    this.config = resolveConfig(config);
    this.interceptors = this.config.interceptors ?? {};
  }

  get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  put<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  patch<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  delete<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const maxRetries = options.idempotent === false ? 0 : this.config.retry.maxRetries;

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await this.dispatch<T>(method, path, { ...options, attempt });
      } catch (error) {
        lastError = error;
        if (!this.shouldRetry(method, error, options, attempt, maxRetries)) {
          throw error;
        }

        const delay = this.getRetryDelay(error, attempt);
        if (this.config.debug) {
          console.debug('[Mailrify SDK] retrying request', {
            method,
            path,
            attempt: attempt + 1,
            delay,
          });
        }
        await this.delay(delay);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new MailrifyError('Unknown request failure', { cause: lastError });
  }

  private async dispatch<T>(
    method: HttpMethod,
    path: string,
    options: InternalRequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const headers = this.buildHeaders(options.headers);

    const init: RequestInit = {
      method,
      headers,
      signal: undefined,
    };

    const body = options.body;
    if (body !== undefined && body !== null) {
      if (body instanceof FormData || body instanceof URLSearchParams || typeof body === 'string') {
        init.body = body as BodyInit;
      } else {
        init.body = JSON.stringify(body);
        if (!headers.has('content-type')) {
          headers.set('content-type', 'application/json');
        }
      }
    }

    const controller = new AbortController();
    const timeout = options.timeout ?? this.config.timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort(options.signal.reason);
      } else {
        options.signal.addEventListener(
          'abort',
          () => {
            controller.abort(options.signal?.reason);
          },
          { once: true },
        );
      }
    }

    init.signal = controller.signal;

    let requestContext: RequestContext = { url, init };
    try {
      requestContext = await this.runRequestInterceptors(requestContext);

      if (this.config.debug) {
        this.logDebug('request', requestContext, options.attempt);
      }

      const response = await this.config.fetch(requestContext.url, requestContext.init);
      clearTimeout(timeoutId);

      let finalResponse = response;
      finalResponse = await this.runResponseInterceptors(requestContext, finalResponse);

      if (this.config.debug) {
        this.logDebug('response', { ...requestContext, response: finalResponse }, options.attempt);
      }

      if (!finalResponse.ok) {
        throw await this.buildError(finalResponse, requestContext);
      }

      return (await this.parseResponse<T>(finalResponse)) ?? (undefined as T);
    } catch (error) {
      clearTimeout(timeoutId);
      await this.runErrorInterceptors(requestContext, error);
      throw error;
    }
  }

  private buildUrl(path: string, query?: Record<string, unknown>): URL {
    const baseUrl = new URL(this.config.baseUrl);
    const basePath = baseUrl.pathname.replace(/\/*$/, '');
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const combinedPath = [basePath, normalizedPath].filter(Boolean).join('/');

    baseUrl.pathname = (combinedPath ? `/${combinedPath}` : '/').replace(/\/{2,}/g, '/');
    baseUrl.search = '';
    baseUrl.hash = '';

    const url = baseUrl;
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            if (item !== undefined && item !== null) {
              url.searchParams.append(key, String(item));
            }
          }
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url;
  }

  private buildHeaders(overrideHeaders?: Record<string, string>): Headers {
    const headers = new Headers(DEFAULT_HEADERS);
    for (const [key, value] of Object.entries(this.config.headers)) {
      headers.set(key, value);
    }

    headers.set('authorization', `Bearer ${this.config.apiKey}`);
    headers.set('x-mailrify-client', 'mailrify');

    if (this.config.userAgent && typeof navigator === 'undefined') {
      headers.set('user-agent', this.config.userAgent);
    }

    if (overrideHeaders) {
      for (const [key, value] of Object.entries(overrideHeaders)) {
        headers.set(key, value);
      }
    }

    return headers;
  }

  private async parseResponse<T>(response: Response): Promise<T | undefined> {
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    const text = await response.text();
    return text ? (text as unknown as T) : undefined;
  }

  private async buildError(response: Response, context: RequestContext): Promise<MailrifyError> {
    const payload = await this.safeParseError(response);
    const requestId = response.headers.get('x-request-id');
    const baseDetails = {
      status: response.status,
      code: payload?.code,
      details: payload?.details ?? payload,
      requestId,
    };

    if (response.status === 401 || response.status === 403) {
      return new AuthError(
        payload?.message ?? payload?.error ?? 'Unauthorized request.',
        baseDetails,
      );
    }

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfter = retryAfterHeader
        ? Number.parseInt(retryAfterHeader, 10) * 1000
        : undefined;
      return new RateLimitError(payload?.message ?? 'Rate limit exceeded.', {
        ...baseDetails,
        retryAfter,
      });
    }

    const message =
      payload?.message ??
      payload?.error ??
      `Request to ${context.url.pathname} failed with status ${response.status}.`;

    return new HTTPError(message, baseDetails);
  }

  private async safeParseError(response: Response): Promise<MailrifyErrorPayload | undefined> {
    try {
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as MailrifyErrorPayload;
      }

      const text = await response.text();
      if (!text) {
        return undefined;
      }
      return { message: text };
    } catch (error) {
      if (this.config.debug) {
        console.debug('[Mailrify SDK] failed to parse error payload', error);
      }
      return undefined;
    }
  }

  private shouldRetry(
    method: HttpMethod,
    error: unknown,
    options: RequestOptions,
    attempt: number,
    maxRetries: number,
  ): boolean {
    if (attempt >= maxRetries) {
      return false;
    }

    const isIdempotent = options.idempotent ?? (method === 'GET' || method === 'HEAD');
    if (!isIdempotent) {
      return false;
    }

    if (error instanceof RateLimitError) {
      return true;
    }

    if (error instanceof HTTPError) {
      return error.status >= 500;
    }

    if (error instanceof MailrifyError) {
      return false;
    }

    return true;
  }

  private getRetryDelay(error: unknown, attempt: number): number {
    if (error instanceof RateLimitError && error.retryAfter) {
      return error.retryAfter;
    }

    return this.config.retry.retryDelayMs * 2 ** attempt;
  }

  private async delay(durationMs: number): Promise<void> {
    if (durationMs <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, durationMs));
  }

  private async runRequestInterceptors(context: RequestContext): Promise<RequestContext> {
    const interceptors = this.interceptors.request ?? [];
    let next = context;
    for (const interceptor of interceptors) {
      next = (await interceptor({ ...next, init: { ...next.init } })) ?? next;
    }
    return next;
  }

  private async runResponseInterceptors(
    context: RequestContext,
    response: Response,
  ): Promise<Response> {
    const interceptors = this.interceptors.response ?? [];
    if (interceptors.length === 0) {
      return response;
    }

    let nextContext: ResponseContext = { ...context, response };
    for (const interceptor of interceptors) {
      const result = await interceptor(nextContext);
      if (result instanceof Response) {
        nextContext = { ...nextContext, response: result };
      } else if (result) {
        nextContext = {
          url: result.url,
          init: result.init,
          response: result.response ?? nextContext.response,
        };
      }
    }

    return nextContext.response;
  }

  private async runErrorInterceptors(context: RequestContext, error: unknown): Promise<void> {
    const interceptors = this.interceptors.error ?? [];
    for (const interceptor of interceptors) {
      await interceptor({ ...context, error });
    }
  }

  private logDebug(
    kind: 'request' | 'response',
    context: RequestContext | ResponseContext,
    attempt: number,
  ): void {
    const redact = (headers: Headers) => {
      const sanitized: Record<string, string> = {};
      headers.forEach((value: string, key: string) => {
        sanitized[key] = key.toLowerCase() === 'authorization' ? 'REDACTED' : value;
      });
      return sanitized;
    };

    if (kind === 'request') {
      const requestContext = context as RequestContext;
      const headers = requestContext.init.headers
        ? requestContext.init.headers instanceof Headers
          ? requestContext.init.headers
          : new Headers(requestContext.init.headers)
        : new Headers();
      const bodyPreview =
        typeof requestContext.init.body === 'string'
          ? requestContext.init.body.slice(0, 200)
          : requestContext.init.body
            ? '[complex body]'
            : undefined;

      console.debug('[Mailrify SDK] request', {
        attempt,
        method: requestContext.init.method,
        url: requestContext.url.toString(),
        headers: redact(headers),
        body: bodyPreview,
      });
      return;
    }

    const responseContext = context as ResponseContext;
    console.debug('[Mailrify SDK] response', {
      attempt,
      url: responseContext.url.toString(),
      status: responseContext.response.status,
      headers: redact(responseContext.response.headers),
    });
  }
}

export const createHttpClient = (config: ClientConfig): HttpClient =>
  new HttpClient(config);
