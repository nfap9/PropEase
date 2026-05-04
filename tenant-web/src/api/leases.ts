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

/** 租约创建参数（包含 fee_items） */
export interface LeaseCreateParams {
  room_id?: string;
  tenant_id?: string;
  tenant_info?: {
    name: string;
    phone?: string;
    id_card?: string;
    emergency_contact?: string;
    emergency_phone?: string;
    notes?: string;
  };
  start_date?: string;
  end_date?: string;
  billing_day?: number;
  monthly_rent?: number;
  deposit?: number;
  water_rate?: number;
  electricity_rate?: number;
  notes?: string;
  fee_items?: Array<{
    fee_type_id?: string;
    fee_name: string;
    fee_amount: number;
    fee_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
    quantity?: number;
    notes?: string;
  }>;
}

export const leasesApi = {
  list: async (isActive?: boolean): Promise<Lease[]> => {
    const response = await api.get<Lease[]>('/leases', {
      params: { is_active: isActive },
    });
    return response.data;
  },

  get: async (id: string): Promise<Lease> => {
    const response = await api.get<Lease>(`/leases/${id}`);
    return response.data;
  },

  create: async (data: LeaseCreateParams): Promise<Lease> => {
    const response = await api.post<Lease>('/leases', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.put<Lease>(`/leases/${id}`, data);
    return response.data;
  },

  terminate: async (id: string): Promise<void> => {
    await api.post(`/leases/${id}/terminate`, {});
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/leases/${id}`);
  },

  // --- 高级操作 ---

  changeRoom: async (
    leaseId: string,
    data: { newRoomId: string; changeDate: string; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/change-room`, {
      new_room_id: data.newRoomId,
      change_date: data.changeDate,
      reason: data.reason,
    });
  },

  renew: async (
    leaseId: string,
    data: { newEndDate: string; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/renew`, {
      new_end_date: data.newEndDate,
      reason: data.reason,
    });
  },

  updateTenant: async (
    leaseId: string,
    data: { newTenantId: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/update-tenant`, {
      new_tenant_id: data.newTenantId,
    });
  },

  changeRent: async (
    leaseId: string,
    data: { newRent: number; effectiveFromYear: number; effectiveFromMonth: number; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/change-rent`, {
      new_rent: data.newRent,
      effective_from_year: data.effectiveFromYear,
      effective_from_month: data.effectiveFromMonth,
      reason: data.reason,
    });
  },

  changeUtilityRates: async (
    leaseId: string,
    data: { waterRate: number; electricityRate: number; effectiveFromYear: number; effectiveFromMonth: number }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/change-utility-rates`, {
      water_rate: data.waterRate,
      electricity_rate: data.electricityRate,
      effective_from_year: data.effectiveFromYear,
      effective_from_month: data.effectiveFromMonth,
    });
  },

  changeDeposit: async (
    leaseId: string,
    data: { newDeposit: number; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/change-deposit`, {
      new_deposit: data.newDeposit,
      reason: data.reason,
    });
  },

  updateFeeItems: async (
    leaseId: string,
    data: { feeItems: Array<{ feeTypeId: string; specificationId?: string; quantity: number }>; effectiveFromYear: number; effectiveFromMonth: number; reason?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/update-fee-items`, {
      feeItems: data.feeItems.map(item => ({
        fee_type_id: item.feeTypeId,
        specification_id: item.specificationId,
        quantity: item.quantity,
      })),
      effectiveFromYear: data.effectiveFromYear,
      effectiveFromMonth: data.effectiveFromMonth,
      reason: data.reason,
    });
  },

  setLeaseFeeItems: async (
    leaseId: string,
    feeItems: Array<{
      fee_type_id?: string;
      fee_name: string;
      fee_amount: number;
      fee_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
      quantity?: number;
      notes?: string;
    }>
  ): Promise<{ lease_id: string; updated_at: string }> => {
    const response = await api.post<{ lease_id: string; updated_at: string }>(
      `/leases/${leaseId}/set-fee-items`,
      { feeItems }
    );
    return response.data;
  },

  settleLease: async (
    leaseId: string,
    data: { finalWaterReading?: number; finalElectricityReading?: number; penaltyAmount?: number; remarks?: string }
  ): Promise<void> => {
    await api.post(`/leases/${leaseId}/settle`, {
      final_water_reading: data.finalWaterReading,
      final_electricity_reading: data.finalElectricityReading,
      penalty_amount: data.penaltyAmount,
      remarks: data.remarks,
    });
  },

  getChangeLogs: async (leaseId: string): Promise<LeaseChangeLog[]> => {
    const response = await api.get<LeaseChangeLog[]>(`/leases/${leaseId}/change-logs`);
    return response.data;
  },
};

export default leasesApi;
