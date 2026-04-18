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
}

export interface RoomUpdate {
  room_number?: string;
  layout?: string;
  status?: RoomStatus;
  area?: number;
  notes?: string;
  facilities?: RoomFacilities | null;
}

/** 批量创建房间 */
export interface RoomBatchCreate {
  room_numbers: string[];
  layout?: string;
  area?: number;
  notes?: string;
}

/** 水电配置 */
export interface UtilityConfig {
  id: string;
  apartment_id: string;
  water_price_per_unit: number | null;
  electricity_price_per_unit: number | null;
  internet_fee: number | null;
  management_fee: number | null;
  service_fee: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** 创建水电配置 */
export interface UtilityConfigCreate {
  water_price_per_unit?: number;
  electricity_price_per_unit?: number;
  internet_fee?: number;
  management_fee?: number;
  service_fee?: number;
  notes?: string;
}

/** 更新水电配置 */
export interface UtilityConfigUpdate {
  water_price_per_unit?: number;
  electricity_price_per_unit?: number;
  internet_fee?: number;
  management_fee?: number;
  service_fee?: number;
  notes?: string;
}
