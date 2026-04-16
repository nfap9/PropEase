import type { Request, Response, NextFunction } from 'express';
import { expect, vi } from 'vitest';

/**
 * Creates a mock Express Request object
 */
export function createMockRequest(overrides?: Partial<Request>): Request {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as Request;
}

/**
 * Creates a mock Express Response object with json and status spies
 */
interface MockResponse extends Response {
  _json: ReturnType<typeof vi.fn>;
  _status: ReturnType<typeof vi.fn>;
  _send: ReturnType<typeof vi.fn>;
}

export function createMockResponse(): MockResponse {
  const _json = vi.fn();
  const _status = vi.fn().mockReturnThis();
  const _send = vi.fn().mockReturnThis();

  return {
    json: _json,
    status: _status,
    send: _send,
    _json,
    _status,
    _send,
  } as unknown as MockResponse;
}

/**
 * Creates a mock NextFunction
 */
interface MockNext {
  _called: boolean;
  _error: Error | null;
}

export function createMockNext(): NextFunction & MockNext {
  const fn = vi.fn((error?: Error) => {
    fn._called = true;
    fn._error = error ?? null;
  }) as unknown as NextFunction & MockNext;
  fn._called = false;
  fn._error = null;
  return fn;
}

/**
 * Helper to assert a controller handler calls next with an error
 */
export function expectNextWithError(next: NextFunction & { _called: boolean; _error: Error | null }) {
  expect(next._called).toBe(true);
  expect(next._error).toBeDefined();
}

/**
 * Helper to assert a controller handler returns successfully
 */
export function expectNextNotCalled(next: NextFunction & { _called: boolean }) {
  expect(next._called).toBe(false);
}
