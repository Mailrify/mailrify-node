import { ValidationError } from '../errors.js';

export function assertNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`Expected non-empty string for '${fieldName}'.`);
  }
}

export function assertArray<T = unknown>(value: unknown, fieldName: string): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`Expected array for '${fieldName}'.`);
  }
}

export function assertIsoDate(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`Expected ISO-8601 date string for '${fieldName}'.`);
  }
}

export function optionalIsoDate(value: unknown, fieldName: string): void {
  if (value === undefined || value === null) {
    return;
  }
  assertIsoDate(value, fieldName);
}

export function assertPositiveNumber(value: unknown, fieldName: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new ValidationError(`Expected positive number for '${fieldName}'.`);
  }
}
