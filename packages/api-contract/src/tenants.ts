/** 租客 */
export interface Tenant {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  sms_opt_out: boolean;
  sms_opt_out_at: string | null;
  sms_opt_out_reason: string | null;
  id_card: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface TenantCreate {
  name: string;
  phone?: string;
  sms_opt_out?: boolean;
  sms_opt_out_reason?: string;
  id_card?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
}

export type TenantFormData = TenantCreate;

export interface TenantUpdate {
  name?: string;
  phone?: string;
  sms_opt_out?: boolean;
  sms_opt_out_reason?: string;
  id_card?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
}

export interface TenantListParams {
  search?: string;
}
