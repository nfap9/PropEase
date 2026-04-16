/**
 * Lease Service 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLeaseService, type LeaseService } from './lease.service.js';
import type { LeaseRepository } from '../repositories/lease.repo.js';
import type { RoomRepository } from '../repositories/room.repo.js';
import type { TenantRepository } from '../repositories/tenant.repo.js';
import type { OrgFeeItemRepository } from '../repositories/orgFeeItem.repo.js';
import type { LeaseFeeItemRepository } from '../repositories/leaseFeeItem.repo.js';
import type { LeaseChangeLogRepository } from '../repositories/leaseChangeLog.repo.js';
import type { ApartmentRepository } from '../repositories/apartment.repo.js';
import type { OrganizationRepository } from '../repositories/organization.repo.js';

// Mock Prisma for notification.create
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
    },
    lease: {
      findFirst: vi.fn(), // 防止 billService.createInitialBill 警告
    },
    bill: {
      findUnique: vi.fn().mockResolvedValue(null), // 防止 sendBillGenerated 警告
    },
  },
}));

describe('LeaseService', () => {
  // Mock Lease Repository
  const mockRepo: LeaseRepository = {
    findById: vi.fn(),
    findByIdWithRelations: vi.fn(),
    create: vi.fn(),
    createWithRoomUpdate: vi.fn(),
    update: vi.fn(),
    terminate: vi.fn(),
    delete: vi.fn(),
    countOtherActive: vi.fn(),
    findByOrgId: vi.fn(),
    findActiveByRoomIds: vi.fn(),
  };

  // Mock Room Repository
  const mockRoomRepo: RoomRepository = {
    findById: vi.fn(),
    findByIdWithApartment: vi.fn(),
    findByApartmentId: vi.fn(),
    findByOrgId: vi.fn(),
    findByOrgIdWithLeases: vi.fn(),
    findByOrgIdWithLeasesAll: vi.fn(),
    create: vi.fn(),
    createBatch: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByOrgId: vi.fn(),
  };

  // Mock Tenant Repository
  const mockTenantRepo: TenantRepository = {
    findById: vi.fn(),
    findByIdAndOrg: vi.fn(),
    findByOrgId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  // Mock OrgFeeItem Repository
  const mockOrgFeeItemRepo: OrgFeeItemRepository = {
    findById: vi.fn(),
    findByIdAndOrg: vi.fn(),
    findByOrgId: vi.fn(),
    findByIds: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };

  // Mock LeaseFeeItem Repository
  const mockLeaseFeeItemRepo: LeaseFeeItemRepository = {
    findById: vi.fn(),
    findByLeaseId: vi.fn(),
    createMany: vi.fn(),
  };

  // Mock LeaseChangeLog Repository
  const mockLeaseChangeLogRepo: LeaseChangeLogRepository = {
    findByLeaseId: vi.fn(),
    create: vi.fn(),
    findPendingChanges: vi.fn(),
  };

  // Mock Apartment Repository
  const mockApartmentRepo: ApartmentRepository = {
    findById: vi.fn(),
    findByIdAndOrg: vi.fn(),
    findByIdAndOrgWithRooms: vi.fn(),
    findByOrgId: vi.fn(),
    findByOrgIdWithRooms: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByOrgId: vi.fn(),
  };

  // Mock Organization Repository
  const mockOrgRepo: OrganizationRepository = {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findPersonalOrgByUserId: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMember: vi.fn(),
    findMembersByOrgId: vi.fn(),
    createMember: vi.fn(),
    updateMember: vi.fn(),
    deleteMember: vi.fn(),
  };

  let service: LeaseService;

  const orgId = '01HQTESTORG000000001';
  const leaseId = '01HQTESTLEASE0001';
  const roomId = '01HQTESTROOM00001';
  const tenantId = '01HQTESTTENANT0001';
  const apartmentId = '01HQTESTAPT0000001';

  const mockRoom = {
    id: roomId,
    apartment_id: apartmentId,
    room_number: '101',
    apartment: {
      id: apartmentId,
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
    service = createLeaseService(
      () => mockRepo,
      () => mockOrgFeeItemRepo,
      () => mockLeaseFeeItemRepo,
      () => mockLeaseChangeLogRepo,
      () => mockRoomRepo,
      () => mockTenantRepo,
      () => mockApartmentRepo,
      () => mockOrgRepo
    );
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

    it('should sort leases with active ones first and by apartment room naturally', async () => {
      const inactiveLease = {
        ...mockLeaseWithRelations,
        id: 'lease-inactive',
        is_active: false,
        room: {
          ...mockRoom,
          room_number: '1',
          apartment: { ...mockRoom.apartment, id: 'apt-z', name: 'Z栋' },
        },
      };
      const activeLease10 = {
        ...mockLeaseWithRelations,
        id: 'lease-active-10',
        is_active: true,
        room: {
          ...mockRoom,
          room_number: '10',
          apartment: { ...mockRoom.apartment, id: 'apt-a', name: 'A栋' },
        },
      };
      const activeLease2 = {
        ...mockLeaseWithRelations,
        id: 'lease-active-2',
        is_active: true,
        room: {
          ...mockRoom,
          room_number: '2',
          apartment: { ...mockRoom.apartment, id: 'apt-a', name: 'A栋' },
        },
      };
      vi.mocked(mockRepo.findByOrgId).mockResolvedValue([
        inactiveLease,
        activeLease10,
        activeLease2,
      ] as any);

      const result = await service.list(orgId);

      expect(result.map((lease) => lease.id)).toEqual([
        'lease-active-2',
        'lease-active-10',
        'lease-inactive',
      ]);
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
      vi.mocked(mockRoomRepo.findByIdWithApartment).mockResolvedValue(mockRoom as any);
      vi.mocked(mockTenantRepo.findByIdAndOrg).mockResolvedValue(mockTenant as any);
      vi.mocked(mockOrgFeeItemRepo.findByIds).mockResolvedValue([]);
      vi.mocked(mockRepo.createWithRoomUpdate).mockResolvedValue(mockLease as any);
      vi.mocked(mockOrgRepo.findMembersByOrgId).mockResolvedValue([]);

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
      vi.mocked(mockRoomRepo.findByIdWithApartment).mockResolvedValue(null);

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
      vi.mocked(mockRoomRepo.findByIdWithApartment).mockResolvedValue(mockRoom as any);
      vi.mocked(mockTenantRepo.findByIdAndOrg).mockResolvedValue(null);

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
      vi.mocked(mockRepo.update).mockResolvedValue({ ...mockLease, billing_day: 15 } as any);

      const result = await service.update(orgId, leaseId, { billing_day: 15 });

      expect(result.billing_day).toBe(15);
    });

    it('should throw 404 when lease not found', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.update(orgId, leaseId, { billing_day: 15 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('terminate', () => {
    it('should terminate lease', async () => {
      vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue(mockLeaseWithRelations as any);
      vi.mocked(mockOrgRepo.findMembersByOrgId).mockResolvedValue([]);
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
