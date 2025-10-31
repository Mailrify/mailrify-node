const WORD_SEPARATOR = /[_-]+/g;

export function toCamelCase(value: string): string {
  return value
    .toLowerCase()
    .replace(WORD_SEPARATOR, ' ')
    .split(' ')
    .map((chunk, index) => (index === 0 ? chunk : chunk.charAt(0).toUpperCase() + chunk.slice(1)))
    .join('');
}

export function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function keysToCamel<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => keysToCamel(item)) as T;
  }

  if (input && typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[toCamelCase(key)] = keysToCamel(value);
    }
    return result as T;
  }

  return input as T;
}

export function keysToSnake<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => keysToSnake(item)) as T;
  }

  if (input && typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[toSnakeCase(key)] = keysToSnake(value);
    }
    return result as T;
  }

  return input as T;
}
