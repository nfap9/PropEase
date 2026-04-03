import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('./logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock context
vi.mock('./context.js', () => ({
  getAdminUser: vi.fn(),
}));

import { auditLog, auditAdminAction } from './audit.js';
import { logger } from './logger.js';
import { getAdminUser } from './context.js';

describe('audit', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('auditLog', () => {
    it('should log audit event with all parameters', () => {
      auditLog({
        action: 'admin:user:create',
        adminId: 'admin-1',
        adminUsername: 'admin',
        targetId: 'user-1',
        metadata: { username: 'newuser' },
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'admin:user:create',
          adminId: 'admin-1',
          targetId: 'user-1',
        }),
        'AUDIT'
      );
    });

    it('should log audit event with minimal parameters', () => {
      auditLog({
        action: 'admin:login',
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'admin:login',
        }),
        'AUDIT'
      );
    });

    it('should include metadata in log', () => {
      auditLog({
        action: 'admin:user:update',
        adminId: 'admin-1',
        metadata: { field: 'name', oldValue: 'John', newValue: 'Jane' },
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            field: 'name',
            oldValue: 'John',
            newValue: 'Jane',
          }),
        }),
        'AUDIT'
      );
    });
  });

  describe('auditAdminAction', () => {
    it('should extract admin info from request and log action', () => {
      const mockAdmin = { id: 'admin-1', username: 'admin' };

      const mockRequest = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        adminUser: mockAdmin,
      } as any;

      auditAdminAction(mockRequest, 'admin:user:create', 'user-1', { username: 'newuser' });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'admin:user:create',
          adminId: 'admin-1',
          adminUsername: 'admin',
          targetId: 'user-1',
        }),
        'AUDIT'
      );
    });

    it('should handle request without admin user', () => {
      const mockRequest = {
        ip: '127.0.0.1',
        headers: {},
        adminUser: undefined,
      } as any;

      auditAdminAction(mockRequest, 'admin:login', undefined, undefined);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'audit',
          action: 'admin:login',
        }),
        'AUDIT'
      );
    });
  });
});
