/**
 * Lease Service 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLeaseService, type LeaseService } from './lease.service.js';
import type { LeaseRepository } from '../repositories/lease.repo.js';

describe('LeaseService', () => {
  // Mock Repository
  const mockRepo: LeaseRepository = {
    findByOrgId: vi.fn(),
    findByIdWithRelations: vi.fn(),
    create: vi.fn(),
    createWithRoomUpdate: vi.fn(),
    update: vi.fn(),
    terminate: vi.fn(),
    delete: vi.fn(),
  };

  // Mock Prisma
  vi.mock('../lib/prisma.js', () => ({
    prisma: {
      room: {
        findFirst: vi.fn(),
      },
      tenant: {
        findFirst: vi.fn(),
      },
      organizationMember: {
        findMany: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
    },
  }));

  let service: LeaseService;

  const orgId = '01HQTESTORG000000001';
  const leaseId = '01HQTESTLEASE0001';
  const roomId = '01HQTESTROOM00001';
  const tenantId = '01HQTESTTENANT0001';

  const mockRoom = {
    id: roomId,
    apartment_id: '01HQTESTAPT0000001',
    room_number: '101',
    apartment: {
      id: '01HQTESTAPT0000001',
      organization_id: orgId,
    },
    status: 'available',
  };

  const mockTenant = {
    id: tenantId,
    organization_id: orgId,
    name: '张三',
  };

  const mockLease = {
    id: leaseId,
    room_id: roomId,
    tenant_id: tenantId,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2025-01-01'),
    billing_day: 1,
    monthly_rent: 2000,
    deposit: 4000,
    water_rate: 3,
    electricity_rate: 0.5,
    status: 'active',
    notes: '测试租约',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockLeaseWithRelations = {
    ...mockLease,
    room: mockRoom,
    tenant: mockTenant,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = createLeaseService(() => mockRepo);
  });

  describe('list', () => {
    it('should return leases by org', async () => {
      vi.mocked(mockRepo.findByOrgId).mockResolvedValue([mockLeaseWithRelations] as any);

      const result = await service.list(orgId);

      expect(result).toHaveLength(1);
    });

    it('should filter by active status', async () => {
      vi.mocked(mockRepo.findByOrgId).mockResolvedValue([mockLeaseWithRelations] as any);

      await service.list(orgId, true);

      expect(mockRepo.findByOrgId).toHaveBeenCalledWith(orgId, true);
    });
  });

  describe('getById', () => {
    it('should return lease when found', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(mockLeaseWithRelations as any);

      const result = await service.getById(orgId, leaseId);

      expect(result).toEqual(mockLeaseWithRelations);
    });

    it('should throw 404 when lease not found', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.getById(orgId, leaseId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 404 when lease belongs to different org', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue({
        ...mockLeaseWithRelations,
        room: { ...mockRoom, apartment: { ...mockRoom.apartment, organization_id: 'different-org' } },
      } as any);

      await expect(service.getById(orgId, leaseId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('create', () => {
    it('should create lease when room and tenant belong to org', async () => {
      const { prisma } = await import('../lib/prisma.js');
      vi.mocked(prisma.room.findFirst).mockResolvedValue(mockRoom as any);
      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(mockTenant as any);
      vi.mocked(prisma.organizationMember.findMany).mockResolvedValue([]);
      vi.mocked(mockRepo.createWithRoomUpdate).mockResolvedValue(mockLease as any);

      const input = {
        room_id: roomId,
        tenant_id: tenantId,
        start_date: '2024-01-01',
        end_date: '2025-01-01',
        billing_day: 1,
        monthly_rent: 2000,
        deposit: 4000,
      };

      const result = await service.create(orgId, input);

      expect(result).toEqual(mockLease);
    });

    it('should throw 404 when room not found', async () => {
      const { prisma } = await import('../lib/prisma.js');
      vi.mocked(prisma.room.findFirst).mockResolvedValue(null);

      const input = {
        room_id: roomId,
        tenant_id: tenantId,
        start_date: '2024-01-01',
        monthly_rent: 2000,
      };

      await expect(service.create(orgId, input)).rejects.toMatchObject({
        statusCode: 404,
        message: '房间不存在',
      });
    });

    it('should throw 404 when tenant not found', async () => {
      const { prisma } = await import('../lib/prisma.js');
      vi.mocked(prisma.room.findFirst).mockResolvedValue(mockRoom as any);
      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);

      const input = {
        room_id: roomId,
        tenant_id: tenantId,
        start_date: '2024-01-01',
        monthly_rent: 2000,
      };

      await expect(service.create(orgId, input)).rejects.toMatchObject({
        statusCode: 404,
        message: '租客不存在',
      });
    });
  });

  describe('update', () => {
    it('should update lease', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(mockLeaseWithRelations as any);
      vi.mocked(mockRepo.update).mockResolvedValue({ ...mockLease, monthly_rent: 2500 } as any);

      const result = await service.update(orgId, leaseId, { monthly_rent: 2500 });

      expect(result.monthly_rent).toBe(2500);
    });

    it('should throw 404 when lease not found', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.update(orgId, leaseId, { monthly_rent: 2500 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('terminate', () => {
    it('should terminate lease', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(mockLeaseWithRelations as any);
      const { prisma } = await import('../lib/prisma.js');
      vi.mocked(prisma.organizationMember.findMany).mockResolvedValue([]);
      vi.mocked(mockRepo.terminate).mockResolvedValue(undefined);

      await service.terminate(orgId, leaseId);

      expect(mockRepo.terminate).toHaveBeenCalledWith(leaseId, roomId);
    });

    it('should throw 404 when lease not found', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.terminate(orgId, leaseId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('delete', () => {
    it('should delete lease', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(mockLeaseWithRelations as any);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete(orgId, leaseId);

      expect(mockRepo.delete).toHaveBeenCalledWith(leaseId);
    });

    it('should throw 404 when lease not found', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.delete(orgId, leaseId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
