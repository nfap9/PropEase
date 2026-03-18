/**
 * 升级差价（proration）计算
 * 公式：新服务月价×剩余月数 - 旧服务月价×剩余天数/周期总天数
 */
export function calculateUpgradeProration(
  newPlanPriceMonthly: number,
  oldPlanPriceMonthly: number,
  remainingDays: number,
  totalDaysInCycle: number
): number {
  if (remainingDays <= 0 || totalDaysInCycle <= 0) return 0;
  const remainingMonths = remainingDays / 30;
  const credit = oldPlanPriceMonthly * (remainingDays / totalDaysInCycle);
  const charge = newPlanPriceMonthly * remainingMonths;
  return Math.max(0, Math.round((charge - credit) * 100) / 100);
}
