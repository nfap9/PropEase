import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAdmin } from './requireAdmin.js';

// Mock dependencies
vi.mock('../utils/jwt.js', () => ({
  decodeToken: vi.fn(),
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    adminUser: {
      findUnique: vi.fn(),
    },
  },
}));

import { decodeToken } from '../utils/jwt.js';
import { prisma } from '../lib/prisma.js';

describe('requireAdmin', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockAdminUser = {
    id: '01hqtestadmin000001',
    username: 'admin',
    password_hash: 'hashed_password',
    role_id: '01hqtestrole000001',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    role: {
      id: '01hqtestrole000001',
      name: '超级管理员',
      code: 'super_admin',
      is_system: true,
      permissions: {},
      created_at: new Date(),
      updated_at: new Date(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = vi.fn() as unknown as NextFunction;
  });

  it('should call next with 401 when no authorization header', async () => {
    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when authorization header does not start with Bearer', async () => {
    mockReq.headers = { authorization: 'Basic token123' };

    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when token is invalid', async () => {
    mockReq.headers = { authorization: 'Bearer invalid_token' };
    vi.mocked(decodeToken).mockReturnValue(null);

    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when token type is not admin', async () => {
    mockReq.headers = { authorization: 'Bearer token123' };
    vi.mocked(decodeToken).mockReturnValue({ sub: 'user_id', type: 'access' });

    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: '请使用运营后台账号登录',
      })
    );
  });

  it('should call next with 401 when token has no sub', async () => {
    mockReq.headers = { authorization: 'Bearer token123' };
    vi.mocked(decodeToken).mockReturnValue({ type: 'admin' });

    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when admin user not found', async () => {
    mockReq.headers = { authorization: 'Bearer token123' };
    vi.mocked(decodeToken).mockReturnValue({ sub: 'non_existent', type: 'admin' });
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null);

    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'User not found',
      })
    );
  });

  it('should call next with 401 when admin user is inactive', async () => {
    mockReq.headers = { authorization: 'Bearer token123' };
    vi.mocked(decodeToken).mockReturnValue({ sub: mockAdminUser.id, type: 'admin' });
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({
      ...mockAdminUser,
      is_active: false,
    });

    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'User not found',
      })
    );
  });

  it('should set adminUser and call next when authenticated', async () => {
    mockReq.headers = { authorization: 'Bearer valid_token' };
    vi.mocked(decodeToken).mockReturnValue({ sub: mockAdminUser.id, type: 'admin' });
    vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser);

    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.adminUser).toEqual({
      id: mockAdminUser.id,
      username: mockAdminUser.username,
      role_id: mockAdminUser.role_id,
    });
    expect(mockNext).toHaveBeenCalledWith();
  });
});
