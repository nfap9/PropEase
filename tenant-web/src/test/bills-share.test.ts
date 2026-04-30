import { describe, expect, it } from 'vitest';
import { buildBillShareData, renderBillShareSvg } from '@/utils/bills-share';
import type { Bill } from '@/types';

const sampleBill = {
  id: 'bill-1',
  lease_id: 'lease-1',
  bill_year: 2026,
  bill_month: 3,
  due_date: '2026-03-20',
  rent_amount: 2800,
  water_amount: 90,
  electricity_amount: 120,
  other_amount: 30,
  total_amount: 3040,
  paid_amount: 1000,
  status: 'partial',
  notes: '门锁维修费已并入本月账单',
  lease: {
    id: 'lease-1',
    room_id: 'room-1',
    tenant_id: 'tenant-1',
    start_date: '2026-01-01',
    end_date: null,
    billing_day: 10,
    monthly_rent: 2800,
    deposit: 2800,
    water_rate: 4,
    electricity_rate: 1,
    is_active: true,
    room: {
      id: 'room-1',
      apartment_id: 'apartment-1',
      room_number: '1203',
      layout: null,
      status: 'occupied',
      monthly_rent: 2800,
      area: null,
      facilities: null,
      notes: null,
      apartment: {
        id: 'apartment-1',
        organization_id: 'org-1',
        name: '星河公寓',
        address: '测试路 1 号',
        description: null,
        created_at: '2026-01-01',
      },
      created_at: '2026-01-01',
    },
    tenant: {
      id: 'tenant-1',
      organization_id: 'org-1',
      name: '张三',
      phone: '13800138000',
      id_card: null,
      emergency_contact: null,
      emergency_phone: null,
      notes: null,
      created_at: '2026-01-01',
    },
    created_at: '2026-01-01',
  },
  created_at: '2026-03-01',
} as unknown as Bill;

describe('bill share helpers', () => {
  it('builds share data from the bill summary', () => {
    const result = buildBillShareData({
      bill: sampleBill,
      organizationName: 'PropEase',
    });

    expect(result.monthLabel).toBe('2026年3月账单');
    expect(result.roomLabel).toContain('1203');
    expect(result.tenantName).toBe('张三');
    expect(result.unpaidAmount).toBe('¥2,040.00');
  });

  it('renders an svg with the main bill information', () => {
    const svg = renderBillShareSvg(
      buildBillShareData({
        bill: sampleBill,
        organizationName: 'PropEase',
      })
    );

    expect(svg).toContain('2026年3月账单');
    expect(svg).toContain('PropEase');
    expect(svg).toContain('账单合计');
    expect(svg).toContain('门锁维修费已并入本月账单');
  });
});
