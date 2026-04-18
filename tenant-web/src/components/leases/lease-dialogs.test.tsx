import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { Lease } from '@/types';
import type { LeaseEditFormData } from '@/schemas/leases';
import { LeaseEditDialog } from './lease-dialogs';

const selectedLease: Lease = {
  id: 'lease-1',
  room_id: 'room-1',
  tenant_id: 'tenant-1',
  start_date: '2026-03-28T00:00:00.000Z',
  end_date: null,
  billing_day: 1,
  monthly_rent: 1800,
  deposit: 1800,
  water_rate: 3,
  electricity_rate: 0.8,
  is_active: true,
  notes: '测试备注',
  created_at: '2026-03-28T00:00:00.000Z',
  room: {
    id: 'room-1',
    apartment_id: 'apartment-1',
    room_number: '101',
    layout: null,
    status: 'occupied',
    maintenance: false,
    area: null,
    facilities: null,
    notes: null,
    pricing: { id: 'pricing-1', room_id: 'room-1', monthly_rent: 1800, effective_date: '2026-03-28T00:00:00.000Z' },
    created_at: '2026-03-28T00:00:00.000Z',
    apartment: {
      id: 'apartment-1',
      organization_id: 'org-1',
      name: '阳光公寓',
      address: null,
      description: null,
      floors: null,
      land_area: null,
      total_area: null,
      landlord_name: null,
      landlord_contact: null,
      contract_start: null,
      contract_end: null,
      landlord_rent: null,
      operating_cost: null,
      created_at: '2026-03-28T00:00:00.000Z',
    },
  },
  tenant: {
    id: 'tenant-1',
    organization_id: 'org-1',
    name: '张三',
    phone: '13800138000',
    sms_opt_out: false,
    sms_opt_out_at: null,
    sms_opt_out_reason: null,
    id_card: null,
    emergency_contact: null,
    emergency_phone: null,
    notes: null,
    created_at: '2026-03-28T00:00:00.000Z',
  },
};

function TestLeaseEditDialog() {
  const form = useForm<LeaseEditFormData>({
    defaultValues: {
      room_id: selectedLease.room_id,
      tenant_id: selectedLease.tenant_id,
      start_date: '2026-03-28',
      end_date: '',
      monthly_rent: selectedLease.monthly_rent,
      deposit: selectedLease.deposit,
      water_rate: selectedLease.water_rate,
      electricity_rate: selectedLease.electricity_rate,
      notes: selectedLease.notes ?? '',
    },
  });

  return (
    <LeaseEditDialog
      open
      onOpenChange={() => {}}
      selectedLease={selectedLease}
      form={form}
      onSubmit={() => {}}
      isPending={false}
    />
  );
}

describe('LeaseEditDialog', () => {
  it('renders read-only room and tenant fields without crashing', () => {
    render(<TestLeaseEditDialog />);

    expect(screen.getByText('编辑租约')).toBeInTheDocument();
    expect(screen.getByDisplayValue('阳光公寓 - 101')).toBeDisabled();
    expect(screen.getByDisplayValue('张三')).toBeDisabled();
  });
});
