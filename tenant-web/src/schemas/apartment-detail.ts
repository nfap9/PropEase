import type { RoomStatus } from '@/types';
import type { ApartmentFormData } from '@apartment-ultra/api-contract';
import type { ApartmentCreate as apartmentSchema } from '@apartment-ultra/api-contract';

export type { ApartmentFormData, apartmentSchema };

// 房间表单
export interface RoomFormData {
  room_number: string;
  layout?: string;
  area?: number;
  notes?: string;
  [key: string]: unknown;
}

// 批量创建配置
export interface RoomBatchConfigData {
  floors: string;
  room_numbers: string;
  notes?: string;
}

// 批量编辑
export interface BatchEditFormData {
  layout?: string;
  area?: number;
  maintenance?: boolean;
  monthly_rent?: number;
}

export const LAYOUT_OPTIONS = [
  '单间',
  '一室一厅',
  '两室一厅',
  '三室一厅',
  '三室两厅',
  '四室两厅',
  '复式',
  'Loft',
] as const;

export const STATUS_BORDER_COLORS: Record<RoomStatus, string> = {
  available: 'border-green-500',
  occupied: 'border-blue-500',
  maintenance: 'border-orange-500',
};

export const apartmentFormDefaultValues: ApartmentFormData = {
  name: '',
  address: '',
  description: '',
  floors: undefined,
  land_area: undefined,
  total_area: undefined,
  landlord_name: '',
  landlord_contact: '',
  contract_start: '',
  contract_end: '',
  landlord_rent: 0,
};
