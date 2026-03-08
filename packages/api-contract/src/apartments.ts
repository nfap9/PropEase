/** 公寓 */
export interface Apartment {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  description: string | null;
  created_at: string;
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
  monthly_rent: number;
  area: number | null;
  facilities: RoomFacilities | null;
  notes: string | null;
  apartment?: Apartment;
  created_at: string;
}

/** 批量创建房间 */
export interface RoomBatchCreate {
  room_numbers: string[];
  layout?: string;
  monthly_rent: number;
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
  effective_from: string;
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
  effective_from: string;
  notes?: string;
}

/** 更新水电配置 */
export interface UtilityConfigUpdate {
  water_price_per_unit?: number;
  electricity_price_per_unit?: number;
  internet_fee?: number;
  management_fee?: number;
  service_fee?: number;
  effective_from?: string;
  notes?: string;
}
