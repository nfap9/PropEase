import api from './client';
import { Lease } from '@/types';

export interface LeaseChangeLog {
  id: string;
  lease_id: string;
  change_type: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  effective_from_year: number | null;
  effective_from_month: number | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LeaseFeeItem {
  id: string;
  lease_id: string;
  fee_type_id: string;
  specification_id: string | null;
  quantity: number;
  feeType: { id: string; name: string; code: string };
  specification: { id: string; name: string; price_monthly: number } | null;
}

export const leasesApi = {
  list: async (orgId: string, isActive?: boolean): Promise<Lease[]> => {
    const response = await api.get<Lease[]>('/leases', {
      params: { org_id: orgId, is_active: isActive },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<Lease> => {
    const response = await api.get<Lease>(`/leases/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: string, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.post<Lease>('/leases', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: string, id: string, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.put<Lease>(`/leases/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  terminate: async (orgId: string, id: string): Promise<void> => {
    await api.post(`/leases/${id}/terminate`, {}, { params: { org_id: orgId } });
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/leases/${id}`, { params: { org_id: orgId } });
  },

  // --- 高级操作 ---

  changeRoom: async (
    orgId: string,
    leaseId: string,
    data: { newRoomId: string; changeDate: string; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/change-room`, {
      new_room_id: data.newRoomId,
      change_date: data.changeDate,
      reason: data.reason,
    }, {
      params: { org_id: orgId },
    });
  },

  renew: async (
    orgId: string,
    leaseId: string,
    data: { newEndDate: string; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/renew`, {
      new_end_date: data.newEndDate,
      reason: data.reason,
    }, {
      params: { org_id: orgId },
    });
  },

  updateTenant: async (
    orgId: string,
    leaseId: string,
    data: { newTenantId: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/update-tenant`, {
      new_tenant_id: data.newTenantId,
    }, {
      params: { org_id: orgId },
    });
  },

  changeRent: async (
    orgId: string,
    leaseId: string,
    data: { newRent: number; effectiveFromYear: number; effectiveFromMonth: number; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/change-rent`, {
      new_rent: data.newRent,
      effective_from_year: data.effectiveFromYear,
      effective_from_month: data.effectiveFromMonth,
      reason: data.reason,
    }, {
      params: { org_id: orgId },
    });
  },

  changeUtilityRates: async (
    orgId: string,
    leaseId: string,
    data: { waterRate: number; electricityRate: number; effectiveFromYear: number; effectiveFromMonth: number }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/change-utility-rates`, {
      water_rate: data.waterRate,
      electricity_rate: data.electricityRate,
      effective_from_year: data.effectiveFromYear,
      effective_from_month: data.effectiveFromMonth,
    }, {
      params: { org_id: orgId },
    });
  },

  changeDeposit: async (
    orgId: string,
    leaseId: string,
    data: { newDeposit: number; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/change-deposit`, {
      new_deposit: data.newDeposit,
      reason: data.reason,
    }, {
      params: { org_id: orgId },
    });
  },

  updateFeeItems: async (
    orgId: string,
    leaseId: string,
    data: { feeItems: Array<{ feeTypeId: string; specificationId?: string; quantity: number }>; effectiveFromYear: number; effectiveFromMonth: number; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/update-fee-items`, {
      fee_items: data.feeItems.map(item => ({
        fee_type_id: item.feeTypeId,
        specification_id: item.specificationId,
        quantity: item.quantity,
      })),
      effective_from_year: data.effectiveFromYear,
      effective_from_month: data.effectiveFromMonth,
      reason: data.reason,
    }, {
      params: { org_id: orgId },
    });
  },

  settleLease: async (
    orgId: string,
    leaseId: string,
    data: { finalWaterReading?: number; finalElectricityReading?: number; penaltyAmount?: number; remarks?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/settle`, {
      final_water_reading: data.finalWaterReading,
      final_electricity_reading: data.finalElectricityReading,
      penalty_amount: data.penaltyAmount,
      remarks: data.remarks,
    }, {
      params: { org_id: orgId },
    });
  },

  getChangeLogs: async (orgId: string, leaseId: string): Promise<LeaseChangeLog[]> => {
    const response = await api.get<LeaseChangeLog[]>(`/leases/${leaseId}/change-logs`, {
      params: { org_id: orgId },
    });
    return response.data;
  },
};

export default leasesApi;
