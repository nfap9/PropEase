import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface RevenueBreakdownChartProps {
  data: {
    period: string;
    rent: number;
    water: number;
    electricity: number;
    other: number;
  }[];
  isLoading?: boolean;
}

function monthFormatter(period: string): string {
  const [, month] = period.split('-');
  return `${month}月`;
}

function currencyFormatter(value: number): string {
  return `¥${value.toLocaleString()}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const month = label ? monthFormatter(label) : '';
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-2">{month}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-medium">¥{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueBreakdownChart({ data }: RevenueBreakdownChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <XAxis
          dataKey="period"
          tickFormatter={monthFormatter}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={currencyFormatter}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => {
            const labels: Record<string, string> = {
              rent: '房租',
              water: '水费',
              electricity: '电费',
              other: '其他',
            };
            return labels[value] ?? value;
          }}
        />
        <Bar
          dataKey="rent"
          name="rent"
          fill="hsl(var(--chart-1))"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Bar
          dataKey="water"
          name="water"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Bar
          dataKey="electricity"
          name="electricity"
          fill="hsl(var(--chart-3))"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Bar
          dataKey="other"
          name="other"
          fill="hsl(var(--chart-4))"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
