import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUtilityRepository, type UtilityRepository } from './utility.repo.js';
import type { UtilityReading, Room } from '@prisma/client';

describe('UtilityRepository', () => {
  const mockUtilityReading = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockRoom = {
    findMany: vi.fn(),
  };

  const mockDb = {
    utilityReading: mockUtilityReading,
    room: mockRoom,
  } as unknown as Parameters<typeof createUtilityRepository>[0];
  let repo: UtilityRepository;

  const orgId = '01hqtestorg000000001';
  const apartmentId = '01hqtestapt00000001';
  const roomId = '01hqtestroom0000001';

  const sampleReading: UtilityReading = {
    id: '01hqtestreading00001',
    room_id: roomId,
    period_year: 2024,
    period_month: 1,
    water_reading: 100,
    water_previous: 80,
    electricity_reading: 200,
    electricity_previous: 150,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const sampleRoom: Room = {
    id: roomId,
    apartment_id: apartmentId,
    room_number: '101',
    status: 'occupied',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const sampleApartment = {
    id: apartmentId,
    organization_id: orgId,
    name: '测试公寓',
    is_personal: false,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    repo = createUtilityRepository(mockDb);
  });

  describe('findById', () => {
    it('should return reading by id', async () => {
      mockUtilityReading.findUnique.mockResolvedValue(sampleReading);

      const result = await repo.findById('01hqtestreading00001');

      expect(mockUtilityReading.findUnique).toHaveBeenCalledWith({
        where: { id: '01hqtestreading00001' },
      });
      expect(result).toEqual(sampleReading);
    });

    it('should return null if not found', async () => {
      mockUtilityReading.findUnique.mockResolvedValue(null);

      const result = await repo.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithRelations', () => {
    it('should return reading with room and apartment', async () => {
      const readingWithRelations = {
        ...sampleReading,
        room: { ...sampleRoom, apartment: sampleApartment },
      };
      mockUtilityReading.findFirst.mockResolvedValue(readingWithRelations);

      const result = await repo.findByIdWithRelations('01hqtestreading00001');

      expect(mockUtilityReading.findFirst).toHaveBeenCalledWith({
        where: { id: '01hqtestreading00001' },
        include: { room: { include: { apartment: true } } },
      });
      expect(result).toEqual(readingWithRelations);
    });

    it('should return null if not found', async () => {
      mockUtilityReading.findFirst.mockResolvedValue(null);

      const result = await repo.findByIdWithRelations('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByOrgId', () => {
    it('should return readings filtered by org', async () => {
      const readingWithRelations = {
        ...sampleReading,
        room: { ...sampleRoom, apartment: sampleApartment },
      };
      mockRoom.findMany.mockResolvedValue([{ id: roomId }]);
      mockUtilityReading.findMany.mockResolvedValue([readingWithRelations]);

      const result = await repo.findByOrgId(orgId);

      expect(mockRoom.findMany).toHaveBeenCalledWith({
        where: { apartment: { organization_id: orgId } },
        select: { id: true },
      });
      expect(result).toHaveLength(1);
    });

    it('should filter by apartmentId', async () => {
      mockRoom.findMany.mockResolvedValue([{ id: roomId }]);
      mockUtilityReading.findMany.mockResolvedValue([]);

      await repo.findByOrgId(orgId, { apartmentId });

      expect(mockRoom.findMany).toHaveBeenCalledWith({
        where: {
          apartment: { organization_id: orgId },
          apartment_id: apartmentId,
        },
        select: { id: true },
      });
    });

    it('should filter by roomId', async () => {
      mockRoom.findMany.mockResolvedValue([{ id: roomId }]);
      mockUtilityReading.findMany.mockResolvedValue([]);

      await repo.findByOrgId(orgId, { roomId });

      expect(mockUtilityReading.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ room_id: roomId }),
        })
      );
    });

    it('should filter by period', async () => {
      mockRoom.findMany.mockResolvedValue([{ id: roomId }]);
      mockUtilityReading.findMany.mockResolvedValue([]);

      await repo.findByOrgId(orgId, { periodYear: 2024, periodMonth: 1 });

      expect(mockUtilityReading.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            period_year: 2024,
            period_month: 1,
          }),
        })
      );
    });

    it('should return empty array when no rooms', async () => {
      mockRoom.findMany.mockResolvedValue([]);
      mockUtilityReading.findMany.mockResolvedValue([]);

      const result = await repo.findByOrgId(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create reading with data', async () => {
      const createInput = {
        id: '01hqtestreading00001',
        room: { connect: { id: roomId } },
        period_year: 2024,
        period_month: 1,
        water_reading: 100,
        water_previous: 80,
      };
      mockUtilityReading.create.mockResolvedValue(sampleReading);

      const result = await repo.create(createInput);

      expect(mockUtilityReading.create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(sampleReading);
    });
  });

  describe('createBatch', () => {
    it('should create multiple readings', async () => {
      const readings = [
        { room: { connect: { id: roomId } }, period_year: 2024, period_month: 1 },
        { room: { connect: { id: 'room2' } }, period_year: 2024, period_month: 1 },
      ];
      mockUtilityReading.create.mockResolvedValue(sampleReading);

      const result = await repo.createBatch(readings);

      expect(mockUtilityReading.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update reading', async () => {
      const updateInput = { water_reading: 120 };
      const updatedReading = { ...sampleReading, water_reading: 120 };
      mockUtilityReading.update.mockResolvedValue(updatedReading);

      const result = await repo.update('01hqtestreading00001', updateInput);

      expect(mockUtilityReading.update).toHaveBeenCalledWith({
        where: { id: '01hqtestreading00001' },
        data: updateInput,
      });
      expect(result.water_reading).toBe(120);
    });
  });

  describe('delete', () => {
    it('should delete reading', async () => {
      mockUtilityReading.delete.mockResolvedValue(sampleReading);

      await repo.delete('01hqtestreading00001');

      expect(mockUtilityReading.delete).toHaveBeenCalledWith({
        where: { id: '01hqtestreading00001' },
      });
    });
  });

  describe('findExistingReading', () => {
    it('should return reading when found', async () => {
      mockUtilityReading.findFirst.mockResolvedValue(sampleReading);

      const result = await repo.findExistingReading(roomId, 2024, 1);

      expect(mockUtilityReading.findFirst).toHaveBeenCalledWith({
        where: { room_id: roomId, period_year: 2024, period_month: 1 },
      });
      expect(result).toEqual(sampleReading);
    });

    it('should return null when not found', async () => {
      mockUtilityReading.findFirst.mockResolvedValue(null);

      const result = await repo.findExistingReading(roomId, 2024, 6);

      expect(result).toBeNull();
    });
  });

  describe('getRoomIdsByOrg', () => {
    it('should return room ids for organization', async () => {
      const roomIds = [{ id: roomId }, { id: 'room2' }];
      mockRoom.findMany.mockResolvedValue(roomIds);

      const result = await repo.getRoomIdsByOrg(orgId);

      expect(mockRoom.findMany).toHaveBeenCalledWith({
        where: { apartment: { organization_id: orgId } },
        select: { id: true },
      });
      expect(result).toEqual([roomId, 'room2']);
    });

    it('should return empty array when no rooms', async () => {
      mockRoom.findMany.mockResolvedValue([]);

      const result = await repo.getRoomIdsByOrg(orgId);

      expect(result).toEqual([]);
    });
  });
});
