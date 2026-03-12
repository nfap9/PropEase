import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOrganizationRepository,
  type OrganizationRepository,
} from './organization.repo.js';
import type { Organization, OrganizationMember, User } from '@prisma/client';

describe('OrganizationRepository', () => {
  const mockOrganization = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockOrganizationMember = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  };

  const mockDb = {
    organization: mockOrganization,
    organizationMember: mockOrganizationMember,
  } as unknown as Parameters<typeof createOrganizationRepository>[0];
  let repo: OrganizationRepository;

  const sampleOrg: Organization = {
    id: '01hqtestorg000000001',
    name: '测试组织',
    slug: 'test-org',
    is_personal: false,
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
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

  const sampleMember: OrganizationMember = {
    organization_id: sampleOrg.id,
    user_id: sampleUser.id,
    role: 'owner',
    joined_at: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    repo = createOrganizationRepository(mockDb);
  });

  describe('findById', () => {
    it('should return organization by id', async () => {
      mockOrganization.findUnique.mockResolvedValue(sampleOrg);

      const result = await repo.findById('01hqtestorg000000001');

      expect(mockOrganization.findUnique).toHaveBeenCalledWith({
        where: { id: '01hqtestorg000000001' },
      });
      expect(result).toEqual(sampleOrg);
    });

    it('should return null if not found', async () => {
      mockOrganization.findUnique.mockResolvedValue(null);

      const result = await repo.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return organization by slug', async () => {
      mockOrganization.findUnique.mockResolvedValue(sampleOrg);

      const result = await repo.findBySlug('test-org');

      expect(mockOrganization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-org' },
      });
      expect(result).toEqual(sampleOrg);
    });

    it('should return null if slug not found', async () => {
      mockOrganization.findUnique.mockResolvedValue(null);

      const result = await repo.findBySlug('non-existent-slug');

      expect(result).toBeNull();
    });
  });

  describe('findPersonalOrgByUserId', () => {
    it('should return personal org for user', async () => {
      const personalOrg = { ...sampleOrg, is_personal: true };
      mockOrganization.findFirst.mockResolvedValue(personalOrg);

      const result = await repo.findPersonalOrgByUserId(sampleUser.id);

      expect(mockOrganization.findFirst).toHaveBeenCalledWith({
        where: {
          is_personal: true,
          members: { some: { user_id: sampleUser.id } },
        },
      });
      expect(result).toEqual(personalOrg);
    });

    it('should return null if no personal org', async () => {
      mockOrganization.findFirst.mockResolvedValue(null);

      const result = await repo.findPersonalOrgByUserId(sampleUser.id);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return organizations for user', async () => {
      const orgWithMembers = { ...sampleOrg, members: [sampleMember] };
      mockOrganizationMember.findMany.mockResolvedValue([
        { organization: orgWithMembers },
      ]);

      const result = await repo.findByUserId(sampleUser.id);

      expect(mockOrganizationMember.findMany).toHaveBeenCalledWith({
        where: { user_id: sampleUser.id },
        include: { organization: { include: { members: true } } },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array if no organizations', async () => {
      mockOrganizationMember.findMany.mockResolvedValue([]);

      const result = await repo.findByUserId(sampleUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create organization with data', async () => {
      const createInput = {
        id: '01hqtestorg000000001',
        name: '测试组织',
        slug: 'test-org',
        is_personal: false,
      };
      mockOrganization.create.mockResolvedValue(sampleOrg);

      const result = await repo.create(createInput);

      expect(mockOrganization.create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(sampleOrg);
    });
  });

  describe('update', () => {
    it('should update organization', async () => {
      const updateInput = { name: '新组织名' };
      const updatedOrg = { ...sampleOrg, name: '新组织名' };
      mockOrganization.update.mockResolvedValue(updatedOrg);

      const result = await repo.update(sampleOrg.id, updateInput);

      expect(mockOrganization.update).toHaveBeenCalledWith({
        where: { id: sampleOrg.id },
        data: updateInput,
      });
      expect(result.name).toBe('新组织名');
    });
  });

  describe('delete', () => {
    it('should delete organization', async () => {
      mockOrganization.delete.mockResolvedValue(sampleOrg);

      await repo.delete(sampleOrg.id);

      expect(mockOrganization.delete).toHaveBeenCalledWith({
        where: { id: sampleOrg.id },
      });
    });
  });

  describe('findMember', () => {
    it('should return member by orgId and userId', async () => {
      mockOrganizationMember.findFirst.mockResolvedValue(sampleMember);

      const result = await repo.findMember(sampleOrg.id, sampleUser.id);

      expect(mockOrganizationMember.findFirst).toHaveBeenCalledWith({
        where: { organization_id: sampleOrg.id, user_id: sampleUser.id },
      });
      expect(result).toEqual(sampleMember);
    });

    it('should return null if member not found', async () => {
      mockOrganizationMember.findFirst.mockResolvedValue(null);

      const result = await repo.findMember(sampleOrg.id, 'non-existent-user');

      expect(result).toBeNull();
    });
  });

  describe('findMembersByOrgId', () => {
    it('should return members with user info', async () => {
      const memberWithUser = { ...sampleMember, user: sampleUser };
      mockOrganizationMember.findMany.mockResolvedValue([memberWithUser]);

      const result = await repo.findMembersByOrgId(sampleOrg.id);

      expect(mockOrganizationMember.findMany).toHaveBeenCalledWith({
        where: { organization_id: sampleOrg.id },
        include: { user: true },
      });
      expect(result).toHaveLength(1);
      expect(result[0].user).toEqual(sampleUser);
    });

    it('should return empty array if no members', async () => {
      mockOrganizationMember.findMany.mockResolvedValue([]);

      const result = await repo.findMembersByOrgId(sampleOrg.id);

      expect(result).toEqual([]);
    });
  });

  describe('createMember', () => {
    it('should create member with data', async () => {
      const createInput = {
        organization: { connect: { id: sampleOrg.id } },
        user: { connect: { id: sampleUser.id } },
        role: 'member',
      };
      mockOrganizationMember.create.mockResolvedValue({
        ...sampleMember,
        role: 'member',
      });

      const result = await repo.createMember(createInput);

      expect(mockOrganizationMember.create).toHaveBeenCalledWith({ data: createInput });
      expect(result.role).toBe('member');
    });
  });

  describe('updateMember', () => {
    it('should update member and return count', async () => {
      mockOrganizationMember.updateMany.mockResolvedValue({ count: 1 });

      const result = await repo.updateMember(sampleOrg.id, sampleUser.id, {
        role: 'admin',
      });

      expect(mockOrganizationMember.updateMany).toHaveBeenCalledWith({
        where: { organization_id: sampleOrg.id, user_id: sampleUser.id },
        data: { role: 'admin' },
      });
      expect(result).toBe(1);
    });

    it('should return 0 if member not found', async () => {
      mockOrganizationMember.updateMany.mockResolvedValue({ count: 0 });

      const result = await repo.updateMember(sampleOrg.id, 'non-existent', {
        role: 'admin',
      });

      expect(result).toBe(0);
    });
  });

  describe('deleteMember', () => {
    it('should delete member and return count', async () => {
      mockOrganizationMember.deleteMany.mockResolvedValue({ count: 1 });

      const result = await repo.deleteMember(sampleOrg.id, sampleUser.id);

      expect(mockOrganizationMember.deleteMany).toHaveBeenCalledWith({
        where: { organization_id: sampleOrg.id, user_id: sampleUser.id },
      });
      expect(result).toBe(1);
    });

    it('should return 0 if member not found', async () => {
      mockOrganizationMember.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repo.deleteMember(sampleOrg.id, 'non-existent');

      expect(result).toBe(0);
    });
  });
});
