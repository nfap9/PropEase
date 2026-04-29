/** 公寓 */
export interface Apartment {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  description: string | null;
  // 基本信息
  floors: number | null;
  land_area: number | null;
  total_area: number | null;
  // 上游信息
  landlord_name: string | null;
  landlord_contact: string | null;
  contract_start: string | null;
  contract_end: string | null;
  landlord_rent: number | null;
  // 经营成本
  operating_cost: number | null;
  created_at: string;
}

export interface ApartmentCreate {
  name: string;
  address?: string;
  description?: string;
  // 基本信息
  floors?: number;
  land_area?: number;
  total_area?: number;
  // 上游信息
  landlord_name?: string;
  landlord_contact?: string;
  contract_start?: string;
  contract_end?: string;
  landlord_rent?: number;
  // 经营成本
  operating_cost?: number;
}

export interface ApartmentUpdate {
  name?: string;
  address?: string;
  description?: string;
  // 基本信息
  floors?: number;
  land_area?: number;
  total_area?: number;
  // 上游信息
  landlord_name?: string;
  landlord_contact?: string;
  contract_start?: string;
  contract_end?: string;
  landlord_rent?: number;
  // 经营成本
  operating_cost?: number;
}

export type ApartmentFormData = ApartmentCreate;

/** 房间统计 */
export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

/** 带统计的公寓 */
export interface ApartmentWithStats extends Apartment {
  room_stats: RoomStats;
}

/** 房间状态 */
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

/** 家具家电设施项 */
export interface FacilityItem {
  code: string;
  quantity: number;
}

/** 房间设施配置 */
export interface RoomFacilities {
  version: 1;
  furniture: FacilityItem[];
  appliances: FacilityItem[];
}

/** 预设设施定义 */
export interface FacilityPreset {
  code: string;
  label: string;
  category: 'furniture' | 'appliances';
  default_quantity: number;
}

/** 房间 */
export interface Room {
  id: string;
  apartment_id: string;
  room_number: string;
  layout: string | null;
  status: RoomStatus;
  maintenance: boolean;
  area: number | null;
  facilities: RoomFacilities | null;
  notes: string | null;
  apartment?: Apartment;
  pricing?: RoomPricing | null;
  created_at: string;
}

export interface RoomPricing {
  id: string;
  room_id: string;
  monthly_rent: number;
  effective_date: string;
}

export interface RoomCreate {
  room_number: string;
  layout?: string;
  area?: number;
  notes?: string;
  status?: RoomStatus;
  facilities?: RoomFacilities | null;
  monthly_rent?: number;
}

export interface RoomUpdate {
  room_number?: string;
  layout?: string;
  status?: RoomStatus;
  maintenance?: boolean;
  area?: number;
  notes?: string;
  facilities?: RoomFacilities | null;
  monthly_rent?: number;
}

/** 批量创建房间 */
export interface RoomBatchCreate {
  room_numbers: string[];
  layout?: string;
  area?: number;
  notes?: string;
  monthly_rent?: number;
}

/** 公寓配置 */
export interface ApartmentConfig {
  id: string;
  apartment_id: string;
  water_price_per_unit: number | null;
  electricity_price_per_unit: number | null;
  created_at: string;
  updated_at: string;
  fee_items: ApartmentFeeItem[];
}

/** 创建/更新公寓配置 */
export interface ApartmentConfigInput {
  water_price_per_unit?: number;
  electricity_price_per_unit?: number;
}

/** 公寓费用项目 */
export interface ApartmentFeeItem {
  id: string;
  apartment_id: string;
  category: 'fixed' | 'utility' | 'optional';
  name: string;
  amount: number;
  cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 创建公寓费用项目 */
export interface ApartmentFeeItemCreate {
  name: string;
  category: 'fixed' | 'utility' | 'optional';
  amount: number;
  cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
}

/** 更新公寓费用项目 */
export interface ApartmentFeeItemUpdate {
  name?: string;
  category?: 'fixed' | 'utility' | 'optional';
  amount?: number;
  cycle?: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  is_active?: boolean;
  sort_order?: number;
}

/** 复制配置请求 */
export interface CopyConfigInput {
  target_apartment_ids: string[];
  mode: 'overwrite' | 'merge';
  include_utility_prices?: boolean;
  include_fee_items?: boolean;
}

/** 复制配置结果 */
export interface CopyConfigResult {
  applied: string[];
  skipped: string[];
  details: Record<string, { fee_items_created: number; fee_items_updated: number; fee_items_unchanged: number }>;
}

// 兼容别名
export type RoomFormData = RoomCreate;
export type RoomEditFormData = RoomUpdate;
export type RoomEdit = RoomUpdate;
export type RoomBatch = RoomBatchCreate;

