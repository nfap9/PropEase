import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLeaseChangeLogService, type CreateChangeLogInput } from './leaseChangeLog.service.js';
import type { LeaseChangeLogRepository } from '../repositories/leaseChangeLog.repo.js';
import type { LeaseChangeLog } from '@prisma/client';

describe('LeaseChangeLogService', () => {
  const mockChangeLog: LeaseChangeLog = {
    id: 'log-1',
    lease_id: 'lease-1',
    change_type: 'rent_change',
    old_value: { rent: 2000 },
    new_value: { rent: 2500 },
    effective_from_year: 2024,
    effective_from_month: 7,
    reason: '续约调价',
    created_by: 'user-1',
    created_at: new Date(),
  };

  const repo: LeaseChangeLogRepository = {
    findByLeaseId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };

  const service = createLeaseChangeLogService(() => repo);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should return change logs for a lease', async () => {
      vi.mocked(repo.findByLeaseId).mockResolvedValue([mockChangeLog]);

      const result = await service.list('lease-1');

      expect(result).toHaveLength(1);
      expect(result[0].change_type).toBe('rent_change');
      expect(repo.findByLeaseId).toHaveBeenCalledWith('lease-1');
    });

    it('should return empty array when no logs exist', async () => {
      vi.mocked(repo.findByLeaseId).mockResolvedValue([]);

      const result = await service.list('lease-1');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a change log with all fields', async () => {
      const input: CreateChangeLogInput = {
        lease_id: 'lease-1',
        change_type: 'room_transfer',
        old_value: { room_id: 'room-1' },
        new_value: { room_id: 'room-2' },
        effective_from_year: 2024,
        effective_from_month: 6,
        reason: '换房',
        created_by: 'user-1',
      };
      vi.mocked(repo.create).mockResolvedValue(mockChangeLog);

      const result = await service.create(input);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lease: { connect: { id: 'lease-1' } },
          change_type: 'room_transfer',
          effective_from_year: 2024,
          effective_from_month: 6,
        })
      );
    });

    it('should create a change log with minimal fields', async () => {
      const input: CreateChangeLogInput = {
        lease_id: 'lease-1',
        change_type: 'termination',
      };
      vi.mocked(repo.create).mockResolvedValue({ ...mockChangeLog, change_type: 'termination' });

      const result = await service.create(input);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lease: { connect: { id: 'lease-1' } },
          change_type: 'termination',
          effective_from_year: null,
          effective_from_month: null,
          reason: null,
          created_by: null,
        })
      );
    });

    it('should handle undefined old_value and new_value', async () => {
      const input: CreateChangeLogInput = {
        lease_id: 'lease-1',
        change_type: 'status_change',
      };
      vi.mocked(repo.create).mockResolvedValue({ ...mockChangeLog, change_type: 'status_change' });

      await service.create(input);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          old_value: undefined,
          new_value: undefined,
        })
      );
    });
  });
});
