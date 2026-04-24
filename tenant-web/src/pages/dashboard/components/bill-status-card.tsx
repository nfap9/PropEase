import { Card } from 'antd';
import { Receipt } from 'lucide-react';
import { useBillStatusCard } from '@/pages/dashboard/hooks/dashboard-bill-status';
import { tenantMessages } from '@/i18n';

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`;
}

function BillStatusCard({ orgId }: { orgId: string }) {
  const { stats, currentYear, currentMonth, isLoading } = useBillStatusCard(orgId);

  if (isLoading) {
    return (
      <Card
        className="flex h-full min-h-0 flex-col"
        styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <div className="shrink-0 pb-2">
          <h3 className="text-sm sm:text-base">{tenantMessages.dashboard.billStatus.title}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">加载中...</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="flex h-full min-h-0 flex-col"
      styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      <div className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base">{tenantMessages.dashboard.billStatus.title}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {currentYear}年{currentMonth}月
            </p>
          </div>
          <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden space-y-2 pt-0 sm:space-y-3">
        {/* Bill counts */}
        <div className="flex gap-2 sm:gap-4">
          <div className="flex-1 text-center">
            <p className="text-lg sm:text-xl font-semibold text-amber-600">{stats.pending.length}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {tenantMessages.dashboard.billStatus.pending}
            </p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg sm:text-xl font-semibold text-blue-600">{stats.billed.length}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {tenantMessages.dashboard.billStatus.billed}
            </p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg sm:text-xl font-semibold text-emerald-600">{stats.settled.length}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {tenantMessages.dashboard.billStatus.settled}
            </p>
          </div>
        </div>

        {/* Financial stats */}
        <div className="space-y-1 border-t pt-2 sm:pt-3 sm:space-y-1.5">
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">{tenantMessages.dashboard.billStatus.billedAmount}</span>
            <span className="font-medium">{formatCurrency(stats.billedAmount)}</span>
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">{tenantMessages.dashboard.billStatus.collectedAmount}</span>
            <span className="font-medium text-emerald-600">{formatCurrency(stats.collectedAmount)}</span>
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">{tenantMessages.dashboard.billStatus.estimatedTotal}</span>
            <span className="font-medium">{formatCurrency(stats.estimatedTotal)}</span>
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">{tenantMessages.dashboard.billStatus.upstreamCost}</span>
            <span className="font-medium text-rose-600">{formatCurrency(stats.upstreamCost)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { BillStatusCard };
