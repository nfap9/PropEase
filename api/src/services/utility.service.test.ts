import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUtilityService, type UtilityService } from './utility.service.js';
import type { UtilityRepository } from '../repositories/utility.repo.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    room: {
      findFirst: vi.fn(),
    },
  },
}));

describe('UtilityService', () => {
  const mockRepo: UtilityRepository = {
    findById: vi.fn(),
    findByIdWithRelations: vi.fn(),
    findByOrgId: vi.fn(),
    create: vi.fn(),
    createBatch: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findExistingReading: vi.fn(),
    findLatestReadingBefore: vi.fn(),
    getRoomIdsByOrg: vi.fn(),
  };

  let service: UtilityService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = createUtilityService(() => mockRepo);
  });

  it('should auto-fill previous readings from latest history on create', async () => {
    const { prisma } = await import('../lib/prisma.js');
    vi.mocked(prisma.room.findFirst).mockResolvedValue({
      id: '01room',
      apartment: { organization_id: '01org' },
    } as any);
    vi.mocked(mockRepo.findLatestReadingBefore).mockResolvedValue({
      water_reading: 120,
      water_previous: 110,
      electricity_reading: 360,
      electricity_previous: 300,
    } as any);
    vi.mocked(mockRepo.create).mockResolvedValue({
      id: '01reading',
    } as any);

    await service.create('01org', {
      room_id: '01room',
      period_year: 2026,
      period_month: 3,
      reading_date: '2026-03-17',
      water_reading: 135,
      electricity_reading: 410,
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        water_previous: 120,
        electricity_previous: 360,
      })
    );
  });

  it('should auto-handle first reading when no previous baseline exists', async () => {
    const { prisma } = await import('../lib/prisma.js');
    vi.mocked(prisma.room.findFirst).mockResolvedValue({
      id: '01room',
      apartment: { organization_id: '01org' },
    } as any);
    vi.mocked(mockRepo.findLatestReadingBefore).mockResolvedValue(null);
    vi.mocked(mockRepo.create).mockResolvedValue({
      id: '01reading',
    } as any);

    // 没有历史读数时，使用 normal 场景会自动按首次录入处理
    await service.create('01org', {
      room_id: '01room',
      period_year: 2026,
      period_month: 3,
      reading_date: '2026-03-17',
      water_reading: 20,
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        water_previous: 20,
      })
    );
  });

  it('should allow initial readings to build the first baseline', async () => {
    const { prisma } = await import('../lib/prisma.js');
    vi.mocked(prisma.room.findFirst).mockResolvedValue({
      id: '01room',
      apartment: { organization_id: '01org' },
    } as any);
    vi.mocked(mockRepo.findLatestReadingBefore).mockResolvedValue(null);
    vi.mocked(mockRepo.create).mockResolvedValue({
      id: '01reading',
    } as any);

    await service.create('01org', {
      room_id: '01room',
      period_year: 2026,
      period_month: 3,
      reading_date: '2026-03-17',
      water_reading: 20,
      reading_context: 'initial',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        water_previous: 20,
      })
    );
  });

  it('should allow meter reset with explicit baseline and reason on update', async () => {
    vi.mocked(mockRepo.findByIdWithRelations).mockResolvedValue({
      id: '01reading',
      room_id: '01room',
      period_year: 2026,
      period_month: 3,
      reading_date: new Date('2026-03-17'),
      water_reading: 240,
      water_previous: 200,
      electricity_reading: 800,
      electricity_previous: 720,
      notes: null,
      room: {
        apartment: { organization_id: '01org' },
      },
    } as any);
    vi.mocked(mockRepo.findLatestReadingBefore).mockResolvedValue({
      water_reading: 240,
      water_previous: 200,
      electricity_reading: 800,
      electricity_previous: 720,
    } as any);
    vi.mocked(mockRepo.update).mockResolvedValue({
      id: '01reading',
    } as any);

    await service.update('01org', '01reading', {
      water_reading: 15,
      water_previous: 0,
      reading_context: 'meter_reset',
      anomaly_reason: '旧水表故障后已更换',
    });

    expect(mockRepo.update).toHaveBeenCalledWith(
      '01reading',
      expect.objectContaining({
        water_reading: 15,
        water_previous: 0,
        notes: expect.stringContaining('更换新表'),
      })
    );
  });
});
