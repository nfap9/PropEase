import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { responseWrapper } from './responseWrapper.js';
import { Messages } from '../messages.js';

describe('responseWrapper', () => {
  function createMockReq(path: string): Request {
    return { path } as Request;
  }

  function createMockRes(statusCode = 200): { res: Response; jsonSpy: ReturnType<typeof vi.fn> } {
    const jsonSpy = vi.fn(function (this: Response, _body?: unknown) {
      return this as Response;
    });
    const res = {
      statusCode,
      locals: {} as Record<string, unknown>,
      json: jsonSpy as unknown as Response['json'],
    } as unknown as Response;
    return { res, jsonSpy };
  }

  it('wraps success body with default message when res.locals.successMessage is not set', () => {
    const req = createMockReq('/api/v1/foo');
    const { res, jsonSpy } = createMockRes(200);
    const next = vi.fn();
    responseWrapper(req, res, next);
    expect(next).toHaveBeenCalled();
    res.json({ id: '1' });
    expect(jsonSpy).toHaveBeenCalledWith({
      code: 0,
      data: { id: '1' },
      message: Messages.SUCCESS,
    });
  });

  it('wraps success body with res.locals.successMessage when set', () => {
    const req = createMockReq('/api/v1/foo');
    const { res, jsonSpy } = createMockRes(200);
    (res.locals as { successMessage?: string }).successMessage = '房间已删除';
    const next = vi.fn();
    responseWrapper(req, res, next);
    res.json({});
    expect(jsonSpy).toHaveBeenCalledWith({
      code: 0,
      data: {},
      message: '房间已删除',
    });
  });
});
