import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { BusinessCode } from '@apartment-ultra/api-contract';
import {
  createErrorResponse,
  errorHandler,
  type AppError,
} from './errorHandler.js';

describe('createErrorResponse', () => {
  it('returns body with code and message only when no data', () => {
    const body = createErrorResponse(BusinessCode.BAD_REQUEST, '错误');
    expect(body).toEqual({ code: BusinessCode.BAD_REQUEST, message: '错误' });
  });

  it('includes data when provided', () => {
    const data = { errors: [{ field: 'name', message: '必填' }] };
    const body = createErrorResponse(BusinessCode.VALIDATION_ERROR, '校验失败', data);
    expect(body).toEqual({
      code: BusinessCode.VALIDATION_ERROR,
      message: '校验失败',
      data,
    });
  });
});

describe('errorHandler', () => {
  function createMockRes(): { res: Response; statusSpy: ReturnType<typeof vi.fn>; jsonSpy: ReturnType<typeof vi.fn> } {
    const statusSpy = vi.fn(function (this: Response, code: number) {
      return this;
    });
    const jsonSpy = vi.fn();
    const res = {
      status: statusSpy,
      json: jsonSpy,
    } as unknown as Response;
    return { res, statusSpy, jsonSpy };
  }

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('sends statusCode and createErrorResponse body for 4xx error', () => {
    const { res, statusSpy, jsonSpy } = createMockRes();
    const err = new Error('未找到') as AppError;
    err.statusCode = 404;
    err.businessCode = BusinessCode.NOT_FOUND;

    errorHandler(err, {} as Request, res, vi.fn());

    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalledWith({
      code: BusinessCode.NOT_FOUND,
      message: '未找到',
    });
  });

  it('uses "参数校验失败" and data.errors when err.fieldErrors is set', () => {
    const { res, jsonSpy } = createMockRes();
    const err = new Error('validation') as AppError;
    err.statusCode = 422;
    err.businessCode = BusinessCode.VALIDATION_ERROR;
    err.fieldErrors = [{ field: 'body.name', message: '必填' }];

    errorHandler(err, {} as Request, res, vi.fn());

    expect(jsonSpy).toHaveBeenCalledWith({
      code: BusinessCode.VALIDATION_ERROR,
      message: '参数校验失败',
      data: { errors: [{ field: 'body.name', message: '必填' }] },
    });
  });

  it('sends 500 and INTERNAL_ERROR when statusCode is missing', () => {
    const { res, statusSpy, jsonSpy } = createMockRes();
    const err = new Error('boom') as AppError;

    errorHandler(err, {} as Request, res, vi.fn());

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({
      code: BusinessCode.INTERNAL_ERROR,
      message: 'boom',
    });
  });

  it('logs to console.error for 500', () => {
    const { res } = createMockRes();
    const err = new Error('server error') as AppError;
    err.statusCode = 500;

    errorHandler(err, {} as Request, res, vi.fn());

    expect(consoleErrorSpy).toHaveBeenCalledWith('[errorHandler] 500:', 'server error');
  });
});
