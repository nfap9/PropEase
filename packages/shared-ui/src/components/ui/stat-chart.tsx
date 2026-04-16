
import * as React from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  type ChartSeriesConfig,
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  getChartColor,
} from './chart';

type StatChartDataItem = Record<string, number | string | null | undefined>;

export interface StatChartProps<TData extends StatChartDataItem> {
  /** 卡片标题。 */
  title: string;
  /** 卡片说明。 */
  description?: string;
  /** 图表数据。 */
  data: TData[];
  /** 分类字段。 */
  xKey: keyof TData & string;
  /** 柱状系列。 */
  series: ChartSeriesConfig[];
  /** 图表高度。 */
  height?: number;
  /** 是否堆叠显示。 */
  stacked?: boolean;
  /** 是否显示图例。 */
  showLegend?: boolean;
  /** X 轴格式化。 */
  xAxisFormatter?: (value: TData[keyof TData]) => string;
  /** Y 轴格式化。 */
  yAxisFormatter?: (value: number) => string;
  /** tooltip 数值格式化。 */
  valueFormatter?: (value: number, series: ChartSeriesConfig) => string;
  /** 卡片类名。 */
  className?: string;
  /** 空状态标题。 */
  emptyTitle?: string;
  /** 空状态描述。 */
  emptyDescription?: string;
}

/**
 * 通用统计图组件。
 * 当前默认实现为柱状统计图，适合对比不同分类、不同时间段的指标量级。
 */
export function StatChart<TData extends StatChartDataItem>({
  title,
  description,
  data,
  xKey,
  series,
  height = 320,
  stacked = false,
  showLegend = true,
  xAxisFormatter,
  yAxisFormatter = (value) => value.toLocaleString('zh-CN'),
  valueFormatter = (value) => value.toLocaleString('zh-CN'),
  className,
  emptyTitle,
  emptyDescription,
}: StatChartProps<TData>) {
  return (
    <ChartContainer
      title={title}
      description={description}
      empty={data.length === 0}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      className={className}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={10}>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey={xKey as string}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tickFormatter={(value: string | number) =>
                xAxisFormatter ? xAxisFormatter(value as TData[keyof TData]) : String(value ?? '')
              }
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tickFormatter={(value: string | number) => yAxisFormatter(Number(value))}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  series={series}
                  valueFormatter={(value, config) =>
                    typeof value === 'number' && config ? valueFormatter(value, config) : String(value ?? '--')
                  }
                />
              }
            />
            {showLegend ? <Legend content={<ChartLegendContent series={series} />} /> : null}
            {series.map((item, index) => (
              <Bar
                key={item.dataKey}
                dataKey={item.dataKey}
                name={item.label}
                fill={item.color ?? getChartColor(index)}
                radius={[10, 10, 0, 0]}
                stackId={stacked ? 'stat-stack' : undefined}
                maxBarSize={46}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
