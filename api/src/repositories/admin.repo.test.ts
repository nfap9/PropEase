import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAdminRepository, type AdminRepository } from './admin.repo.js';
import type {
  AdminUser,
  AdminRole,
  User,
  Organization,
  SubscriptionPlan,
} from '@prisma/client';

describe('AdminRepository', () => {
  // Mock all database models
  const mockAdminUser = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockAdminRole = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockOrganization = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  };

  const mockUser = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };

  const mockSubscriptionPlan = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockOrganizationSubscription = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  };

  const mockApartment = { count: vi.fn() };
  const mockRoom = { count: vi.fn() };
  const mockUsageQuotaOrder = { findMany: vi.fn() };
  const mockPlatformConfig = { findUnique: vi.fn(), upsert: vi.fn() };

  const mockDb = {
    adminUser: mockAdminUser,
    adminRole: mockAdminRole,
    organization: mockOrganization,
    user: mockUser,
    subscriptionPlan: mockSubscriptionPlan,
    organizationSubscription: mockOrganizationSubscription,
    apartment: mockApartment,
    room: mockRoom,
    usageQuotaOrder: mockUsageQuotaOrder,
    platformConfig: mockPlatformConfig,
  } as unknown as Parameters<typeof createAdminRepository>[0];
  let repo: AdminRepository;

  const sampleRole: AdminRole = {
    id: '01hqtestrole000001',
    name: '管理员',
    code: 'admin',
    permissions: {},
    is_system: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const sampleAdmin: AdminUser = {
    id: '01hqtestadmin000001',
    username: 'admin',
    password_hash: 'hashed_password',
    role_id: sampleRole.id,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
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
    vi.resetAllMocks();
    repo = createAdminRepository(mockDb);
  });

  describe('Admin Auth', () => {
    describe('findAdminByUsername', () => {
      it('should return admin with role', async () => {
        const adminWithRole = { ...sampleAdmin, role: sampleRole };
        mockAdminUser.findUnique.mockResolvedValue(adminWithRole);

        const result = await repo.findAdminByUsername('admin');

        expect(mockAdminUser.findUnique).toHaveBeenCalledWith({
          where: { username: 'admin' },
          include: { role: true },
        });
        expect(result).toEqual(adminWithRole);
      });

      it('should return null if not found', async () => {
        mockAdminUser.findUnique.mockResolvedValue(null);

        const result = await repo.findAdminByUsername('nonexistent');

        expect(result).toBeNull();
      });
    });
  });

  describe('Admin Users', () => {
    describe('findAdminById', () => {
      it('should return admin with role', async () => {
        const adminWithRole = { ...sampleAdmin, role: sampleRole };
        mockAdminUser.findUnique.mockResolvedValue(adminWithRole);

        const result = await repo.findAdminById(sampleAdmin.id);

        expect(result).toEqual(adminWithRole);
      });
    });

    describe('listAdmins', () => {
      it('should return admins with pagination', async () => {
        mockAdminUser.findMany.mockResolvedValue([sampleAdmin]);

        const result = await repo.listAdmins(0, 10);

        expect(mockAdminUser.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          include: { role: true },
        });
        expect(result).toHaveLength(1);
      });
    });

    describe('createAdmin', () => {
      it('should create admin', async () => {
        const createInput = {
          username: 'newadmin',
          password_hash: 'hashed',
          role: { connect: { id: sampleRole.id } },
        };
        mockAdminUser.create.mockResolvedValue(sampleAdmin);

        const result = await repo.createAdmin(createInput);

        expect(mockAdminUser.create).toHaveBeenCalledWith({ data: createInput });
        expect(result).toEqual(sampleAdmin);
      });
    });

    describe('updateAdmin', () => {
      it('should update admin', async () => {
        const updatedAdmin = { ...sampleAdmin, is_active: false };
        mockAdminUser.update.mockResolvedValue(updatedAdmin);

        const result = await repo.updateAdmin(sampleAdmin.id, { is_active: false });

        expect(result.is_active).toBe(false);
      });
    });

    describe('deleteAdmin', () => {
      it('should delete admin', async () => {
        mockAdminUser.delete.mockResolvedValue(sampleAdmin);

        await repo.deleteAdmin(sampleAdmin.id);

        expect(mockAdminUser.delete).toHaveBeenCalledWith({ where: { id: sampleAdmin.id } });
      });
    });
  });

  describe('Admin Roles', () => {
    describe('listAdminRoles', () => {
      it('should return all roles', async () => {
        mockAdminRole.findMany.mockResolvedValue([sampleRole]);

        const result = await repo.listAdminRoles();

        expect(result).toEqual([sampleRole]);
      });
    });

    describe('findAdminRoleWithUsers', () => {
      it('should return role with users', async () => {
        const roleWithUsers = { ...sampleRole, users: [sampleAdmin] };
        mockAdminRole.findUnique.mockResolvedValue(roleWithUsers);

        const result = await repo.findAdminRoleWithUsers(sampleRole.id);

        expect(mockAdminRole.findUnique).toHaveBeenCalledWith({
          where: { id: sampleRole.id },
          include: { users: true },
        });
        expect(result?.users).toHaveLength(1);
      });
    });
  });

  describe('Organizations', () => {
    describe('listOrganizations', () => {
      it('should return organizations with pagination', async () => {
        mockOrganization.findMany.mockResolvedValue([sampleOrg]);

        const result = await repo.listOrganizations(0, 10, { is_active: true });

        expect(mockOrganization.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          where: { is_active: true },
        });
        expect(result).toEqual([sampleOrg]);
      });
    });

    describe('updateOrganizationActive', () => {
      it('should update organization active status', async () => {
        mockOrganization.update.mockResolvedValue({ ...sampleOrg, is_active: false });

        await repo.updateOrganizationActive(sampleOrg.id, false);

        expect(mockOrganization.update).toHaveBeenCalledWith({
          where: { id: sampleOrg.id },
          data: { is_active: false },
        });
      });
    });
  });

  describe('Registered Users', () => {
    describe('countUsers', () => {
      it('should count users with filter', async () => {
        mockUser.count.mockResolvedValue(5);

        const result = await repo.countUsers({ is_active: true });

        expect(mockUser.count).toHaveBeenCalledWith({ where: { is_active: true } });
        expect(result).toBe(5);
      });
    });

    describe('listUsers', () => {
      it('should return user list items', async () => {
        mockUser.findMany.mockResolvedValue([sampleUser]);

        const result = await repo.listUsers(0, 10);

        expect(mockUser.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          where: undefined,
          select: {
            id: true,
            phone: true,
            full_name: true,
            is_active: true,
            created_at: true,
          },
        });
        expect(result).toHaveLength(1);
      });
    });

    describe('findUserWithOrgs', () => {
      it('should return user with organization memberships', async () => {
        const userWithOrgs = {
          ...sampleUser,
          organization_memberships: [{ organization: sampleOrg, role: 'owner' }],
        };
        mockUser.findUnique.mockResolvedValue(userWithOrgs);

        const result = await repo.findUserWithOrgs(sampleUser.id);

        expect(result?.organization_memberships).toHaveLength(1);
      });
    });
  });

  describe('Plans', () => {
    describe('listPlans', () => {
      it('should return all plans when activeOnly is false', async () => {
        const plan: SubscriptionPlan = {
          id: 'plan1',
          code: 'pro',
          name: '专业版',
          description: '',
          price_monthly: 99,
          price_yearly: 999,
          max_rooms: 100,
          max_members: 5,
          features: {},
          is_active: true,
          sort_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        };
        mockSubscriptionPlan.findMany.mockResolvedValue([plan]);

        const result = await repo.listPlans(false);

        expect(mockSubscriptionPlan.findMany).toHaveBeenCalledWith({
          where: undefined,
          orderBy: { sort_order: 'asc' },
          include: {
            pricing: {
              orderBy: [{ sort_order: 'asc' }, { months: 'asc' }],
            },
          },
        });
        expect(result).toHaveLength(1);
      });

      it('should return only active plans when activeOnly is true', async () => {
        mockSubscriptionPlan.findMany.mockResolvedValue([]);

        await repo.listPlans(true);

        expect(mockSubscriptionPlan.findMany).toHaveBeenCalledWith({
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
          include: {
            pricing: {
              orderBy: [{ sort_order: 'asc' }, { months: 'asc' }],
            },
          },
        });
      });
    });
  });

  describe('Stats', () => {
    it('countOrganizations should return count', async () => {
      mockOrganization.count.mockResolvedValue(10);

      const result = await repo.countOrganizations();

      expect(result).toBe(10);
    });

    it('countUsersTotal should return count', async () => {
      mockUser.count.mockResolvedValue(100);

      const result = await repo.countUsersTotal();

      expect(result).toBe(100);
    });

    it('countApartments should return count', async () => {
      mockApartment.count.mockResolvedValue(50);

      const result = await repo.countApartments();

      expect(result).toBe(50);
    });

    it('countRooms should return count', async () => {
      mockRoom.count.mockResolvedValue(200);

      const result = await repo.countRooms();

      expect(result).toBe(200);
    });
  });

  describe('Platform Config', () => {
    describe('getPlatformConfig', () => {
      it('should return platform config', async () => {
        const config = { id: 'default', brand: {}, usage_pricing: {} };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockPlatformConfig.findUnique.mockResolvedValue(config as any);

        const result = await repo.getPlatformConfig();

        expect(mockPlatformConfig.findUnique).toHaveBeenCalledWith({ where: { id: 'default' } });
        expect(result).toEqual(config);
      });
    });

    describe('upsertPlatformConfig', () => {
      it('should upsert platform config', async () => {
        const brand = { name: 'Test' };
        const config = { id: 'default', brand, usage_pricing: {} };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockPlatformConfig.upsert.mockResolvedValue(config as any);

        await repo.upsertPlatformConfig(brand);

        expect(mockPlatformConfig.upsert).toHaveBeenCalledWith({
          where: { id: 'default' },
          create: { id: 'default', brand },
          update: { brand },
        });
      });
    });
  });
});
