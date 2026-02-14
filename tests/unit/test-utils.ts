import { vi } from 'vitest';

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];
type FetchQueueItem =
  | Response
  | Error
  | ((input: FetchInput, init?: FetchInit) => Promise<Response> | Response);

export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  });
}

export function emptyResponse(status = 204, headers: HeadersInit = {}): Response {
  return new Response(null, {
    status,
    headers
  });
}

export function installFetchMock(queue: FetchQueueItem[]) {
  const fetchMock = vi.fn(async (input: FetchInput, init?: FetchInit) => {
    const next = queue.shift();
    if (!next) {
      throw new Error('No mocked fetch response configured.');
    }

    if (next instanceof Error) {
      throw next;
    }

    if (typeof next === 'function') {
      return await next(input, init);
    }

    return next;
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function getRequest(fetchMock: ReturnType<typeof vi.fn>, index = 0): { url: string; init: RequestInit } {
  const call = fetchMock.mock.calls[index];
  if (!call) {
    throw new Error(`Fetch call at index ${index} was not found.`);
  }

  return {
    url: String(call[0]),
    init: (call[1] as RequestInit | undefined) ?? {}
  };
}
