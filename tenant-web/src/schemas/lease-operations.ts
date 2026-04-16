import { z } from 'zod';

// 换房
export const changeRoomSchema = z.object({
  newRoomId: z.string().min(1, '请选择目标房间'),
  changeDate: z.string().min(1, '请选择变更日期'),
  reason: z.string().optional(),
});
export type ChangeRoomFormData = z.infer<typeof changeRoomSchema>;

// 续约
export const renewSchema = z.object({
  newEndDate: z.string().min(1, '请选择新结束日期'),
  reason: z.string().optional(),
});
export type RenewFormData = z.infer<typeof renewSchema>;

// 编辑租客
export const updateTenantSchema = z.object({
  newTenantId: z.string().min(1, '请选择新租客'),
});
export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;

// 房租变更
export const changeRentSchema = z.object({
  newRent: z.coerce.number().min(0, '月租不能为负'),
  effectiveFromYear: z.coerce.number().min(2020),
  effectiveFromMonth: z.coerce.number().min(1).max(12),
  reason: z.string().optional(),
});
export type ChangeRentFormData = z.infer<typeof changeRentSchema>;

// 水电单价变更
export const changeUtilityRatesSchema = z.object({
  waterRate: z.coerce.number().min(0, '水价不能为负'),
  electricityRate: z.coerce.number().min(0, '电价不能为负'),
  effectiveFromYear: z.coerce.number().min(2020),
  effectiveFromMonth: z.coerce.number().min(1).max(12),
});
export type ChangeUtilityRatesFormData = z.infer<typeof changeUtilityRatesSchema>;

// 押金变更
export const changeDepositSchema = z.object({
  newDeposit: z.coerce.number().min(0, '押金不能为负'),
  reason: z.string().optional(),
});
export type ChangeDepositFormData = z.infer<typeof changeDepositSchema>;

// 编辑费用项目
export const feeItemRowSchema = z.object({
  feeTypeId: z.string().min(1, '请选择费用类型'),
  specificationId: z.string().optional(),
  quantity: z.coerce.number().min(1, '数量至少为1'),
});

export const updateFeeItemsSchema = z.object({
  feeItems: z.array(feeItemRowSchema).min(1, '至少添加一个费用项目'),
  effectiveFromYear: z.coerce.number().min(2020),
  effectiveFromMonth: z.coerce.number().min(1).max(12),
  reason: z.string().optional(),
});
export type UpdateFeeItemsFormData = z.infer<typeof updateFeeItemsSchema>;

// 退租结算
export const settleLeaseSchema = z.object({
  finalWaterReading: z.coerce.number().min(0).optional(),
  finalElectricityReading: z.coerce.number().min(0).optional(),
  penaltyAmount: z.coerce.number().min(0).optional(),
  remarks: z.string().optional(),
});
export type SettleLeaseFormData = z.infer<typeof settleLeaseSchema>;
