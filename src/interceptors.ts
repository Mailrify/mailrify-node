export interface RequestContext {
  url: URL;
  init: RequestInit;
}

export interface ResponseContext extends RequestContext {
  response: Response;
}

export interface ErrorContext extends RequestContext {
  error: unknown;
}

export type RequestInterceptor = (
  context: RequestContext,
) => Promise<RequestContext> | RequestContext;
export type ResponseInterceptor = (
  context: ResponseContext,
) => Promise<Response | ResponseContext> | Response | ResponseContext;
export type ErrorInterceptor = (context: ErrorContext) => Promise<void> | void;

export interface InterceptorConfig {
  request?: RequestInterceptor[];
  response?: ResponseInterceptor[];
  error?: ErrorInterceptor[];
}
