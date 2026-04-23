// 换房
export interface ChangeRoomFormData {
  newRoomId: string;
  changeDate: string;
  reason?: string;
}

// 续约
export interface RenewFormData {
  newEndDate: string;
  reason?: string;
}

// 编辑租客
export interface UpdateTenantFormData {
  newTenantId: string;
}

// 房租变更
export interface ChangeRentFormData {
  newRent: number;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  reason?: string;
}

// 水电单价变更
export interface ChangeUtilityRatesFormData {
  waterRate: number;
  electricityRate: number;
  effectiveFromYear: number;
  effectiveFromMonth: number;
}

// 押金变更
export interface ChangeDepositFormData {
  newDeposit: number;
  reason?: string;
}

// 编辑费用项目
export interface FeeItemRow {
  feeTypeId: string;
  specificationId?: string;
  quantity: number;
}

export interface UpdateFeeItemsFormData {
  feeItems: FeeItemRow[];
  effectiveFromYear: number;
  effectiveFromMonth: number;
  reason?: string;
}

// 退租结算
export interface SettleLeaseFormData {
  finalWaterReading?: number;
  finalElectricityReading?: number;
  penaltyAmount?: number;
  remarks?: string;
}
