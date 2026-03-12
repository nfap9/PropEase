import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createApartmentService,
  type ApartmentService,
  type CreateApartmentInput,
  type UpdateApartmentInput,
} from './apartment.service.js';
import type {
  ApartmentRepository,
  ApartmentWithRooms,
  ApartmentWithStats,
} from '../repositories/apartment.repo.js';
import type { Apartment, Room } from '@prisma/client';

// Mock ulid
vi.mock('ulid', () => ({
  ulid: vi.fn(() => '01HQTESTAPT000001'),
}));

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    apartment: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma.js';

describe('ApartmentService', () => {
  const mockRepo: ApartmentRepository = {
    findByOrgIdWithRooms: vi.fn(),
    findByIdAndOrg: vi.fn(),
    findById: vi.fn(),
    findByOrgId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByOrgId: vi.fn(),
  };

  let service: ApartmentService;

  const orgId = '01hqtestorg000000001';

  const sampleApartment: Apartment = {
    id: '01hqtestapt00000001',
    organization_id: orgId,
    name: '测试公寓',
    address: '测试地址123号',
    description: '这是一个测试公寓',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const sampleRooms: Room[] = [
    {
      id: '01hqtestroom0000001',
      apartment_id: sampleApartment.id,
      room_number: '101',
      status: 'occupied',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '01hqtestroom0000002',
      apartment_id: sampleApartment.id,
      room_number: '102',
      status: 'available',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listByOrg', () => {
    it('should return apartments with room stats', async () => {
      const aptWithRooms = { ...sampleApartment, rooms: sampleRooms };
      vi.mocked(mockRepo.findByOrgIdWithRooms).mockResolvedValue([aptWithRooms as ApartmentWithRooms]);

      service = createApartmentService(() => mockRepo);
      const result = await service.listByOrg(orgId);

      expect(mockRepo.findByOrgIdWithRooms).toHaveBeenCalledWith(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].room_stats).toBeDefined();
      expect(result[0].room_stats.total).toBe(2);
      expect(result[0].room_stats.occupied).toBe(1);
      expect(result[0].room_stats.available).toBe(1);
    });

    it('should return empty array when no apartments', async () => {
      vi.mocked(mockRepo.findByOrgIdWithRooms).mockResolvedValue([]);
      service = createApartmentService(() => mockRepo);

      const result = await service.listByOrg(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return apartment with rooms', async () => {
      const aptWithRooms = { ...sampleApartment, rooms: sampleRooms };
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(sampleApartment);
      vi.mocked(prisma.apartment.findUnique).mockResolvedValue(aptWithRooms);
      service = createApartmentService(() => mockRepo);

      const result = await service.getById(orgId, sampleApartment.id);

      expect(mockRepo.findByIdAndOrg).toHaveBeenCalledWith(sampleApartment.id, orgId);
      expect(result).toEqual(aptWithRooms);
    });

    it('should throw 404 when apartment not found', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(null);
      service = createApartmentService(() => mockRepo);

      await expect(service.getById(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('create', () => {
    it('should create apartment with data', async () => {
      const createInput: CreateApartmentInput = {
        name: '新公寓',
        address: '新地址',
        description: '新描述',
      };
      vi.mocked(mockRepo.create).mockResolvedValue(sampleApartment);
      service = createApartmentService(() => mockRepo);

      const result = await service.create(orgId, createInput);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '新公寓',
          address: '新地址',
          description: '新描述',
        })
      );
      expect(result).toEqual(sampleApartment);
    });
  });

  describe('update', () => {
    it('should update apartment', async () => {
      const updateInput: UpdateApartmentInput = {
        name: '更新后的名称',
      };
      const updatedApartment = { ...sampleApartment, name: '更新后的名称' };
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(sampleApartment);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedApartment);
      service = createApartmentService(() => mockRepo);

      const result = await service.update(orgId, sampleApartment.id, updateInput);

      expect(mockRepo.findByIdAndOrg).toHaveBeenCalledWith(sampleApartment.id, orgId);
      expect(mockRepo.update).toHaveBeenCalledWith(
        sampleApartment.id,
        expect.objectContaining({ name: '更新后的名称' })
      );
      expect(result.name).toBe('更新后的名称');
    });

    it('should throw 404 when apartment not found', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(null);
      service = createApartmentService(() => mockRepo);

      await expect(
        service.update(orgId, 'non-existent', { name: '更新' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('delete', () => {
    it('should delete apartment', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(sampleApartment);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);
      service = createApartmentService(() => mockRepo);

      await service.delete(orgId, sampleApartment.id);

      expect(mockRepo.findByIdAndOrg).toHaveBeenCalledWith(sampleApartment.id, orgId);
      expect(mockRepo.delete).toHaveBeenCalledWith(sampleApartment.id);
    });

    it('should throw 404 when apartment not found', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(null);
      service = createApartmentService(() => mockRepo);

      await expect(service.delete(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('validateOwnership', () => {
    it('should return apartment when found', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(sampleApartment);
      service = createApartmentService(() => mockRepo);

      const result = await service.validateOwnership(orgId, sampleApartment.id);

      expect(result).toEqual(sampleApartment);
    });

    it('should throw 404 when apartment not found', async () => {
      vi.mocked(mockRepo.findByIdAndOrg).mockResolvedValue(null);
      service = createApartmentService(() => mockRepo);

      await expect(service.validateOwnership(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
