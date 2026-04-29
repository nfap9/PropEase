import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import * as ctrl from './admin.controller.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../../test/controllerHelper.js';

// Mock services
vi.mock('../../../services/admin.service.js', () => ({
  defaultAdminService: {
    getMe: vi.fn(),
    listAdmins: vi.fn(),
    createAdminUser: vi.fn(),
    updateAdminUser: vi.fn(),
    deleteAdminUser: vi.fn(),
    resetAdminPassword: vi.fn(),
    listAdminRoles: vi.fn(),
    createAdminRole: vi.fn(),
    updateAdminRole: vi.fn(),
    deleteAdminRole: vi.fn(),
    listOrganizations: vi.fn(),
    getOrganization: vi.fn(),
    setOrganizationActive: vi.fn(),
    listRegisteredUsers: vi.fn(),
    getRegisteredUser: vi.fn(),
    setRegisteredUserActive: vi.fn(),
    deleteRegisteredUser: vi.fn(),
    countRegisteredUsers: vi.fn(),
    listServices: vi.fn(),
    getService: vi.fn(),
    listSubscriptions: vi.fn(),
    getSubscription: vi.fn(),
    renewSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    giftSubscription: vi.fn(),
    getStats: vi.fn(),
    getAdminIncome: vi.fn(),
  },
}));

vi.mock('../../../utils/context.js', () => ({
  getAdminUser: vi.fn(),
}));

vi.mock('../../../utils/audit.js', () => ({
  auditAdminAction: vi.fn(),
}));

import { defaultAdminService } from '../../../services/admin.service.js';
import { getAdminUser } from '../../../utils/context.js';

describe('AdminController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getMe', () => {
    it('should return admin user', async () => {
      const mockAdmin = { id: 'admin-1', username: 'admin' };
      const mockUser = { id: 'admin-1', username: 'admin', role: { name: 'Admin' } };
      vi.mocked(getAdminUser).mockReturnValue(mockAdmin as any);
      vi.mocked(defaultAdminService.getMe).mockResolvedValue(mockUser as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getMe(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(getAdminUser).mockReturnValue(null);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getMe(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(401);
    });
  });

  describe('listUsers', () => {
    it('should return list of admins', async () => {
      const mockList = [{ id: 'admin-1', username: 'admin' }];
      vi.mocked(defaultAdminService.listAdmins).mockResolvedValue(mockList as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listUsers(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockList);
    });

    it('should pass pagination params', async () => {
      vi.mocked(defaultAdminService.listAdmins).mockResolvedValue([]);

      const req = createMockRequest({ query: { skip: '10', limit: '20' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listUsers(req, res, next);

      expect(defaultAdminService.listAdmins).toHaveBeenCalledWith(10, 20);
    });
  });

  describe('createUser', () => {
    it('should create admin user successfully', async () => {
      const mockUser = { id: 'admin-new', username: 'newadmin' };
      vi.mocked(defaultAdminService.createAdminUser).mockResolvedValue(mockUser as any);

      const req = createMockRequest({
        body: { username: 'newadmin', password: 'pass123', name: 'New Admin', role_id: 'role-1' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.createUser(req, res, next);

      expect(res._status).toHaveBeenCalledWith(201);
      expect(res._json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 422 when validation fails', async () => {
      const req = createMockRequest({ body: { password: 'pass123' } }); // missing username
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.createUser(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });

  describe('updateUser', () => {
    it('should update admin user', async () => {
      const mockUser = { id: 'admin-1', name: 'Updated Name' };
      vi.mocked(defaultAdminService.updateAdminUser).mockResolvedValue(mockUser as any);

      const req = createMockRequest({
        params: { id: 'admin-1' },
        body: { name: 'Updated Name' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.updateUser(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete admin user', async () => {
      vi.mocked(defaultAdminService.deleteAdminUser).mockResolvedValue(undefined);

      const req = createMockRequest({ params: { id: 'admin-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.deleteUser(req, res, next);

      expect(res._status).toHaveBeenCalledWith(204);
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      vi.mocked(defaultAdminService.resetAdminPassword).mockResolvedValue(undefined);

      const req = createMockRequest({
        params: { id: 'admin-1' },
        body: { password: 'oldpass', new_password: 'newpass123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.resetPassword(req, res, next);

      expect(res._json).toHaveBeenCalled();
    });

    it('should return 422 when validation fails', async () => {
      const req = createMockRequest({
        params: { id: 'admin-1' },
        body: {}, // missing passwords
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.resetPassword(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });

  describe('listOrganizations', () => {
    it('should return list of organizations', async () => {
      const mockOrgs = [{ id: 'org-1', name: 'Org 1' }];
      vi.mocked(defaultAdminService.listOrganizations).mockResolvedValue(mockOrgs as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listOrganizations(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockOrgs);
    });
  });

  describe('getOrganization', () => {
    it('should return organization', async () => {
      const mockOrg = { id: 'org-1', name: 'Org 1' };
      vi.mocked(defaultAdminService.getOrganization).mockResolvedValue(mockOrg as any);

      const req = createMockRequest({ params: { orgId: 'org-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getOrganization(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockOrg);
    });
  });

  describe('setOrganizationActive', () => {
    it('should set organization active status', async () => {
      const mockOrg = { id: 'org-1', is_active: true };
      vi.mocked(defaultAdminService.setOrganizationActive).mockResolvedValue(mockOrg as any);

      const req = createMockRequest({
        params: { orgId: 'org-1' },
        body: { is_active: true },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.setOrganizationActive(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockOrg);
    });
  });

  describe('listRegisteredUsers', () => {
    it('should return list of registered users', async () => {
      const mockUsers = [{ id: 'user-1', phone: '13800000000' }];
      vi.mocked(defaultAdminService.listRegisteredUsers).mockResolvedValue(mockUsers as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listRegisteredUsers(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockUsers);
    });
  });

  describe('getStats', () => {
    it('should return platform stats', async () => {
      const mockStats = { total_orgs: 100, total_users: 500 };
      vi.mocked(defaultAdminService.getStats).mockResolvedValue(mockStats as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getStats(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockStats);
    });
  });

  describe('getAdminIncome', () => {
    it('should return admin income stats', async () => {
      const mockIncome = [{ period: '2024-01', total_amount: 10000 }];
      vi.mocked(defaultAdminService.getAdminIncome).mockResolvedValue(mockIncome as any);

      const req = createMockRequest({ query: { year: '2024' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getAdminIncome(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockIncome);
    });
  });

  describe('giftSubscription', () => {
    it('should create subscription gift', async () => {
      const mockResult = { organization_id: 'org-1', months: 12 };
      vi.mocked(defaultAdminService.giftSubscription).mockResolvedValue(mockResult as any);

      const req = createMockRequest({
        body: { organization_id: 'org-1', service_id: 'svc-1', billing_months: 12 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.giftSubscription(req, res, next);

      expect(res._status).toHaveBeenCalledWith(201);
      expect(res._json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 422 when validation fails', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.giftSubscription(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });
});
