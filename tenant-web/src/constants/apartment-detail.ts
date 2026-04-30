import type { ApartmentFormData } from '@propease/api-contract';
import type { RoomStatus } from '@/types';

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
