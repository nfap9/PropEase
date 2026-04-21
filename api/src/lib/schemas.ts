/**
 * 共享的 Zod Schemas
 * 
 * 注意：这些 schemas 用于运行时验证
 * OpenAPI 文档定义在 swagger.ts 中，手动保持同步
 */
import { z } from 'zod';

// ==================== Common ====================

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ==================== Auth ====================

export const LoginCredentialsSchema = z.object({
  phone: z.string().describe('中国大陆手机号'),
  password: z.string().describe('密码（与验证码二选一）'),
  verification_code: z.string().describe('短信验证码（与密码二选一）').optional(),
});

export const RegisterDataSchema = z.object({
  phone: z.string().describe('中国大陆手机号'),
  password: z.string().describe('密码（至少8位，包含字母和数字）'),
  full_name: z.string().describe('用户姓名'),
  verification_code: z.string().describe('短信验证码'),
});

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default('Bearer'),
});

// ==================== Apartment ====================

export const ApartmentCreateSchema = z.object({
  name: z.string().min(1, '请输入公寓名称'),
  address: z.string().min(1, '请输入公寓地址'),
  description: z.string().optional(),
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  landlord_name: z.string().optional(),
  landlord_contact: z.string().optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().optional(),
});

export const ApartmentUpdateSchema = ApartmentCreateSchema.partial();

// ==================== Room ====================

export const RoomCreateSchema = z.object({
  room_number: z.string().min(1, '请输入房间号'),
  floor: z.number().int().optional(),
  area: z.number().optional(),
  layout: z.string().optional(),
  monthly_rent: z.number().min(0),
  notes: z.string().optional(),
  facilities: z.array(z.string()).optional(),
});

export const RoomUpdateSchema = RoomCreateSchema.partial();

// ==================== Tenant ====================

export const TenantCreateSchema = z.object({
  name: z.string().min(1, '请输入租客姓名'),
  phone: z.string().min(1, '请输入手机号'),
  id_card_number: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
});

export const TenantUpdateSchema = TenantCreateSchema.partial();

// ==================== Lease ====================

export const LeaseCreateSchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  tenant_id: z.string().min(1, '请选择租客'),
  start_date: z.string().min(1, '请选择起租日期'),
  end_date: z.string().min(1, '请选择结束日期'),
  billing_day: z.number().int().min(1).max(28).default(1),
  monthly_rent: z.number().min(0),
  deposit: z.number().min(0),
  water_rate: z.number().min(0).optional(),
  electricity_rate: z.number().min(0).optional(),
  notes: z.string().optional(),
  fee_items: z.array(z.object({
    fee_type_id: z.string().optional(),
    fee_name: z.string(),
    fee_amount: z.number(),
    fee_cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']),
    quantity: z.number().optional(),
    notes: z.string().optional(),
  })).optional(),
});

// ==================== Bill ====================

export const GenerateBillsSchema = z.object({
  bill_year: z.number().int().min(2020),
  bill_month: z.number().int().min(1).max(12),
  due_date: z.string().min(1, '请选择到期日'),
  lease_ids: z.array(z.string()).optional(),
});

export const BillCreateSchema = z.object({
  lease_id: z.string().min(1, '请选择租约'),
  bill_year: z.number().int().min(2020),
  bill_month: z.number().int().min(1).max(12),
  due_date: z.string().min(1, '请选择到期日'),
  rent_amount: z.number().optional(),
  water_amount: z.number().optional(),
  electricity_amount: z.number().optional(),
  other_amount: z.number().optional(),
  total_amount: z.number(),
  notes: z.string().optional(),
});

export const BillUpdateSchema = z.object({
  rent_amount: z.number().optional(),
  water_amount: z.number().optional(),
  electricity_amount: z.number().optional(),
  other_amount: z.number().optional(),
  total_amount: z.number().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'partial', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export const BillPaymentSchema = z.object({
  amount: z.number().min(0.01, '金额必须大于0'),
  payment_date: z.string().min(1, '请选择付款日期'),
  payment_method: z.enum(['wechat', 'alipay', 'bank_transfer', 'cash', 'other']).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const BillQuerySchema = z.object({
  lease_id: z.string().optional(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'partial', 'cancelled', 'reversed']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const BillExportSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue', 'partial', 'cancelled', 'reversed', 'all']).optional(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  exportType: z.enum(['all', 'unfinished']).optional(),
});

// ==================== Utility ====================

export const UtilityCreateSchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  period_year: z.number().int().min(2020),
  period_month: z.number().int().min(1).max(12),
  reading_date: z.string().min(1, '请选择读数日期'),
  water_reading: z.number().optional(),
  electricity_reading: z.number().optional(),
  water_previous: z.number().optional(),
  electricity_previous: z.number().optional(),
  reading_context: z.enum(['normal', 'initial', 'meter_reset']).default('normal'),
  anomaly_reason: z.string().optional(),
  notes: z.string().optional(),
});

export const UtilityUpdateSchema = UtilityCreateSchema.partial();

export const UtilityQuerySchema = z.object({
  room_id: z.string().optional(),
  apartment_id: z.string().optional(),
  period_year: z.number().int().optional(),
  period_month: z.number().int().min(1).max(12).optional(),
});

export const UtilityExportSchema = z.object({
  period_year: z.number().int().optional(),
  period_month: z.number().int().optional(),
  days_range: z.number().int().optional(),
});

// ==================== Notification ====================

export const NotificationQuerySchema = z.object({
  status: z.enum(['unread', 'all']).optional(),
  category: z.enum(['lease', 'billing', 'tenant', 'system', 'all']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ==================== Organization ====================

export const OrganizationCreateSchema = z.object({
  name: z.string().min(1, '请输入团队名称'),
  slug: z.string().optional(),
});

export const OrganizationUpdateSchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});
