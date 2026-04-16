
import * as React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
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

type LineChartDataItem = Record<string, number | string | null | undefined>;
type CurveType = 'basis' | 'bump' | 'linear' | 'monotone' | 'natural' | 'step';

export interface LineChartProps<TData extends LineChartDataItem> {
  /** 卡片标题。 */
  title: string;
  /** 卡片说明。 */
  description?: string;
  /** 图表数据。 */
  data: TData[];
  /** X 轴字段。 */
  xKey: keyof TData & string;
  /** 折线系列定义。 */
  series: ChartSeriesConfig[];
  /** 图表高度。 */
  height?: number;
  /** 曲线类型。 */
  curveType?: CurveType;
  /** 是否显示图例。 */
  showLegend?: boolean;
  /** 是否显示网格线。 */
  showGrid?: boolean;
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
 * 通用折线图组件。
 * 适合展示时间序列变化、趋势对比、连续统计指标等场景。
 */
export function LineChart<TData extends LineChartDataItem>({
  title,
  description,
  data,
  xKey,
  series,
  height = 320,
  curveType = 'monotone',
  showLegend = true,
  showGrid = true,
  xAxisFormatter,
  yAxisFormatter = (value) => value.toLocaleString('zh-CN'),
  valueFormatter = (value) => value.toLocaleString('zh-CN'),
  className,
  emptyTitle,
  emptyDescription,
}: LineChartProps<TData>) {
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
          <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {showGrid ? <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} /> : null}
            <XAxis
              dataKey={xKey}
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
              <Line
                key={item.dataKey}
                type={curveType}
                dataKey={item.dataKey}
                name={item.label}
                stroke={item.color ?? getChartColor(index)}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
