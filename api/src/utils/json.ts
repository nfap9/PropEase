import type { Prisma } from '@prisma/client';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item)) as Prisma.InputJsonArray;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, normalizeJsonValue(entry)])
    ) as Prisma.InputJsonObject;
  }

  throw new TypeError('Value is not JSON-serializable');
}

export function toPrismaInputJsonValue(value: unknown): Prisma.InputJsonValue {
  const normalized = normalizeJsonValue(value);

  if (normalized === null) {
    throw new TypeError('Top-level JSON value cannot be null');
  }

  return normalized;
}
