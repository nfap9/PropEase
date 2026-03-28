'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { EmptyState } from './empty-state';

/**
 * 统一的图表系列配置。
 * 每一项代表一条折线、一个柱状系列或一个图例项。
 */
export interface ChartSeriesConfig {
  /** 数据源中的字段名。 */
  dataKey: string;
  /** 在 tooltip / legend 中展示的名称。 */
  label: string;
  /** 自定义颜色；未传时会自动使用项目的主题色板。 */
  color?: string;
}

interface ChartPayloadItem {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  payload?: Record<string, unknown>;
  value?: number | string | null;
}

export interface ChartContainerProps {
  /** 图表标题。 */
  title: string;
  /** 图表补充说明。 */
  description?: string;
  /** 标题区右侧操作区域。 */
  action?: React.ReactNode;
  /** 图表底部补充内容。 */
  footer?: React.ReactNode;
  /** 图表为空时的提示标题。 */
  emptyTitle?: string;
  /** 图表为空时的提示说明。 */
  emptyDescription?: string;
  /** 图表容器类名。 */
  className?: string;
  /** 图表内容区类名。 */
  contentClassName?: string;
  /** 是否为空状态。 */
  empty?: boolean;
  /** 图表主体。 */
  children: React.ReactNode;
}

const DEFAULT_CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

/**
 * 获取统一图表色板中的颜色，保证不同图表之间的视觉语言一致。
 */
export function getChartColor(index: number): string {
  return DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length];
}

function resolveSeriesConfig(
  series: ChartSeriesConfig[] | undefined,
  item: ChartPayloadItem
): ChartSeriesConfig | undefined {
  if (!series?.length) {
    return undefined;
  }

  return series.find((config) => config.dataKey === item.dataKey || config.dataKey === item.name);
}

/**
 * 统一的图表卡片容器。
 * 用于承载标题、描述、操作区和空状态，避免每个图表都重复拼装一遍 Card 结构。
 */
export function ChartContainer({
  title,
  description,
  action,
  footer,
  empty,
  emptyTitle = '暂无统计数据',
  emptyDescription = '当前筛选条件下还没有可展示的数据，请稍后再试。',
  className,
  contentClassName,
  children,
}: ChartContainerProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-border/60 from-primary/[0.03] flex flex-col gap-4 border-b bg-gradient-to-r to-transparent pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className={cn('p-5 sm:p-6', contentClassName)}>
        {empty ? (
          <EmptyState
            className="border-0 bg-transparent shadow-none"
            icon={<BarChart3 className="h-10 w-10" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          children
        )}
      </CardContent>
      {footer ? <div className="border-border/60 border-t px-5 py-4 sm:px-6">{footer}</div> : null}
    </Card>
  );
}

export interface ChartTooltipContentProps {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string | number;
  series?: ChartSeriesConfig[];
  labelFormatter?: (label: string | number | undefined) => React.ReactNode;
  valueFormatter?: (
    value: number | string | null | undefined,
    config: ChartSeriesConfig | undefined,
    item: ChartPayloadItem
  ) => React.ReactNode;
}

/**
 * 统一的图表 tooltip 内容，保证不同图表的悬浮层排版一致。
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  series,
  labelFormatter,
  valueFormatter,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="border-border/70 bg-background/95 min-w-[180px] rounded-2xl border p-3 shadow-xl backdrop-blur">
      {label !== undefined ? (
        <p className="text-foreground mb-2 text-sm font-semibold">{labelFormatter ? labelFormatter(label) : label}</p>
      ) : null}
      <div className="space-y-2">
        {payload.map((item) => {
          const config = resolveSeriesConfig(series, item);
          const resolvedLabel = config?.label ?? (typeof item.name === 'string' ? item.name : String(item.name ?? ''));
          const resolvedColor = config?.color ?? item.color ?? getChartColor(0);

          return (
            <div key={`${item.dataKey ?? item.name}`} className="flex items-center justify-between gap-4 text-sm">
              <div className="text-muted-foreground flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: resolvedColor }} />
                <span>{resolvedLabel}</span>
              </div>
              <span className="text-foreground font-semibold">
                {valueFormatter ? valueFormatter(item.value, config, item) : (item.value ?? '--')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface ChartLegendContentProps {
  payload?: ChartPayloadItem[];
  series?: ChartSeriesConfig[];
}

/**
 * 统一图例内容，适用于 Recharts 的 `Legend.content` 自定义渲染。
 */
export function ChartLegendContent({ payload, series }: ChartLegendContentProps) {
  if (!payload?.length) {
    return null;
  }

  return (
    <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {payload.map((item, index) => {
        const config = resolveSeriesConfig(series, item);
        const resolvedLabel = config?.label ?? (typeof item.value === 'string' ? item.value : String(item.value ?? ''));
        const resolvedColor = config?.color ?? item.color ?? getChartColor(index);

        return (
          <div key={`${item.dataKey ?? item.value ?? index}`} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: resolvedColor }} />
            <span>{resolvedLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
