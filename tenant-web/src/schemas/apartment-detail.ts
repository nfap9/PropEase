import { z } from 'zod';
import type { RoomStatus } from '@/types';
import { apartmentSchema, type ApartmentFormData } from '@/components/apartments';

export { apartmentSchema, type ApartmentFormData };

export const roomSchema = z.object({
  room_number: z.string().min(1, '请输入房间号'),
  layout: z.string().optional(),
  area: z.number().min(0, '面积不能为负').optional(),
  notes: z.string().optional(),
});

export type RoomFormData = z.infer<typeof roomSchema>;

export const roomBatchConfigSchema = z.object({
  floors: z.string().min(1, '请输入楼层'),
  room_numbers: z.string().min(1, '请输入房间号'),
  notes: z.string().optional(),
});

export type RoomBatchConfigData = z.infer<typeof roomBatchConfigSchema>;

export const batchEditSchema = z.object({
  layout: z.string().optional(),
  area: z.number().min(0, '面积不能为负').optional(),
  maintenance: z.boolean().optional(),
  monthly_rent: z.number().min(0, '租金不能为负').optional(),
});

export type BatchEditFormData = z.infer<typeof batchEditSchema>;

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

