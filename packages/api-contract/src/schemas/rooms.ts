/**
 * 房间表单 schemas
 * 前后端共享，统一校验规则
 */
import { z } from 'zod';
import { RoomFacilitiesSchema } from './apartments.js';

export const RoomCreateSchema = z.object({
  apartment_id: z.string().min(1, '请选择公寓'),
  room_number: z.string().min(1, '请输入房间号'),
  layout: z.string().optional(),
  area: z.number().min(0).optional(),
  notes: z.string().optional(),
  facilities: RoomFacilitiesSchema.nullable().optional(),
  monthly_rent: z.number().min(0).optional(),
});

export const RoomUpdateSchema = z.object({
  room_number: z.string().optional(),
  layout: z.string().optional(),
  maintenance: z.boolean().optional(),
  area: z.number().min(0).optional(),
  notes: z.string().optional(),
  facilities: RoomFacilitiesSchema.nullable().optional(),
  monthly_rent: z.number().min(0).optional(),
});

export const RoomBatchSchema = z.object({
  room_numbers: z.array(z.string()),
  layout: z.string().optional(),
  area: z.number().optional(),
  notes: z.string().optional(),
  monthly_rent: z.number().min(0).optional(),
});

/** 编辑房间表单专用（room_number/monthly_rent 必填） */
export const RoomEditSchema = z.object({
  room_number: z.string().min(1, '请输入房间号'),
  layout: z.string().optional(),
  maintenance: z.boolean().optional(),
  area: z.number().min(0, '面积不能为负').optional(),
  notes: z.string().optional(),
  monthly_rent: z.number().min(0, '租金不能为负'),
});

export type RoomFormData = z.infer<typeof RoomCreateSchema>;
export type RoomEditFormData = z.infer<typeof RoomEditSchema>;
