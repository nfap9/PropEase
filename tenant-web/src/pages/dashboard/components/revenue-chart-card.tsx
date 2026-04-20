import { useQuery } from '@tanstack/react-query';
import { Card } from 'antd';
import { BookDown } from 'lucide-react';
import { reportsApi } from '@/api/reports';

function RevenueChartCard({ orgId }: { orgId: string }) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const { data: incomeData = [], isLoading } = useQuery({
    queryKey: ['income-year', orgId, currentYear],
    queryFn: () => reportsApi.getIncome(currentYear),
    enabled: !!orgId,
  });

  // Fill in missing months with 0
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const chartData = months.map((month, index) => {
    const monthData = incomeData.find((d) => d.period === `${currentYear}-${String(index + 1).padStart(2, '0')}`);
    return {
      month,
      amount: monthData?.total_amount || 0,
      collected: monthData?.collected_amount || 0,
    };
  });

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);

  if (isLoading) {
    return (
      <Card className="flex h-full min-h-0 flex-col" styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}>
        <div className="shrink-0 pb-2">
          <h3 className="text-sm sm:text-base">{currentYear}年营收</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">加载中...</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col" styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}>
      <div className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base">{currentYear}年营收</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">近一年每月营收统计</p>
          </div>
          <BookDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </div>
      <div className="flex h-full min-h-0 flex-col overflow-hidden pt-0">
        <div className="flex flex-1 items-end gap-px sm:gap-1 min-h-[60px]">
          {chartData.map((data, index) => {
            const heightPercent = (data.amount / maxAmount) * 100;
            const collectedHeightPercent = (data.collected / maxAmount) * 100;
            const isCurrentMonth = index === now.getMonth();
            return (
              <div key={data.month} className="group relative flex flex-1 flex-col items-center gap-0.5">
                <div className="flex w-full flex-1 items-end justify-center gap-px sm:gap-0.5">
                  {/* Total amount bar */}
                  <div
                    className={`w-2 sm:w-3 rounded-t transition-all ${isCurrentMonth ? 'bg-primary' : 'bg-primary/40'}`}
                    style={{ height: `${heightPercent}%`, minHeight: data.amount > 0 ? '3px' : '0' }}
                  />
                  {/* Collected amount bar */}
                  <div
                    className="w-2 sm:w-3 rounded-t bg-emerald-400"
                    style={{ height: `${collectedHeightPercent}%`, minHeight: data.collected > 0 ? '3px' : '0' }}
                  />
                </div>
                <span className={`text-[8px] sm:text-[10px] ${isCurrentMonth ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  {data.month.replace('月', '')}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-1 sm:mt-3 flex items-center justify-center gap-3 sm:gap-6 text-[9px] sm:text-xs">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
            <span className="text-muted-foreground">应收</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 sm:h-2 sm:w-2" />
            <span className="text-muted-foreground">实收</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { RevenueChartCard };
