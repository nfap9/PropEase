import { describe, it, expect } from 'vitest';
import { BusinessCode } from '../constants.js';
import { createAppError } from './appError.js';

describe('createAppError', () => {
  it('maps statusCode 400 to BAD_REQUEST', () => {
    const err = createAppError(400, '错误请求');
    expect(err.statusCode).toBe(400);
    expect(err.businessCode).toBe(BusinessCode.BAD_REQUEST);
    expect(err.message).toBe('错误请求');
  });

  it('maps statusCode 401 to UNAUTHORIZED', () => {
    const err = createAppError(401, '未授权');
    expect(err.businessCode).toBe(BusinessCode.UNAUTHORIZED);
  });

  it('maps statusCode 403 to FORBIDDEN', () => {
    const err = createAppError(403, '禁止访问');
    expect(err.businessCode).toBe(BusinessCode.FORBIDDEN);
  });

  it('maps statusCode 404 to NOT_FOUND', () => {
    const err = createAppError(404, '未找到');
    expect(err.businessCode).toBe(BusinessCode.NOT_FOUND);
  });

  it('maps statusCode 409 to CONFLICT', () => {
    const err = createAppError(409, '冲突');
    expect(err.businessCode).toBe(BusinessCode.CONFLICT);
  });

  it('maps statusCode 422 to VALIDATION_ERROR', () => {
    const err = createAppError(422, '参数错误');
    expect(err.businessCode).toBe(BusinessCode.VALIDATION_ERROR);
  });

  it('maps unknown statusCode to INTERNAL_ERROR', () => {
    const err = createAppError(500, '服务器错误');
    expect(err.businessCode).toBe(BusinessCode.INTERNAL_ERROR);
  });

  it('uses options.businessCode when provided', () => {
    const err = createAppError(400, 'msg', { businessCode: 999 });
    expect(err.businessCode).toBe(999);
  });

  it('attaches options.fieldErrors to error', () => {
    const fieldErrors = [{ field: 'name', message: '必填' }];
    const err = createAppError(422, '校验失败', { fieldErrors });
    expect(err.fieldErrors).toEqual(fieldErrors);
  });
});
