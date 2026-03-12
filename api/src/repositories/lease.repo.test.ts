/**
 * Lease Repository 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLeaseRepository } from './lease.repo.js';

describe('LeaseRepository', () => {
  let mockDb: any;
  let repository: ReturnType<typeof createLeaseRepository>;

  const orgId = '01HQTESTORG000000001';
  const leaseId = '01HQTESTLEASE0001';
  const roomId = '01HQTESTROOM00001';
  const tenantId = '01HQTESTTENANT0001';

  const mockLease = {
    id: leaseId,
    room_id: roomId,
    tenant_id: tenantId,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2025-01-01'),
    billing_day: 1,
    monthly_rent: 2000,
    deposit: 4000,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockDb = {
      lease: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      room: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };
    repository = createLeaseRepository(mockDb);
  });

  describe('findByOrgId', () => {
    it('should return leases by org id', async () => {
      mockDb.room.findMany.mockResolvedValue([{ id: roomId }]);
      mockDb.lease.findMany.mockResolvedValue([mockLease]);

      const result = await repository.findByOrgId(orgId);

      expect(result).toHaveLength(1);
    });

    it('should filter by active status', async () => {
      mockDb.room.findMany.mockResolvedValue([{ id: roomId }]);
      mockDb.lease.findMany.mockResolvedValue([mockLease]);

      await repository.findByOrgId(orgId, true);

      expect(mockDb.lease.findMany).toHaveBeenCalled();
    });
  });

  describe('findByIdWithRelations', () => {
    it('should return lease with relations', async () => {
      mockDb.lease.findFirst.mockResolvedValue({
        ...mockLease,
        room: { id: roomId, apartment: { id: 'apt1', organization_id: orgId } },
        tenant: { id: tenantId, name: '张三' },
      });

      const result = await repository.findByIdWithRelations(leaseId);

      expect(result).not.toBeNull();
    });
  });

  describe('create', () => {
    it('should create lease', async () => {
      mockDb.lease.create.mockResolvedValue(mockLease);

      const result = await repository.create({
        room: { connect: { id: roomId } },
        tenant: { connect: { id: tenantId } },
        start_date: new Date('2024-01-01'),
        monthly_rent: 2000,
      });

      expect(result).toEqual(mockLease);
    });
  });

  describe('update', () => {
    it('should update lease', async () => {
      mockDb.lease.update.mockResolvedValue({ ...mockLease, monthly_rent: 2500 });

      const result = await repository.update(leaseId, { monthly_rent: 2500 });

      expect(result.monthly_rent).toBe(2500);
    });
  });

  describe('terminate', () => {
    it('should terminate lease', async () => {
      mockDb.lease.update.mockResolvedValue({ ...mockLease, status: 'terminated' });
      mockDb.lease.count.mockResolvedValue(0);
      mockDb.room.update.mockResolvedValue({});

      await repository.terminate(leaseId, roomId);

      expect(mockDb.lease.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete lease', async () => {
      mockDb.lease.delete.mockResolvedValue(undefined);

      await repository.delete(leaseId);

      expect(mockDb.lease.delete).toHaveBeenCalledWith({ where: { id: leaseId } });
    });
  });
});
