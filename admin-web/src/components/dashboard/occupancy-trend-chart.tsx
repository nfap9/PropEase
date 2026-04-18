import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface OccupancyTrendChartProps {
  data: {
    period: string;
    occupancy_rate: number;
    vacant_rate: number;
  }[];
  isLoading?: boolean;
}

function monthFormatter(period: string): string {
  const [, month] = period.split('-');
  return `${month}月`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const month = label ? monthFormatter(label) : '';
  const occupancy = payload[0]?.value ?? 0;
  const vacant = 100 - occupancy;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium mb-1">{month}</p>
      <p>
        <span className="text-muted-foreground">入住率：</span>
        <span className="font-medium">{occupancy.toFixed(1)}%</span>
      </p>
      <p>
        <span className="text-muted-foreground">空置率：</span>
        <span className="font-medium">{vacant.toFixed(1)}%</span>
      </p>
    </div>
  );
}

export function OccupancyTrendChart({ data }: OccupancyTrendChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="vacantGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.05} />
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
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          fill="url(#occupancyGradient)"
          name="入住率"
        />
        <Area
          type="monotone"
          dataKey="vacant_rate"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          fill="url(#vacantGradient)"
          name="空置率"
        />
        <ReferenceLine
          y={80}
          stroke="hsl(var(--destructive))"
          strokeDasharray="5 5"
          label={{ value: '80%预警', position: 'right', fontSize: 11, fill: 'hsl(var(--destructive))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
