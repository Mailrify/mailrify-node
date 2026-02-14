import { describe, expect, it } from 'vitest';

import {
  ApiError,
  AuthenticationError,
  MailrifyError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  createMailrifyError
} from '../../src/errors';

describe('errors', () => {
  it('creates validation errors for 400', () => {
    const error = createMailrifyError(400, { message: 'Bad request' });
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Bad request');
  });

  it('creates authentication errors for 401', () => {
    const error = createMailrifyError(401, { message: 'Unauthorized' });
    expect(error).toBeInstanceOf(AuthenticationError);
  });

  it('creates not found errors for 404', () => {
    const error = createMailrifyError(404, { message: 'Missing' });
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('creates rate limit errors for 429', () => {
    const error = createMailrifyError(429, { message: 'Too many requests' }, 5);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(5);
  });

  it('creates api errors for 5xx', () => {
    const error = createMailrifyError(500, { message: 'Internal server error' });
    expect(error).toBeInstanceOf(ApiError);
  });

  it('falls back to MailrifyError for unmapped status', () => {
    const error = createMailrifyError(418, { message: 'I am a teapot' });
    expect(error).toBeInstanceOf(MailrifyError);
  });
});
