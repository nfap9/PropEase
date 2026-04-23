/**
 * API 契约类型由 @apartment-ultra/api-contract 提供，此处统一再导出便于 @/types 引用保持不变。
 */
export * from '@apartment-ultra/api-contract';

import type { LucideIcon } from 'lucide-react';
import type { Apartment, Room, RoomFacilities, DashboardOverview, IncomeReport } from '@apartment-ultra/api-contract';

/** 仅前端使用的 API 错误表示（openapi 风格 detail），与 client 中的 ApiError 类区分 */
export interface ApiErrorDetail {
  detail: string;
}

/** 导航项 */
export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  items?: NavItem[];
}

// ============ Domain types (from former schemas/) ============

// --- Bills ---
export interface PaymentFormData {
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'wechat' | 'alipay' | 'bank_transfer' | 'other';
  reference?: string;
  notes?: string;
}

export interface GenerateBillsFormData {
  bill_year: number;
  bill_month: number;
  due_date: string;
}

// --- Leases ---
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

// --- Lease Operations ---
export interface ChangeRoomFormData {
  newRoomId: string;
  changeDate: string;
  reason?: string;
}

export interface RenewFormData {
  newEndDate: string;
  reason?: string;
}

export interface UpdateTenantFormData {
  newTenantId: string;
}

export interface ChangeRentFormData {
  newRent: number;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  reason?: string;
}

export interface ChangeUtilityRatesFormData {
  waterRate: number;
  electricityRate: number;
  effectiveFromYear: number;
  effectiveFromMonth: number;
}

export interface ChangeDepositFormData {
  newDeposit: number;
  reason?: string;
}

export interface FeeItemRow {
  feeTypeId: string;
  specificationId?: string;
  quantity: number;
}

export interface UpdateFeeItemsFormData {
  feeItems: FeeItemRow[];
  effectiveFromYear: number;
  effectiveFromMonth: number;
  reason?: string;
}

export interface SettleLeaseFormData {
  finalWaterReading?: number;
  finalElectricityReading?: number;
  penaltyAmount?: number;
  remarks?: string;
}

// --- Apartment Detail ---
export interface RoomFormData {
  room_number: string;
  layout?: string;
  area?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface RoomBatchConfigData {
  floors: string;
  room_numbers: string;
  notes?: string;
}

export interface BatchEditFormData {
  layout?: string;
  area?: number;
  maintenance?: boolean;
  monthly_rent?: number;
}

// ============ Domain types from utils/ ============

// --- Apartment Detail ---
export interface GeneratedFloorRooms {
  floor: number;
  rooms: string[];
}

export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

export interface FloorRoomGroup {
  floor: number;
  rooms: Room[];
}

// --- Reports ---
export interface IncomeSummary {
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  averageCollectionRate: number;
}

export interface IncomeCategoryDatum {
  name: '租金' | '水费' | '电费' | '其他';
  value: number;
}

// ============ Re-exports (backwards compatibility) ============

// 从本目录重导出 admin-permissions 类型（避免 types/index.ts → constants → types 的循环）
export type { AdminPermissionOption } from './admin-permissions';

// 从 constants/ 重导出（保留 @/types 路径兼容性）
export { ADMIN_PERMISSION_OPTIONS } from '@/constants/admin-permissions';

// 从 utils/ 重导出（保留 @/types 路径兼容性）
export {
  adminPermissionCodesToLabels,
  formatAdminPermissionsForDisplay,
  getAdminPermissionGroups,
} from '@/utils/admin-permissions';
