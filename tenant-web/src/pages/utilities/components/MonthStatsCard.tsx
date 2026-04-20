import { Droplets, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import type { PendingUtilityBillRow } from '@/types/utilities';

interface MonthStatsCardProps {
  recordedCount: number;
  totalCount: number;
  missingCount: number;
  readyToBillCount: number;
  overdueCount: number;
}

export function MonthStatsCard({
  recordedCount,
  totalCount,
  missingCount,
  readyToBillCount,
  overdueCount,
}: MonthStatsCardProps) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <StatItem
        icon={<Droplets className="h-4 w-4 text-blue-500" />}
        label="本月录入进度"
        value={`${recordedCount}/${totalCount}`}
      />
      <StatItem
        icon={<Clock className="h-4 w-4 text-orange-500" />}
        label="待录入"
        value={missingCount}
        suffix="房间"
      />
      <StatItem
        icon={<TrendingUp className="h-4 w-4 text-green-500" />}
        label="待出账"
        value={readyToBillCount}
        suffix="笔"
      />
      <StatItem
        icon={<AlertCircle className="h-4 w-4 text-red-500" />}
        label="录入逾期"
        value={overdueCount}
        suffix="房间"
      />
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-lg font-bold text-gray-900">{value}</span>
      {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
    </div>
  );
}

export function useMonthStats(bills: PendingUtilityBillRow[]) {
  return {
    readyToBillCount: bills.filter((b) => b.status === 'ready_to_bill').length,
    overdueCount: bills.filter((b) => b.status === 'input_overdue').length,
  };
}