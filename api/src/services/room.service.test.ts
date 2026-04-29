/**
 * Room Service 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoomService, type RoomService } from './room.service.js';
import type { RoomRepository } from '../repositories/room.repo.js';
import type { ApartmentRepository } from '../repositories/apartment.repo.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    roomPricing: {
      create: vi.fn().mockResolvedValue({}),
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('RoomService', () => {
  // Mock Room Repository
  const mockRepo: RoomRepository = {
    findById: vi.fn(),
    findByIdWithApartment: vi.fn(),
    findByIdWithLeases: vi.fn(),
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

  let service: RoomService;

  const orgId = '01HQTESTORG000000001';
  const apartmentId = '01HQTESTAPT0000001';
  const roomId = '01HQTESTROOM00001';

  const mockApartment = {
    id: apartmentId,
    organization_id: orgId,
    name: '测试公寓',
    address: '测试地址',
  };

  const mockRoom = {
    id: roomId,
    apartment_id: apartmentId,
    room_number: '101',
    layout: '2室1厅',
    monthly_rent: 2000,
    area: 80,
    status: 'available' as const,
    notes: '测试',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRoomWithApartment = {
    ...mockRoom,
    apartment: mockApartment,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = createRoomService(() => mockRepo, () => mockApartmentRepo);
  });

  describe('getById', () => {
    it('should return room when found and belongs to org', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue(mockRoomWithApartment as any);

      const result = await service.getById(orgId, roomId);

      expect(result).toEqual(mockRoomWithApartment);
    });

    it('should throw 404 when room not found', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue(null);

      await expect(service.getById(orgId, roomId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 404 when room belongs to different org', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue({
        ...mockRoomWithApartment,
        apartment: { ...mockApartment, organization_id: 'different-org' },
      } as any);

      await expect(service.getById(orgId, roomId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('listByApartment', () => {
    it('should return rooms when apartment belongs to org', async () => {
      vi.mocked(mockApartmentRepo.findByIdAndOrg).mockResolvedValue(mockApartment as any);
      vi.mocked(mockRepo.findByApartmentId).mockResolvedValue([mockRoom as any]);

      const result = await service.listByApartment(orgId, apartmentId);

      expect(result).toHaveLength(1);
    });

    it('should sort rooms by room number naturally', async () => {
      vi.mocked(mockApartmentRepo.findByIdAndOrg).mockResolvedValue(mockApartment as any);
      vi.mocked(mockRepo.findByApartmentId).mockResolvedValue([
        { ...mockRoom, id: 'room-10', room_number: '10' } as any,
        { ...mockRoom, id: 'room-2', room_number: '2' } as any,
        { ...mockRoom, id: 'room-1', room_number: '1' } as any,
      ]);

      const result = await service.listByApartment(orgId, apartmentId);

      expect(result.map((room) => room.room_number)).toEqual(['1', '2', '10']);
    });

    it('should throw 404 when apartment not found', async () => {
      vi.mocked(mockApartmentRepo.findByIdAndOrg).mockResolvedValue(null);

      await expect(service.listByApartment(orgId, apartmentId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('create', () => {
    it('should create room when apartment belongs to org', async () => {
      vi.mocked(mockApartmentRepo.findByIdAndOrg).mockResolvedValue(mockApartment as any);
      vi.mocked(mockRepo.create).mockResolvedValue(mockRoom as any);

      const input = {
        apartment_id: apartmentId,
        room_number: '101',
        layout: '2室1厅',
        monthly_rent: 2000,
        area: 80,
      };

      const result = await service.create(orgId, apartmentId, input);

      expect(result).toEqual(mockRoom);
    });

    it('should throw 404 when apartment not found', async () => {
      vi.mocked(mockApartmentRepo.findByIdAndOrg).mockResolvedValue(null);

      const input = {
        apartment_id: apartmentId,
        room_number: '101',
        monthly_rent: 2000,
      };

      await expect(service.create(orgId, apartmentId, input)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('batchCreate', () => {
    it('should batch create rooms', async () => {
      vi.mocked(mockApartmentRepo.findByIdAndOrg).mockResolvedValue(mockApartment as any);
      vi.mocked(mockRepo.createBatch).mockResolvedValue([mockRoom as any, { ...mockRoom, id: 'room2', room_number: '102' } as any]);

      const input = {
        room_numbers: ['101', '102'],
        layout: '2室1厅',
        monthly_rent: 2000,
        area: 80,
      };

      const result = await service.batchCreate(orgId, apartmentId, input);

      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update room when found', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue(mockRoomWithApartment as any);
      vi.mocked(mockRepo.update).mockResolvedValue({ ...mockRoom, room_number: '201' } as any);
      vi.mocked(mockRepo.findByIdWithLeases).mockResolvedValue({ ...mockRoom, room_number: '201', leases: [] } as any);

      const result = await service.update(orgId, roomId, { room_number: '201' });

      expect(result.room_number).toBe('201');
    });

    it('should throw 404 when room not found', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue(null);

      await expect(service.update(orgId, roomId, { room_number: '201' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('delete', () => {
    it('should delete room when found', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue(mockRoomWithApartment as any);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete(orgId, roomId);

      expect(mockRepo.delete).toHaveBeenCalledWith(roomId);
    });

    it('should throw 404 when room not found', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue(null);

      await expect(service.delete(orgId, roomId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('validateOwnership', () => {
    it('should return room when valid', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue(mockRoomWithApartment as any);

      const result = await service.validateOwnership(orgId, roomId);

      expect(result).toEqual(mockRoomWithApartment);
    });

    it('should throw 404 when invalid', async () => {
      vi.mocked(mockRepo.findByIdWithApartment).mockResolvedValue(null);

      await expect(service.validateOwnership(orgId, roomId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
