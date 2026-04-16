
import * as React from 'react';
import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { ChartContainer, ChartLegendContent, ChartTooltipContent, getChartColor } from './chart';

export interface PieChartDatum {
  /** 图例名称。 */
  name: string;
  /** 数值。 */
  value: number;
  /** 自定义颜色。 */
  color?: string;
}

export interface PieChartProps {
  /** 卡片标题。 */
  title: string;
  /** 卡片说明。 */
  description?: string;
  /** 饼图数据。 */
  data: PieChartDatum[];
  /** 图表高度。 */
  height?: number;
  /** 是否显示图例。 */
  showLegend?: boolean;
  /** 中心区域主标题。 */
  centerLabel?: React.ReactNode;
  /** 中心区域副标题。 */
  centerSubLabel?: React.ReactNode;
  /** 数值格式化。 */
  valueFormatter?: (value: number) => string;
  /** 空状态标题。 */
  emptyTitle?: string;
  /** 空状态描述。 */
  emptyDescription?: string;
  /** 卡片类名。 */
  className?: string;
}

/**
 * 通用饼图组件。
 * 适合占比分析、分类分布、状态结构等“总量由若干部分构成”的场景。
 */
export function PieChart({
  title,
  description,
  data,
  height = 320,
  showLegend = true,
  centerLabel,
  centerSubLabel,
  valueFormatter = (value) => value.toLocaleString('zh-CN'),
  emptyTitle,
  emptyDescription,
  className,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

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
          <RechartsPieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <Tooltip
              content={
                <ChartTooltipContent
                  valueFormatter={(value) =>
                    typeof value === 'number' ? valueFormatter(value) : String(value ?? '--')
                  }
                />
              }
            />
            {showLegend ? <Legend content={<ChartLegendContent />} /> : null}
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={78}
              outerRadius={112}
              paddingAngle={3}
              stroke="hsl(var(--background))"
              strokeWidth={4}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={entry.color ?? getChartColor(index)} />
              ))}
            </Pie>
            {centerLabel ? (
              <text
                x="50%"
                y="46%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-[20px] font-semibold"
              >
                {centerLabel}
              </text>
            ) : null}
            {(centerSubLabel ?? total) ? (
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[12px]"
              >
                {centerSubLabel ?? `总计 ${valueFormatter(total)}`}
              </text>
            ) : null}
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
