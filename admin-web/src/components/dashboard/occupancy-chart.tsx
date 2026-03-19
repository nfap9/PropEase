'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { OccupancyReport } from '@apartment-ultra/api-contract';

interface OccupancyChartProps {
  data: OccupancyReport[];
  isLoading?: boolean;
}

function monthFormatter(period: string): string {
  const [, month] = period.split('-');
  return `${month}月`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const month = label ? monthFormatter(label) : '';
  const rate = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{month}</p>
      <p>
        <span className="text-muted-foreground">入住率：</span>
        <span className="font-medium">{rate.toFixed(1)}%</span>
      </p>
    </div>
  );
}

export function OccupancyChart({ data, isLoading }: OccupancyChartProps) {
  if (isLoading || !data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="period"
          tickFormatter={monthFormatter}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="occupancy_rate"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#occupancyGradient)"
        />
        <ReferenceLine
          y={80}
          stroke="var(--color-chart-3)"
          strokeDasharray="5 5"
          label={{ value: '80%预警线', position: 'right', fontSize: 12, fill: 'var(--color-chart-3)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
