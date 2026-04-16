import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import * as ctrl from './organizations.controller.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../test/controllerHelper.js';

// Mock the services
vi.mock('../../services/organization.service.js', () => ({
  defaultOrgService: {
    listByUser: vi.fn(),
    getById: vi.fn(),
    getPersonalOrg: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../utils/orgContext.js', () => ({
  requireOrgMembership: vi.fn(),
}));

vi.mock('../../utils/context.js', () => ({
  getConsoleUser: vi.fn(),
}));

vi.mock('../../utils/orgPlanLimits.js', () => ({
  userOrganizationCount: vi.fn(),
  getMaxOrganizationsForUser: vi.fn(),
}));

import { defaultOrgService } from '../../services/organization.service.js';
import { getConsoleUser } from '../../utils/context.js';
import { userOrganizationCount, getMaxOrganizationsForUser } from '../../utils/orgPlanLimits.js';

describe('OrganizationsController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should return organizations for user', async () => {
      const mockUser = { id: 'user-1' };
      const mockOrgs = [
        { id: 'org-1', name: 'Org 1', is_personal: false, slug: 'org-1', settings: {}, is_active: true, created_at: new Date(), updated_at: new Date(), notes: null },
        { id: 'org-personal', name: 'Personal', is_personal: true, slug: 'personal', settings: {}, is_active: true, created_at: new Date(), updated_at: new Date(), notes: null },
      ];
      vi.mocked(getConsoleUser).mockReturnValue(mockUser as any);
      vi.mocked(defaultOrgService.listByUser).mockResolvedValue(mockOrgs as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.list(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockOrgs);
    });

    it('should return 401 when user not authenticated', async () => {
      vi.mocked(getConsoleUser).mockReturnValue(null);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.list(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(401);
    });
  });

  describe('create', () => {
    it('should create organization successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockOrg = { id: 'org-new', name: 'New Org', slug: 'new-org', settings: {}, is_personal: false, is_active: true, created_at: new Date(), updated_at: new Date(), notes: null };
      vi.mocked(getConsoleUser).mockReturnValue(mockUser as any);
      vi.mocked(userOrganizationCount).mockResolvedValue(0);
      vi.mocked(getMaxOrganizationsForUser).mockResolvedValue(5);
      vi.mocked(defaultOrgService.create).mockResolvedValue(mockOrg as any);

      const req = createMockRequest({ body: { name: 'New Org', slug: 'new-org' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(res._status).toHaveBeenCalledWith(201);
      expect(res._json).toHaveBeenCalled();
    });

    it('should return 401 when user not authenticated', async () => {
      vi.mocked(getConsoleUser).mockReturnValue(null);

      const req = createMockRequest({ body: { name: 'New Org' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(401);
    });

    it('should return 403 when max orgs reached', async () => {
      const mockUser = { id: 'user-1' };
      vi.mocked(getConsoleUser).mockReturnValue(mockUser as any);
      vi.mocked(userOrganizationCount).mockResolvedValue(5);
      vi.mocked(getMaxOrganizationsForUser).mockResolvedValue(5);

      const req = createMockRequest({ body: { name: 'New Org' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(403);
    });

    it('should return 400 when validation fails', async () => {
      const mockUser = { id: 'user-1' };
      vi.mocked(getConsoleUser).mockReturnValue(mockUser as any);
      vi.mocked(userOrganizationCount).mockResolvedValue(0);
      vi.mocked(getMaxOrganizationsForUser).mockResolvedValue(5);
      // Ensure create doesn't get called
      vi.mocked(defaultOrgService.create).mockRejectedValue(new Error('Should not be called'));

      // Pass invalid type for name (number instead of string)
      const req = createMockRequest({ body: { name: 123 } as any });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(400);
    });
  });

  describe('getPersonal', () => {
    it('should return personal organization', async () => {
      const mockUser = { id: 'user-1' };
      const mockOrg = { id: 'org-personal', name: 'Personal', is_personal: true, slug: 'personal', settings: {}, is_active: true, created_at: new Date(), updated_at: new Date(), notes: null };
      vi.mocked(getConsoleUser).mockReturnValue(mockUser as any);
      vi.mocked(defaultOrgService.getPersonalOrg).mockResolvedValue(mockOrg as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getPersonal(req, res, next);

      expect(res._json).toHaveBeenCalled();
    });

    it('should return 401 when user not authenticated', async () => {
      vi.mocked(getConsoleUser).mockReturnValue(null);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getPersonal(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(401);
    });
  });

  describe('get', () => {
    it('should return organization by id', async () => {
      const mockUser = { id: 'user-1' };
      const mockOrg = { id: 'org-1', name: 'Test Org', slug: 'test-org', settings: {}, is_personal: false, is_active: true, created_at: new Date(), updated_at: new Date(), notes: null };
      vi.mocked(getConsoleUser).mockReturnValue(mockUser as any);
      vi.mocked(defaultOrgService.getById).mockResolvedValue(mockOrg as any);

      const req = createMockRequest({ params: { orgId: 'org-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.get(req, res, next);

      expect(res._json).toHaveBeenCalled();
    });
  });
});
