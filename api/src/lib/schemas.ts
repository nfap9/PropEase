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

// ==================== Organization ====================

export const OrganizationCreateSchema = z.object({
  name: z.string().min(1, '请输入团队名称'),
  slug: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const OrganizationUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
  notes: z.string().max(1000).optional(),
});

export const ConfirmDeleteSchema = z.object({
  confirmed_name: z.string().min(1),
});

// ==================== Apartment ====================

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
  landlord_name: z.string().max(100).optional(),
  landlord_contact: z.string().max(50).optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().optional(),
  operating_cost: z.number().min(0).optional(),
});

export const ApartmentUpdateSchema = ApartmentCreateSchema.partial();

// ==================== Room ====================

export const RoomCreateSchema = z.object({
  apartment_id: z.string().min(1, '请选择公寓'),
  room_number: z.string().min(1, '请输入房间号'),
  layout: z.string().optional(),
  area: z.number().optional(),
  notes: z.string().optional(),
  facilities: RoomFacilitiesSchema.nullable().optional(),
  monthly_rent: z.number().min(0).optional(),
});

export const RoomUpdateSchema = z.object({
  room_number: z.string().optional(),
  layout: z.string().optional(),
  maintenance: z.boolean().optional(),
  area: z.number().optional(),
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

// Lease operation schemas
export const LeaseChangeRoomSchema = z.object({
  new_roomId: z.string(),
  changeDate: z.string(),
  reason: z.string().optional(),
});

export const LeaseRenewSchema = z.object({
  newEndDate: z.string(),
  reason: z.string().optional(),
});

export const LeaseUpdateTenantSchema = z.object({
  newTenantId: z.string(),
});

export const LeaseChangeRentSchema = z.object({
  newRent: z.number(),
  effectiveFromYear: z.number(),
  effectiveFromMonth: z.number(),
  reason: z.string().optional(),
});

export const LeaseChangeUtilityRatesSchema = z.object({
  waterRate: z.number(),
  electricityRate: z.number(),
  effectiveFromYear: z.number(),
  effectiveFromMonth: z.number(),
});

export const LeaseChangeDepositSchema = z.object({
  newDeposit: z.number(),
  reason: z.string().optional(),
});

export const LeaseUpdateFeeItemsSchema = z.object({
  feeItems: z.array(z.object({
    fee_type_id: z.string(),
    specification_id: z.string().optional(),
    quantity: z.number(),
  })),
  effectiveFromYear: z.number(),
  effectiveFromMonth: z.number(),
});

export const LeaseSetFeeItemsSchema = z.object({
  feeItems: z.array(z.object({
    fee_type_id: z.string().optional(),
    fee_name: z.string(),
    fee_amount: z.number(),
    fee_cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']).default('monthly'),
    quantity: z.number().optional().default(1),
    notes: z.string().optional(),
  })),
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

export const BatchReadingSchema = z.object({
  period_year: z.number(),
  period_month: z.number(),
  reading_date: z.string(),
  readings: z.array(z.object({
    room_id: z.string(),
    water_reading: z.number().optional(),
    electricity_reading: z.number().optional(),
    notes: z.string().optional(),
  })),
});

// Alias for backward compatibility
export const ReadingCreateSchema = UtilityCreateSchema;
export const ReadingUpdateSchema = UtilityUpdateSchema;

// ==================== Utility Config ====================

export const UtilityConfigSchema = z.object({
  water_price_per_unit: z.number().min(0).optional(),
  electricity_price_per_unit: z.number().min(0).optional(),
  internet_fee: z.number().min(0).optional(),
  management_fee: z.number().min(0).optional(),
  service_fee: z.number().min(0).optional(),
  cleaning_fee: z.number().min(0).optional(),
});

// ==================== Apartment Config ====================

export const ApartmentConfigSchema = z.object({
  water_price_per_unit: z.number().min(0).optional(),
  electricity_price_per_unit: z.number().min(0).optional(),
});

export const ApartmentFeeItemCreateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['fixed', 'utility', 'optional']),
  amount: z.number().min(0),
  cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']),
});

export const ApartmentFeeItemUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['fixed', 'utility', 'optional']).optional(),
  amount: z.number().min(0).optional(),
  cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
});

export const CopyConfigSchema = z.object({
  target_apartment_ids: z.array(z.string().min(1)).min(1),
  mode: z.enum(['overwrite', 'merge']),
  include_utility_prices: z.boolean().default(true),
  include_fee_items: z.boolean().default(true),
});

// ==================== Notification ====================

export const NotificationQuerySchema = z.object({
  status: z.enum(['unread', 'all']).optional(),
  category: z.enum(['lease', 'billing', 'tenant', 'system', 'all']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ==================== Subscription ====================

export const CreateOrderSchema = z.object({
  service_id: z.string(),
  billing_months: z.number().int().min(1).max(36).optional().default(1),
});

export const PreviewOrderSchema = z.object({
  service_id: z.string(),
  billing_months: z.number().int().min(1).max(36).optional().default(1),
});

// ==================== Report ====================

export const IncomeQuerySchema = z.object({
  year: z.number().optional(),
  start_month: z.number().optional(),
  end_month: z.number().optional(),
});
