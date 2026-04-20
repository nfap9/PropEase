import { Select } from 'antd';
import type { Apartment, Lease } from '@/types';

interface HistoryFiltersProps {
  apartments: Apartment[];
  leases: Lease[];
  selectedApartmentId: string | null;
  selectedLeaseId: string | null;
  onApartmentChange: (id: string | null) => void;
  onLeaseChange: (id: string | null) => void;
  loading?: boolean;
}

type SelectOption = { value: string; label: string; disabled?: boolean };

export function HistoryFilters({
  apartments,
  leases,
  selectedApartmentId,
  selectedLeaseId,
  onApartmentChange,
  onLeaseChange,
  loading,
}: HistoryFiltersProps) {
  const leasesInApartment = leases.filter(
    (lease) => lease.room?.apartment_id === selectedApartmentId
  );

  const leaseOptions: SelectOption[] =
    leasesInApartment.length === 0
      ? [{ value: 'empty', label: '暂无生效租约', disabled: true }]
      : leasesInApartment.map((lease) => ({
          value: lease.id,
          label: `${lease.room?.room_number} - ${lease.tenant?.name ?? '无租客'}`,
        }));

  return (
    <div className="flex items-center gap-3">
      <Select
        value={selectedApartmentId ?? undefined}
        onChange={(v) => onApartmentChange(v ?? null)}
        placeholder="选择公寓"
        style={{ width: 180 }}
        allowClear
        options={apartments.map((apt) => ({
          value: apt.id,
          label: apt.name,
        }))}
      />
      {selectedApartmentId && (
        <Select
          value={selectedLeaseId ?? undefined}
          onChange={(v) => onLeaseChange(v ?? null)}
          placeholder="选择租约"
          style={{ width: 220 }}
          loading={loading}
          options={leaseOptions}
        />
      )}
    </div>
  );
}