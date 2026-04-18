import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface CollectionChartProps {
  data: {
    period: string;
    collected: number;
    uncollected: number;
    collection_rate: number;
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

export function CollectionChart({ data }: CollectionChartProps) {
  if (!data.length) return null;

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
              collected: '已收租',
              uncollected: '未收租',
              collection_rate: '收租率',
            };
            return labels[value] ?? value;
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="collected"
          name="collected"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.9}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          yAxisId="left"
          dataKey="uncollected"
          name="uncollected"
          fill="hsl(var(--chart-3))"
          fillOpacity={0.9}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="collection_rate"
          name="collection_rate"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2.5}
          dot={false}
        />
        <ReferenceLine
          y={90}
          yAxisId="right"
          stroke="hsl(var(--success))"
          strokeDasharray="5 5"
          label={{ value: '90%', position: 'right', fontSize: 11, fill: 'hsl(var(--success))' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
