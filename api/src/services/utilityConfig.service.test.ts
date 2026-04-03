import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUtilityConfigService, type UtilityConfigInput } from './utilityConfig.service.js';
import type { UtilityConfigRepository } from '../repositories/utilityConfig.repo.js';
import type { UtilityConfig } from '@prisma/client';

describe('UtilityConfigService', () => {
  const mockConfig: UtilityConfig = {
    id: 'config-1',
    apartment_id: 'apt-1',
    water_price_per_unit: 5.0,
    electricity_price_per_unit: 0.8,
    internet_fee: 100,
    management_fee: 200,
    service_fee: 50,
    notes: '测试备注',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const repo: UtilityConfigRepository = {
    findByApartmentId: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    deleteByApartmentId: vi.fn(),
    findById: vi.fn(),
  };

  const service = createUtilityConfigService(() => repo);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getByApartmentId', () => {
    it('should return config when found', async () => {
      vi.mocked(repo.findByApartmentId).mockResolvedValue(mockConfig);

      const result = await service.getByApartmentId('apt-1');

      expect(result?.id).toBe('config-1');
      expect(result?.water_price_per_unit).toBe(5.0);
    });

    it('should return null when not found', async () => {
      vi.mocked(repo.findByApartmentId).mockResolvedValue(null);

      const result = await service.getByApartmentId('apt-nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should upsert config successfully', async () => {
      const input: UtilityConfigInput = {
        water_price_per_unit: 6.0,
        electricity_price_per_unit: 0.9,
        internet_fee: 120,
      };
      vi.mocked(repo.upsert).mockResolvedValue({ ...mockConfig, ...input });

      const result = await service.upsert('apt-1', input);

      expect(repo.upsert).toHaveBeenCalledWith(
        'apt-1',
        expect.objectContaining({
          apartment: { connect: { id: 'apt-1' } },
          water_price_per_unit: 6.0,
        })
      );
    });
  });

  describe('update', () => {
    it('should update config when it exists', async () => {
      const input: UtilityConfigInput = {
        water_price_per_unit: 7.0,
      };
      vi.mocked(repo.findByApartmentId).mockResolvedValue(mockConfig);
      vi.mocked(repo.update).mockResolvedValue({ ...mockConfig, water_price_per_unit: 7.0 });

      const result = await service.update('apt-1', input);

      expect(result.water_price_per_unit).toBe(7.0);
    });

    it('should throw 404 when config not found', async () => {
      vi.mocked(repo.findByApartmentId).mockResolvedValue(null);

      await expect(service.update('apt-nonexistent', { water_price_per_unit: 7.0 })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete config when it exists', async () => {
      vi.mocked(repo.findByApartmentId).mockResolvedValue(mockConfig);
      vi.mocked(repo.deleteByApartmentId).mockResolvedValue();

      await service.delete('apt-1');

      expect(repo.deleteByApartmentId).toHaveBeenCalledWith('apt-1');
    });

    it('should throw 404 when config not found', async () => {
      vi.mocked(repo.findByApartmentId).mockResolvedValue(null);

      await expect(service.delete('apt-nonexistent')).rejects.toThrow();
    });
  });
});
