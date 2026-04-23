export interface LeaseEditFormData {
  room_id: string;
  tenant_id: string;
  start_date: string;
  end_date?: string;
  monthly_rent: number;
  deposit?: number;
  water_rate?: number;
  electricity_rate?: number;
  notes?: string;
}

/** 签约表单 */
export interface LeaseSigningFormData {
  room_id: string;
  tenant_name: string;
  tenant_phone: string;
  tenant_id_card?: string;
  tenant_emergency_contact?: string;
  tenant_emergency_phone?: string;
  tenant_notes?: string;
  start_date: string;
  end_date?: string;
  monthly_rent: number;
  deposit?: number;
  water_rate?: number;
  electricity_rate?: number;
  notes?: string;
}

export interface LeaseFiltersState {
  apartmentId: string | null;
  keyword: string | null;
  startDateFrom: string | null;
  startDateTo: string | null;
  endDateFrom: string | null;
  endDateTo: string | null;
}

export function getDefaultLeaseFilters(): LeaseFiltersState {
  return {
    apartmentId: null,
    keyword: null,
    startDateFrom: null,
    startDateTo: null,
    endDateFrom: null,
    endDateTo: null,
  };
}
