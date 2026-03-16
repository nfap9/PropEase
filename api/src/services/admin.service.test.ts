import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAdminService,
  type AdminService,
  type CreateAdminUserInput,
  type CreateAdminRoleInput,
} from './admin.service.js';
import type { AdminRepository, AdminUserWithRole } from '../repositories/admin.repo.js';
import type { AdminUser, AdminRole, User, Organization } from '@prisma/client';

// Mock dependencies
vi.mock('ulid', () => ({
  ulid: vi.fn(() => '01HQTESTID00000001'),
}));

vi.mock('../utils/security.js', () => ({
  hashPassword: vi.fn(() => Promise.resolve('hashed_password_123')),
  verifyPassword: vi.fn(),
}));

vi.mock('../utils/jwt.js', () => ({
  createAdminAccessToken: vi.fn(() => 'admin_token_123'),
}));

import { hashPassword, verifyPassword } from '../utils/security.js';

describe('AdminService', () => {
  const mockRepo: AdminRepository = {
    findAdminByUsername: vi.fn(),
    findAdminById: vi.fn(),
    listAdmins: vi.fn(),
    findAdminByUsernameOnly: vi.fn(),
    createAdmin: vi.fn(),
    updateAdmin: vi.fn(),
    deleteAdmin: vi.fn(),
    findAdminRoleById: vi.fn(),
    listAdminRoles: vi.fn(),
    createAdminRole: vi.fn(),
    updateAdminRole: vi.fn(),
    deleteAdminRole: vi.fn(),
    findAdminRoleWithUsers: vi.fn(),
    listOrganizations: vi.fn(),
    findOrganizationById: vi.fn(),
    updateOrganizationActive: vi.fn(),
    countUsers: vi.fn(),
    listUsers: vi.fn(),
    findUserWithOrgs: vi.fn(),
    findUserById: vi.fn(),
    updateUserActive: vi.fn(),
    deleteUser: vi.fn(),
    listSubscriptions: vi.fn(),
    findSubscriptionById: vi.fn(),
    renewSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    countOrganizations: vi.fn(),
    countUsersTotal: vi.fn(),
    countApartments: vi.fn(),
    countRooms: vi.fn(),
    countActiveSubscriptions: vi.fn(),
    listUsageOrders: vi.fn(),
    getPlatformConfig: vi.fn(),
    upsertPlatformConfig: vi.fn(),
    updateUsagePricingConfig: vi.fn(),
  };

  let service: AdminService;

  const sampleRole: AdminRole = {
    id: '01hqtestrole000001',
    name: '管理员',
    code: 'admin',
    permissions: [],
    is_system: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const sampleAdmin: AdminUserWithRole = {
    id: '01hqtestadmin000001',
    username: 'admin',
    password_hash: 'hashed_password',
    role_id: sampleRole.id,
    is_active: true,
    is_system: false,
    created_at: new Date(),
    updated_at: new Date(),
    role: sampleRole,
  };

  const sampleUser: User = {
    id: '01hqtestuser0000001',
    phone: '13800138000',
    full_name: '测试用户',
    password_hash: 'hashed_password',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const sampleOrg: Organization = {
    id: '01hqtestorg000000001',
    name: '测试组织',
    slug: 'test-org',
    is_personal: false,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = createAdminService(() => mockRepo);
  });

  describe('login', () => {
    it('should throw error when admin not found', async () => {
      vi.mocked(mockRepo.findAdminByUsername).mockResolvedValue(null);

      await expect(service.login('nonexistent', 'password')).rejects.toMatchObject({
        statusCode: 401,
        message: '用户名或密码错误',
      });
    });

    it('should throw error when admin is inactive', async () => {
      vi.mocked(mockRepo.findAdminByUsername).mockResolvedValue({ ...sampleAdmin, is_active: false });

      await expect(service.login('admin', 'password')).rejects.toMatchObject({
        statusCode: 401,
        message: '账号已停用',
      });
    });

    it('should throw error when password is wrong', async () => {
      vi.mocked(mockRepo.findAdminByUsername).mockResolvedValue(sampleAdmin);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      await expect(service.login('admin', 'wrongpassword')).rejects.toMatchObject({
        statusCode: 401,
        message: '用户名或密码错误',
      });
    });

    it('should return token on successful login', async () => {
      vi.mocked(mockRepo.findAdminByUsername).mockResolvedValue(sampleAdmin);
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const result = await service.login('admin', 'password');

      expect(result).toEqual({
        access_token: 'admin_token_123',
        token_type: 'bearer',
      });
    });
  });

  describe('createAdminUser', () => {
    const input: CreateAdminUserInput = {
      username: 'newadmin',
      password: 'password123',
      name: '新管理员',
      role_id: sampleRole.id,
    };

    it('should throw error when role not found', async () => {
      vi.mocked(mockRepo.findAdminRoleById).mockResolvedValue(null);

      await expect(service.createAdminUser(input)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw error when username exists', async () => {
      vi.mocked(mockRepo.findAdminRoleById).mockResolvedValue(sampleRole);
      vi.mocked(mockRepo.findAdminByUsernameOnly).mockResolvedValue(sampleAdmin);

      await expect(service.createAdminUser(input)).rejects.toMatchObject({
        statusCode: 409,
        message: '用户名已存在',
      });
    });

    it('should create admin user successfully', async () => {
      vi.mocked(mockRepo.findAdminRoleById).mockResolvedValue(sampleRole);
      vi.mocked(mockRepo.findAdminByUsernameOnly).mockResolvedValue(null);
      vi.mocked(mockRepo.createAdmin).mockResolvedValue(sampleAdmin as AdminUser);

      const result = await service.createAdminUser(input);

      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(mockRepo.createAdmin).toHaveBeenCalled();
      expect(result).toEqual(sampleAdmin);
    });
  });

  describe('deleteAdminUser', () => {
    it('should throw error when admin not found', async () => {
      vi.mocked(mockRepo.findAdminById).mockResolvedValue(null);

      await expect(service.deleteAdminUser('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw error when admin is system admin', async () => {
      vi.mocked(mockRepo.findAdminById).mockResolvedValue({ ...sampleAdmin, is_system: true });

      await expect(service.deleteAdminUser(sampleAdmin.id)).rejects.toMatchObject({
        statusCode: 400,
        message: '系统管理员不可删除',
      });
    });

    it('should delete admin successfully', async () => {
      vi.mocked(mockRepo.findAdminById).mockResolvedValue(sampleAdmin);
      vi.mocked(mockRepo.deleteAdmin).mockResolvedValue(undefined);

      await service.deleteAdminUser(sampleAdmin.id);

      expect(mockRepo.deleteAdmin).toHaveBeenCalledWith(sampleAdmin.id);
    });
  });

  describe('deleteAdminRole', () => {
    it('should throw error when role not found', async () => {
      vi.mocked(mockRepo.findAdminRoleWithUsers).mockResolvedValue(null);

      await expect(service.deleteAdminRole('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw error when role is system role', async () => {
      vi.mocked(mockRepo.findAdminRoleWithUsers).mockResolvedValue({
        ...sampleRole,
        is_system: true,
        users: [],
      });

      await expect(service.deleteAdminRole(sampleRole.id)).rejects.toMatchObject({
        statusCode: 400,
        message: '系统角色不可删除',
      });
    });

    it('should throw error when role has users', async () => {
      vi.mocked(mockRepo.findAdminRoleWithUsers).mockResolvedValue({
        ...sampleRole,
        is_system: false,
        users: [sampleAdmin as AdminUser],
      });

      await expect(service.deleteAdminRole(sampleRole.id)).rejects.toMatchObject({
        statusCode: 400,
        message: '该角色下仍有用户，无法删除',
      });
    });

    it('should delete role successfully', async () => {
      vi.mocked(mockRepo.findAdminRoleWithUsers).mockResolvedValue({
        ...sampleRole,
        is_system: false,
        users: [],
      });
      vi.mocked(mockRepo.deleteAdminRole).mockResolvedValue(undefined);

      await service.deleteAdminRole(sampleRole.id);

      expect(mockRepo.deleteAdminRole).toHaveBeenCalledWith(sampleRole.id);
    });
  });

  describe('getStats', () => {
    it('should return all stats', async () => {
      vi.mocked(mockRepo.countOrganizations).mockResolvedValue(10);
      vi.mocked(mockRepo.countUsersTotal).mockResolvedValue(100);
      vi.mocked(mockRepo.countApartments).mockResolvedValue(50);
      vi.mocked(mockRepo.countRooms).mockResolvedValue(200);
      vi.mocked(mockRepo.countActiveSubscriptions).mockResolvedValue(30);

      const result = await service.getStats();

      expect(result).toEqual({
        organizations_count: 10,
        users_count: 100,
        apartments_count: 50,
        rooms_count: 200,
        active_subscriptions_count: 30,
      });
    });
  });

  describe('getUsagePricing', () => {
    it('should return default values when no config', async () => {
      vi.mocked(mockRepo.getPlatformConfig).mockResolvedValue(null);

      const result = await service.getUsagePricing();

      expect(result).toEqual({
        price_per_org: 0,
        price_per_apartment: 0,
        price_per_room: 0,
        price_per_member: 0,
      });
    });

    it('should return pricing from config', async () => {
      vi.mocked(mockRepo.getPlatformConfig).mockResolvedValue({
        id: 'default',
        brand: {},
        usage_pricing: {
          price_per_org: 10,
          price_per_apartment: 5,
          price_per_room: 1,
          price_per_member: 2,
        },
      } as any);

      const result = await service.getUsagePricing();

      expect(result).toEqual({
        price_per_org: 10,
        price_per_apartment: 5,
        price_per_room: 1,
        price_per_member: 2,
      });
    });
  });

  describe('getPlatformConfig', () => {
    it('should return default values when no config', async () => {
      vi.mocked(mockRepo.getPlatformConfig).mockResolvedValue(null);

      const result = await service.getPlatformConfig();

      expect(result.app_name).toBe('公寓管理系统');
      expect(result.app_description).toBe('多租户 SaaS 公寓/物业管理系统');
    });

    it('should return config values', async () => {
      vi.mocked(mockRepo.getPlatformConfig).mockResolvedValue({
        id: 'default',
        brand: {
          app_name: '自定义系统',
          app_description: '自定义描述',
          logo_url: 'https://example.com/logo.png',
          favicon_url: '',
          login_subtitle: '登录',
          register_subtitle: '注册',
        },
        usage_pricing: {},
      } as any);

      const result = await service.getPlatformConfig();

      expect(result.app_name).toBe('自定义系统');
      expect(result.logo_url).toBe('https://example.com/logo.png');
    });
  });

  describe('listOrganizations', () => {
    it('should list organizations with filter', async () => {
      vi.mocked(mockRepo.listOrganizations).mockResolvedValue([sampleOrg]);

      const result = await service.listOrganizations(0, 10, true);

      expect(mockRepo.listOrganizations).toHaveBeenCalledWith(0, 10, { is_active: true });
      expect(result).toEqual([sampleOrg]);
    });
  });

  describe('getRegisteredUser', () => {
    it('should throw error when user not found', async () => {
      vi.mocked(mockRepo.findUserWithOrgs).mockResolvedValue(null);

      await expect(service.getRegisteredUser('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should return user with organizations', async () => {
      vi.mocked(mockRepo.findUserWithOrgs).mockResolvedValue({
        ...sampleUser,
        organization_memberships: [
          { organization: sampleOrg, role: 'owner' },
        ],
      } as any);

      const result = await service.getRegisteredUser(sampleUser.id);

      expect(result.organizations).toHaveLength(1);
      expect(result.organizations[0].role).toBe('owner');
    });
  });
});
