import type { LeaseEditFormData, LeaseFiltersState } from '@/types';
import type { Lease } from '@/types';

export function buildLeaseEditFormValues(lease: Lease): Partial<LeaseEditFormData> {
  return {
    room_id: lease.room_id ?? '',
    tenant_id: lease.tenant_id ?? '',
    start_date: lease.start_date ?? '',
    end_date: lease.end_date ?? '',
    monthly_rent: lease.monthly_rent ?? 0,
    deposit: lease.deposit ?? 0,
    water_rate: lease.water_rate ?? 0,
    electricity_rate: lease.electricity_rate ?? 0,
    notes: lease.notes ?? '',
  };
}

export function getLeaseDisplayInfo(lease: Lease) {
  return {
    roomDisplay: lease.room
      ? `${lease.room.apartment?.name || ''} - ${lease.room.room_number}`
      : '',
    tenantDisplay: lease.tenant?.name || '',
  };
}

export function filterLeases(leases: Lease[] | undefined, filters: LeaseFiltersState) {
  if (!leases) {
    return [];
  }

  return leases.filter((lease) => {
    if (filters.apartmentId && lease.room?.apartment_id !== filters.apartmentId) {
      return false;
    }

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const roomNumber = lease.room?.room_number?.toLowerCase() ?? '';
      const tenantName = lease.tenant?.name?.toLowerCase() ?? '';
      const tenantPhone = lease.tenant?.phone ?? '';
      const tenantIdCard = lease.tenant?.id_card ?? '';
      const matchesKeyword =
        roomNumber.includes(keyword) ||
        tenantName.includes(keyword) ||
        tenantPhone.includes(keyword) ||
        tenantIdCard.includes(keyword);

      if (!matchesKeyword) {
        return false;
      }
    }

    if (filters.startDateFrom) {
      const startDate = lease.start_date.slice(0, 10);
      if (startDate < filters.startDateFrom) {
        return false;
      }
    }

    if (filters.startDateTo) {
      const startDate = lease.start_date.slice(0, 10);
      if (startDate > filters.startDateTo) {
        return false;
      }
    }

    const endDate = lease.end_date ? lease.end_date.slice(0, 10) : null;
    if (filters.endDateFrom) {
      if (!endDate || endDate < filters.endDateFrom) {
        return false;
      }
    }

    if (filters.endDateTo) {
      if (!endDate || endDate > filters.endDateTo) {
        return false;
      }
    }

    return true;
  });
}
