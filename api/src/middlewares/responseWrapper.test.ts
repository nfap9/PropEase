import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { responseWrapper } from './responseWrapper.js';
import { Messages } from '../messages.js';

describe('responseWrapper', () => {
  function createMockReq(path: string): Request {
    return { path } as Request;
  }

  function createMockRes(statusCode = 200): { res: Response; jsonSpy: ReturnType<typeof vi.fn> } {
    const jsonSpy = vi.fn();
    const res = {
      statusCode,
      locals: {} as Record<string, unknown>,
      json(this: Response, body?: unknown) {
        jsonSpy(body);
        return this as Response;
      },
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

  it('does not wrap when path is skip path (e.g. /health)', () => {
    const req = createMockReq('/health');
    const { res, jsonSpy } = createMockRes(200);
    const next = vi.fn();
    responseWrapper(req, res, next);
    res.json({ status: 'ok' });
    expect(jsonSpy).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('does not wrap when path is under /api/v1/webhooks', () => {
    const req = createMockReq('/api/v1/webhooks/wechat-pay');
    const { res, jsonSpy } = createMockRes(200);
    const next = vi.fn();
    responseWrapper(req, res, next);
    res.json({ result: 'received' });
    expect(jsonSpy).toHaveBeenCalledWith({ result: 'received' });
  });

  it('does not wrap when res.statusCode >= 400', () => {
    const req = createMockReq('/api/v1/foo');
    const { res, jsonSpy } = createMockRes(404);
    const next = vi.fn();
    responseWrapper(req, res, next);
    res.json({ code: 40002, message: '未找到' });
    expect(jsonSpy).toHaveBeenCalledWith({ code: 40002, message: '未找到' });
  });

  it('does not double-wrap when body already has code 0', () => {
    const req = createMockReq('/api/v1/foo');
    const { res, jsonSpy } = createMockRes(200);
    const next = vi.fn();
    responseWrapper(req, res, next);
    const alreadyWrapped = { code: 0, data: { id: 1 }, message: 'ok' };
    res.json(alreadyWrapped);
    expect(jsonSpy).toHaveBeenCalledWith(alreadyWrapped);
  });
});
