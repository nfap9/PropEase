/**
 * Room Repository 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoomRepository } from './room.repo.js';

describe('RoomRepository', () => {
  let mockDb: any;
  let repository: ReturnType<typeof createRoomRepository>;

  const apartmentId = '01HQTESTAPT0000001';
  const roomId = '01HQTESTROOM00001';

  const mockRoom = {
    id: roomId,
    apartment_id: apartmentId,
    room_number: '101',
    layout: '2室1厅',
    monthly_rent: 2000,
    area: 80,
    status: 'available',
    notes: '测试',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockDb = {
      room: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    repository = createRoomRepository(mockDb);
  });

  describe('findById', () => {
    it('should return room by id', async () => {
      mockDb.room.findUnique.mockResolvedValue(mockRoom);

      const result = await repository.findById(roomId);

      expect(result).toEqual(mockRoom);
    });

    it('should return null when not found', async () => {
      mockDb.room.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithApartment', () => {
    it('should return room with apartment', async () => {
      mockDb.room.findFirst.mockResolvedValue({
        ...mockRoom,
        apartment: { id: apartmentId, name: '测试公寓', organization_id: 'org1' },
      });

      const result = await repository.findByIdWithApartment(roomId);

      expect(result).toBeDefined();
      expect((result as any).apartment).toBeDefined();
    });
  });

  describe('findByApartmentId', () => {
    it('should return rooms by apartment id', async () => {
      mockDb.room.findMany.mockResolvedValue([mockRoom]);

      const result = await repository.findByApartmentId(apartmentId);

      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create room', async () => {
      mockDb.room.create.mockResolvedValue(mockRoom);

      const result = await repository.create({
        apartment: { connect: { id: apartmentId } },
        room_number: '101',
        monthly_rent: 2000,
      });

      expect(result).toEqual(mockRoom);
    });
  });

  describe('createBatch', () => {
    it('should batch create rooms', async () => {
      mockDb.room.create
        .mockResolvedValueOnce(mockRoom)
        .mockResolvedValueOnce({ ...mockRoom, id: 'room2', room_number: '102' });

      const result = await repository.createBatch([
        { apartment: { connect: { id: apartmentId } }, room_number: '101', monthly_rent: 2000 },
        { apartment: { connect: { id: apartmentId } }, room_number: '102', monthly_rent: 2200 },
      ]);

      expect(mockDb.room.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update room', async () => {
      mockDb.room.update.mockResolvedValue({ ...mockRoom, room_number: '201' });

      const result = await repository.update(roomId, { room_number: '201' });

      expect(result.room_number).toBe('201');
    });
  });

  describe('delete', () => {
    it('should delete room', async () => {
      mockDb.room.delete.mockResolvedValue(undefined);

      await repository.delete(roomId);

      expect(mockDb.room.delete).toHaveBeenCalledWith({ where: { id: roomId } });
    });
  });
});
