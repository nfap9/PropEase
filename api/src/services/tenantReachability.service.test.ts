import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config.js';
import {
  createTenantReachabilityService,
  DEFAULT_SMS_TEMPLATES,
} from './tenantReachability.service.js';

describe('tenantReachability.service', () => {
  const mockDb = {
    bill: {
      findUnique: vi.fn(),
    },
    notificationTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    notificationDelivery: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  } as any;

  const mockSmsGateway = {
    send: vi.fn(),
  };

  const now = new Date('2026-03-17T08:00:00.000Z');

  beforeEach(() => {
    vi.resetAllMocks();
    config.smsNotificationsEnabled = false;
  });

  afterEach(() => {
    config.smsNotificationsEnabled = false;
  });

  it('should return default templates when org has no overrides', async () => {
    mockDb.notificationTemplate.findMany.mockResolvedValue([]);

    const service = createTenantReachabilityService({
      db: mockDb,
      smsGateway: mockSmsGateway,
      now: () => now,
    });

    const result = await service.listTemplates('01org');

    expect(result).toHaveLength(3);
    expect(result[0].organization_id).toBe('01org');
    expect(result[0].content).toBe(DEFAULT_SMS_TEMPLATES.bill_generated.content);
    expect(result.every((item) => item.channel === 'sms')).toBe(true);
  });

  it('should create skipped delivery when tenant has no phone', async () => {
    config.smsNotificationsEnabled = true;
    mockDb.bill.findUnique.mockResolvedValue(createBillContext({ phone: null }));
    mockDb.notificationTemplate.findUnique.mockResolvedValue(null);
    mockDb.notificationDelivery.create.mockImplementation(async ({ data }: any) =>
      createDeliveryRecord(data)
    );

    const service = createTenantReachabilityService({
      db: mockDb,
      smsGateway: mockSmsGateway,
      now: () => now,
    });

    await service.sendBillGenerated('01bill');

    expect(mockSmsGateway.send).not.toHaveBeenCalled();
    expect(mockDb.notificationDelivery.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'skipped',
          status_reason: '租客缺少手机号，已跳过短信发送',
        }),
      })
    );
  });

  it('should send sms and persist sent delivery record', async () => {
    config.smsNotificationsEnabled = true;
    mockDb.bill.findUnique.mockResolvedValue(createBillContext());
    mockDb.notificationTemplate.findUnique.mockResolvedValue(null);
    mockDb.notificationDelivery.create.mockImplementation(async ({ data }: any) =>
      createDeliveryRecord(data)
    );
    mockSmsGateway.send.mockResolvedValue({ messageId: 'sms-001' });

    const service = createTenantReachabilityService({
      db: mockDb,
      smsGateway: mockSmsGateway,
      now: () => now,
    });

    await service.sendBillOverdue('01bill');

    expect(mockSmsGateway.send).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '13800000000',
        eventType: 'bill_overdue',
      })
    );
    expect(mockDb.notificationDelivery.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'sent',
          provider_message_id: 'sms-001',
        }),
      })
    );
  });
});

function createBillContext(overrides?: { phone?: string | null }) {
  const phone = overrides && 'phone' in overrides ? overrides.phone : '13800000000';
  return {
    id: '01bill',
    lease_id: '01lease',
    due_date: new Date('2026-03-15T00:00:00.000Z'),
    bill_year: 2026,
    bill_month: 3,
    total_amount: 1280,
    lease: {
      tenant_id: '01tenant',
      tenant: {
        name: '张三',
        phone,
        sms_opt_out: false,
      },
      room: {
        room_number: '101',
        apartment: {
          organization_id: '01org',
          organization: {
            name: '城南公寓',
          },
        },
      },
    },
  };
}

function createDeliveryRecord(data: Record<string, unknown>) {
  return {
    ...data,
    created_at: new Date('2026-03-17T08:00:00.000Z'),
    updated_at: new Date('2026-03-17T08:00:00.000Z'),
    tenant: { name: '张三' },
    lease: { room: { room_number: '101' } },
    template: null,
  };
}
