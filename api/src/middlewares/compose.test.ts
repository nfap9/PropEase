/**
 * Compose Middleware 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { withMiddleware, authenticated, adminOnly } from './compose.js';

// Mock 中间件
vi.mock('./requireAuth.js', () => ({
  requireConsoleAuth: vi.fn(),
}));

vi.mock('./requireAdmin.js', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('./requireSystemInitialized.js', () => ({
  requireSystemInitialized: vi.fn(),
}));

import { requireConsoleAuth } from './requireAuth.js';
import { requireAdmin } from './requireAdmin.js';
import { requireSystemInitialized } from './requireSystemInitialized.js';

describe('withMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.resetAllMocks();
    mockReq = {};
    mockRes = {
      writableEnded: false,
    };
    mockNext = vi.fn() as unknown as NextFunction;
  });

  describe('基础功能', () => {
    it('应该在没有中间件时直接调用 handler', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const wrappedHandler = withMiddleware()(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('应该按顺序执行所有中间件', async () => {
      const executionOrder: number[] = [];

      const mw1 = vi.fn((_req, _res, next) => {
        executionOrder.push(1);
        next();
      });

      const mw2 = vi.fn((_req, _res, next) => {
        executionOrder.push(2);
        next();
      });

      const handler = vi.fn(() => {
        executionOrder.push(3);
      });

      const wrappedHandler = withMiddleware(
        mw1 as unknown as typeof requireConsoleAuth,
        mw2 as unknown as typeof requireConsoleAuth
      )(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('应该在中间件调用 next(err) 时传递错误', async () => {
      const testError = new Error('test error');
      const mw = vi.fn((_req, _res, next) => {
        next(testError);
      });

      const handler = vi.fn();

      const wrappedHandler = withMiddleware(
        mw as unknown as typeof requireConsoleAuth
      )(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('异步中间件支持', () => {
    it('应该正确处理异步中间件', async () => {
      const executionOrder: number[] = [];

      const asyncMw = vi.fn(async (_req, _res, next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionOrder.push(1);
        next();
      });

      const handler = vi.fn(() => {
        executionOrder.push(2);
      });

      const wrappedHandler = withMiddleware(
        asyncMw as unknown as typeof requireConsoleAuth
      )(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(executionOrder).toEqual([1, 2]);
    });

    it('应该正确处理异步中间件抛出的错误', async () => {
      const testError = new Error('async error');
      const asyncMw = vi.fn(async () => {
        throw testError;
      });

      const handler = vi.fn();

      const wrappedHandler = withMiddleware(
        asyncMw as unknown as typeof requireConsoleAuth
      )(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
    });
  });

  describe('响应已发送情况', () => {
    it('应该在响应已发送时停止执行后续中间件和 handler', async () => {
      const executionOrder: number[] = [];

      const mw1 = vi.fn((_req, _res, next) => {
        executionOrder.push(1);
        next();
      });

      const mw2 = vi.fn((_req, res, next) => {
        executionOrder.push(2);
        // 模拟响应已发送
        (res as { writableEnded: boolean }).writableEnded = true;
        next();
      });

      const handler = vi.fn(() => {
        executionOrder.push(3);
      });

      const wrappedHandler = withMiddleware(
        mw1 as unknown as typeof requireConsoleAuth,
        mw2 as unknown as typeof requireConsoleAuth
      )(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(executionOrder).toEqual([1, 2]);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('handler 错误处理', () => {
    it('应该捕获 handler 抛出的错误并传递给 next', async () => {
      const handlerError = new Error('handler error');
      const handler = vi.fn(() => {
        throw handlerError;
      });

      const wrappedHandler = withMiddleware()(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(handlerError);
    });

    it('应该捕获异步 handler 的错误', async () => {
      const handlerError = new Error('async handler error');
      const handler = vi.fn(async () => {
        throw handlerError;
      });

      const wrappedHandler = withMiddleware()(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(handlerError);
    });
  });
});

describe('预定义的组合中间件', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.resetAllMocks();
    mockReq = {};
    mockRes = {
      writableEnded: false,
    };
    mockNext = vi.fn() as unknown as NextFunction;
  });

  describe('authenticated', () => {
    it('应该调用 requireConsoleAuth 中间件', async () => {
      vi.mocked(requireConsoleAuth).mockImplementation((_req, _res, next) => {
        next();
      });

      const handler = vi.fn();
      const wrappedHandler = authenticated(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(requireConsoleAuth).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('应该在认证失败时不调用 handler', async () => {
      const authError = new Error('unauthorized');
      vi.mocked(requireConsoleAuth).mockImplementation((_req, _res, next) => {
        next(authError);
      });

      const handler = vi.fn();
      const wrappedHandler = authenticated(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('adminOnly', () => {
    it('应该调用 requireAdmin 中间件', async () => {
      vi.mocked(requireAdmin).mockImplementation((_req, _res, next) => {
        next();
      });

      const handler = vi.fn();
      const wrappedHandler = adminOnly(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(requireAdmin).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('应该在认证失败时不调用 handler', async () => {
      const authError = new Error('admin required');
      vi.mocked(requireAdmin).mockImplementation((_req, _res, next) => {
        next(authError);
      });

      const handler = vi.fn();
      const wrappedHandler = adminOnly(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('组合中间件', () => {
    it('adminWithInit 应该按正确顺序调用中间件', async () => {
      const { adminWithInit } = await import('./compose.js');

      const executionOrder: string[] = [];

      vi.mocked(requireSystemInitialized).mockImplementation((_req, _res, next) => {
        executionOrder.push('init');
        next();
      });

      vi.mocked(requireAdmin).mockImplementation((_req, _res, next) => {
        executionOrder.push('admin');
        next();
      });

      const handler = vi.fn(() => {
        executionOrder.push('handler');
      });

      const wrappedHandler = adminWithInit(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(executionOrder).toEqual(['init', 'admin', 'handler']);
    });

    it('authenticatedWithInit 应该按正确顺序调用中间件', async () => {
      const { authenticatedWithInit } = await import('./compose.js');

      const executionOrder: string[] = [];

      vi.mocked(requireSystemInitialized).mockImplementation((_req, _res, next) => {
        executionOrder.push('init');
        next();
      });

      vi.mocked(requireConsoleAuth).mockImplementation((_req, _res, next) => {
        executionOrder.push('auth');
        next();
      });

      const handler = vi.fn(() => {
        executionOrder.push('handler');
      });

      const wrappedHandler = authenticatedWithInit(handler as RequestHandler);

      await wrappedHandler(mockReq as Request, mockRes, mockNext);

      expect(executionOrder).toEqual(['init', 'auth', 'handler']);
    });
  });
});
