import type { DashboardOverview, IncomeReport, IncomeSummary, IncomeCategoryDatum } from '@/types';

export function buildIncomeSummary(incomeReport: IncomeReport[] | undefined): IncomeSummary {
  if (!incomeReport || incomeReport.length === 0) {
    return {
      totalAmount: 0,
      collectedAmount: 0,
      pendingAmount: 0,
      averageCollectionRate: 0,
    };
  }

  const totalAmount = incomeReport.reduce((sum, item) => sum + item.total_amount, 0);
  const collectedAmount = incomeReport.reduce((sum, item) => sum + item.collected_amount, 0);
  const averageCollectionRate =
    incomeReport.reduce((sum, item) => sum + item.collection_rate, 0) / incomeReport.length;

  return {
    totalAmount,
    collectedAmount,
    pendingAmount: totalAmount - collectedAmount,
    averageCollectionRate,
  };
}

export function buildIncomeCategoryData(incomeReport: IncomeReport[] | undefined): IncomeCategoryDatum[] {
  return [
    {
      name: '租金',
      value: incomeReport?.reduce((sum, item) => sum + item.total_rent, 0) || 0,
    },
    {
      name: '水费',
      value: incomeReport?.reduce((sum, item) => sum + item.total_water, 0) || 0,
    },
    {
      name: '电费',
      value: incomeReport?.reduce((sum, item) => sum + item.total_electricity, 0) || 0,
    },
    {
      name: '其他',
      value: incomeReport?.reduce((sum, item) => sum + item.total_other, 0) || 0,
    },
  ];
}

export function getRoomsInOtherStatus(overview: DashboardOverview | undefined) {
  return (
    (overview?.total_rooms || 0) -
    (overview?.occupied_rooms || 0) -
    (overview?.available_rooms || 0)
  );
}
