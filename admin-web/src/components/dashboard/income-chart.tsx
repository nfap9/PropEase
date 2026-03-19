'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { IncomeReport } from '@apartment-ultra/api-contract';

interface IncomeChartProps {
  data: IncomeReport[];
  isLoading?: boolean;
}

function monthFormatter(period: string): string {
  const [year, month] = period.split('-');
  return `${month}月`;
}

function currencyFormatter(value: number): string {
  return `¥${value.toLocaleString()}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const month = label ? monthFormatter(label) : '';
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-2">{month}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-medium">
            {entry.name === '收租率'
              ? `${entry.value.toFixed(1)}%`
              : `¥${entry.value.toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IncomeChart({ data, isLoading }: IncomeChartProps) {
  if (isLoading || !data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="period"
          tickFormatter={monthFormatter}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={currencyFormatter}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => {
            const labels: Record<string, string> = {
              collected_amount: '收租',
              uncollected: '未收',
              collection_rate: '收租率',
            };
            return labels[value] ?? value;
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="collected_amount"
          name="collected_amount"
          fill="var(--chart-1)"
          fillOpacity={0.9}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Bar
          yAxisId="left"
          dataKey="uncollected"
          name="uncollected"
          fill="var(--chart-3)"
          fillOpacity={0.9}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="collection_rate"
          name="collection_rate"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
