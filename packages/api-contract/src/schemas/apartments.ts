/**
 * 公寓表单 schemas
 * 前后端共享，统一校验规则
 */
import { z } from 'zod';

export const FacilityItemSchema = z.object({
  code: z.string(),
  quantity: z.number().int().min(1),
});

export const RoomFacilitiesSchema = z.object({
  version: z.literal(1),
  furniture: z.array(FacilityItemSchema),
  appliances: z.array(FacilityItemSchema),
});

export const ApartmentCreateSchema = z.object({
  name: z.string().min(1, '请输入公寓名称'),
  address: z.string().min(1, '请输入公寓地址'),
  description: z.string().optional(),
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  // 上游信息
  landlord_name: z.string().min(1, '请输入房东姓名'),
  landlord_contact: z.string().optional(),
  contract_start: z.string().min(1, '请选择合同开始时间'),
  contract_end: z.string().min(1, '请选择合同结束时间'),
  landlord_rent: z.number().min(0, '请输入房东租金'),
  operating_cost: z.number().min(0).optional(),
});

export const ApartmentUpdateSchema = ApartmentCreateSchema.partial();

export type ApartmentFormData = z.infer<typeof ApartmentCreateSchema>;
