/**
 * RequireAuth Middleware 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireConsoleAuth } from './requireAuth.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../utils/jwt.js', () => ({
  decodeToken: vi.fn(),
}));

import { prisma } from '../lib/prisma.js';
import { decodeToken } from '../utils/jwt.js';

describe('requireConsoleAuth', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = {
    id: '01HQTESTUSER0000001',
    phone: '13800138000',
    full_name: '测试用户',
    is_active: true,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockReq = {
      headers: {},
    };
    mockRes = {};
    mockNext = vi.fn() as unknown as NextFunction;
  });

  it('should call next with 401 when no authorization header', async () => {
    await requireConsoleAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when authorization header is not Bearer', async () => {
    mockReq.headers = { authorization: 'Basic token123' };

    await requireConsoleAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when token is invalid', async () => {
    mockReq.headers = { authorization: 'Bearer invalidtoken' };
    vi.mocked(decodeToken).mockReturnValue(null);

    await requireConsoleAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when token type is not access', async () => {
    mockReq.headers = { authorization: 'Bearer token123' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(decodeToken).mockReturnValue({ sub: 'user123', type: 'refresh' } as any);

    await requireConsoleAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when user not found', async () => {
    mockReq.headers = { authorization: 'Bearer token123' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(decodeToken).mockReturnValue({ sub: 'user123', type: 'access' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await requireConsoleAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should call next with 401 when user is inactive', async () => {
    mockReq.headers = { authorization: 'Bearer token123' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(decodeToken).mockReturnValue({ sub: 'user123', type: 'access' } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, is_active: false } as any);

    await requireConsoleAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('should set consoleUser and call next when authenticated', async () => {
    mockReq.headers = { authorization: 'Bearer token123' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(decodeToken).mockReturnValue({ sub: mockUser.id, type: 'access' } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await requireConsoleAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.consoleUser).toEqual({
      id: mockUser.id,
      phone: mockUser.phone,
      full_name: mockUser.full_name,
      is_active: mockUser.is_active,
    });
    expect(mockNext).toHaveBeenCalledWith();
  });
});
