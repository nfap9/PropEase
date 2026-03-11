import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ulid first
vi.mock('ulid', () => ({
  ulid: vi.fn(() => '01HQTESTBILL000001'),
}));

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    room: {
      findMany: vi.fn(),
    },
    lease: {
      findMany: vi.fn(),
    },
    bill: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    utilityReading: {
      findFirst: vi.fn(),
    },
    utilityConfig: {
      findUnique: vi.fn(),
    },
    apartmentFeeConfig: {
      findMany: vi.fn(),
    },
    billFeeItem: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../lib/prisma.js';
import { generateBillsForOrg } from './billGeneration.js';

describe('generateBillsForOrg', () => {
  const orgId = '01hqtestorg000000001';
  const billYear = 2024;
  const billMonth = 1;
  const dueDate = new Date('2024-02-15');

  const mockApartment = {
    id: '01hqtestapartment01',
    organization_id: orgId,
    name: '测试公寓',
  };

  const mockRoom = {
    id: '01hqtestroom0000001',
    apartment_id: mockApartment.id,
    room_number: '101',
    status: 'occupied',
    apartment: mockApartment,
  };

  const mockLease = {
    id: '01hqtestlease0000001',
    room_id: mockRoom.id,
    tenant_id: '01hqtesttenant00001',
    monthly_rent: 2000,
    water_rate: 5,
    electricity_rate: 1,
    is_active: true,
    rental_type: 'monthly',
    room: mockRoom,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 created and 0 skipped when no rooms found', async () => {
    vi.mocked(prisma.room.findMany).mockResolvedValue([]);
    vi.mocked(prisma.lease.findMany).mockResolvedValue([]);

    const result = await generateBillsForOrg(orgId, billYear, billMonth, dueDate);

    expect(result).toEqual({ created: 0, skipped: 0 });
  });

  it('should return 0 created and 0 skipped when no active leases', async () => {
    vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom]);
    vi.mocked(prisma.lease.findMany).mockResolvedValue([]);

    const result = await generateBillsForOrg(orgId, billYear, billMonth, dueDate);

    expect(result).toEqual({ created: 0, skipped: 0 });
  });

  it('should skip bill when already exists', async () => {
    vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom]);
    vi.mocked(prisma.lease.findMany).mockResolvedValue([mockLease]);
    vi.mocked(prisma.bill.findFirst).mockResolvedValue({ id: 'existing_bill' } as any);

    const result = await generateBillsForOrg(orgId, billYear, billMonth, dueDate);

    expect(result).toEqual({ created: 0, skipped: 1 });
  });

  it('should create bill without utility readings', async () => {
    vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom]);
    vi.mocked(prisma.lease.findMany).mockResolvedValue([mockLease]);
    vi.mocked(prisma.bill.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.utilityReading.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.utilityConfig.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.apartmentFeeConfig.findMany).mockResolvedValue([]);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: Function) => {
      const mockTx = {
        bill: { create: vi.fn() },
        billFeeItem: { createMany: vi.fn() },
      };
      return fn(mockTx);
    });

    const result = await generateBillsForOrg(orgId, billYear, billMonth, dueDate);

    expect(result).toEqual({ created: 1, skipped: 0 });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should calculate water amount from lease rate', async () => {
    const mockReading = {
      room_id: mockRoom.id,
      period_year: billYear,
      period_month: billMonth,
      water_reading: 100,
      water_previous: 80,
      electricity_reading: null,
      electricity_previous: null,
    };

    vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom]);
    vi.mocked(prisma.lease.findMany).mockResolvedValue([mockLease]);
    vi.mocked(prisma.bill.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.utilityReading.findFirst).mockResolvedValue(mockReading as any);
    vi.mocked(prisma.utilityConfig.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.apartmentFeeConfig.findMany).mockResolvedValue([]);

    let capturedBillData: any = null;
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: Function) => {
      const mockTx = {
        bill: {
          create: vi.fn().mockImplementation((args: any) => {
            capturedBillData = args.data;
          }),
        },
        billFeeItem: { createMany: vi.fn() },
      };
      return fn(mockTx);
    });

    await generateBillsForOrg(orgId, billYear, billMonth, dueDate);

    // water usage = 100 - 80 = 20, rate = 5, amount = 100
    expect(capturedBillData.water_amount).toBe(100);
  });

  it('should calculate electricity amount from utility config when lease rate is null', async () => {
    const leaseWithoutRate = {
      ...mockLease,
      water_rate: null,
      electricity_rate: null,
    };

    const mockReading = {
      room_id: mockRoom.id,
      period_year: billYear,
      period_month: billMonth,
      water_reading: 100,
      water_previous: 80,
      electricity_reading: 200,
      electricity_previous: 150,
    };

    const mockConfig = {
      apartment_id: mockApartment.id,
      water_price_per_unit: 4,
      electricity_price_per_unit: 0.8,
    };

    vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom]);
    vi.mocked(prisma.lease.findMany).mockResolvedValue([leaseWithoutRate]);
    vi.mocked(prisma.bill.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.utilityReading.findFirst).mockResolvedValue(mockReading as any);
    vi.mocked(prisma.utilityConfig.findUnique).mockResolvedValue(mockConfig as any);
    vi.mocked(prisma.apartmentFeeConfig.findMany).mockResolvedValue([]);

    let capturedBillData: any = null;
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: Function) => {
      const mockTx = {
        bill: {
          create: vi.fn().mockImplementation((args: any) => {
            capturedBillData = args.data;
          }),
        },
        billFeeItem: { createMany: vi.fn() },
      };
      return fn(mockTx);
    });

    await generateBillsForOrg(orgId, billYear, billMonth, dueDate);

    // water: (100 - 80) * 4 = 80
    // electricity: (200 - 150) * 0.8 = 40
    expect(capturedBillData.water_amount).toBe(80);
    expect(capturedBillData.electricity_amount).toBe(40);
  });

  it('should filter by leaseIds when provided', async () => {
    const lease1 = { ...mockLease, id: 'lease1' };
    const lease2 = { ...mockLease, id: 'lease2', room: { ...mockRoom, id: 'room2' } };

    vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom, { ...mockRoom, id: 'room2' }]);
    vi.mocked(prisma.lease.findMany).mockResolvedValue([lease1, lease2]);
    vi.mocked(prisma.bill.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.utilityReading.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.utilityConfig.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.apartmentFeeConfig.findMany).mockResolvedValue([]);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: Function) => {
      const mockTx = {
        bill: { create: vi.fn() },
        billFeeItem: { createMany: vi.fn() },
      };
      return fn(mockTx);
    });

    const result = await generateBillsForOrg(orgId, billYear, billMonth, dueDate, ['lease1']);

    expect(result).toEqual({ created: 1, skipped: 0 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should calculate total_amount correctly', async () => {
    const mockReading = {
      room_id: mockRoom.id,
      period_year: billYear,
      period_month: billMonth,
      water_reading: 100,
      water_previous: 80,
      electricity_reading: 200,
      electricity_previous: 150,
    };

    vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom]);
    vi.mocked(prisma.lease.findMany).mockResolvedValue([mockLease]);
    vi.mocked(prisma.bill.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.utilityReading.findFirst).mockResolvedValue(mockReading as any);
    vi.mocked(prisma.utilityConfig.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.apartmentFeeConfig.findMany).mockResolvedValue([]);

    let capturedBillData: any = null;
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: Function) => {
      const mockTx = {
        bill: {
          create: vi.fn().mockImplementation((args: any) => {
            capturedBillData = args.data;
          }),
        },
        billFeeItem: { createMany: vi.fn() },
      };
      return fn(mockTx);
    });

    await generateBillsForOrg(orgId, billYear, billMonth, dueDate);

    // rent: 2000, water: 100, electricity: 50
    expect(capturedBillData.rent_amount).toBe(2000);
    expect(capturedBillData.water_amount).toBe(100);
    expect(capturedBillData.electricity_amount).toBe(50);
    expect(capturedBillData.total_amount).toBe(2150);
  });
});
