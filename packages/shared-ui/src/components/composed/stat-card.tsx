import * as React from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shadcn/card';

type StatTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type StatDirection = 'up' | 'down' | 'neutral';
type StatFormat = 'number' | 'currency' | 'percent' | 'text';

const toneClasses: Record<StatTone, string> = {
  default: 'from-primary/8 to-transparent text-foreground',
  primary: 'from-primary/12 to-transparent text-primary',
  success: 'from-success/12 to-transparent text-[hsl(var(--success))]',
  warning: 'from-warning/12 to-transparent text-[hsl(var(--warning))]',
  danger: 'from-destructive/12 to-transparent text-destructive',
};

export interface StatCardTrend {
  /** 趋势值，可直接传数字或已格式化文案。 */
  value: number | string;
  /** 趋势方向，用于控制图标和颜色语义。 */
  direction?: StatDirection;
  /** 趋势的补充说明，例如“较上月”。 */
  label?: string;
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 指标标题。 */
  title: string;
  /** 指标值。 */
  value: number | string;
  /** 指标说明。 */
  description?: string;
  /** 左上角图标。 */
  icon?: React.ReactNode;
  /** 数值格式化方式。 */
  format?: StatFormat | ((value: number | string) => string);
  /** 货币符号，`format=currency` 时生效。 */
  currencySymbol?: string;
  /** 小数位数。 */
  precision?: number;
  /** 趋势信息。 */
  trend?: StatCardTrend;
  /** 卡片色调。 */
  tone?: StatTone;
}

function formatStatValue(
  value: number | string,
  format: StatCardProps['format'],
  currencySymbol: string,
  precision: number
): string {
  if (typeof format === 'function') {
    return format(value);
  }

  if (typeof value === 'string' || format === 'text') {
    return String(value);
  }

  switch (format) {
    case 'currency':
      return `${currencySymbol}${value.toLocaleString('zh-CN', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })}`;
    case 'percent':
      return `${value.toLocaleString('zh-CN', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })}%`;
    case 'number':
    default:
      return value.toLocaleString('zh-CN', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
  }
}

function getTrendMeta(direction: StatDirection | undefined) {
  switch (direction) {
    case 'up':
      return {
        icon: ArrowUpRight,
        className: 'text-[hsl(var(--success))] bg-[hsl(var(--success))/0.12]',
      };
    case 'down':
      return {
        icon: ArrowDownRight,
        className: 'text-destructive bg-destructive/10',
      };
    case 'neutral':
    default:
      return {
        icon: ArrowRight,
        className: 'text-muted-foreground bg-muted',
      };
  }
}

/**
 * 统一统计卡片。
 * 适用于首页概览、数据看板、列表顶部 KPI 等常见统计信息展示。
 */
export function StatCard({
  title,
  value,
  description,
  icon,
  format = 'number',
  currencySymbol = '¥',
  precision = 0,
  trend,
  tone = 'default',
  className,
  ...props
}: StatCardProps) {
  const trendMeta = getTrendMeta(trend?.direction);
  const TrendIcon = trendMeta.icon;

  return (
    <Card className={cn('relative overflow-hidden', className)} {...props}>
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br', toneClasses[tone])} />
      <CardHeader className="relative flex flex-row items-start justify-between gap-4 pb-3">
        <div className="space-y-1">
          <CardDescription className="text-muted-foreground text-sm font-medium">{title}</CardDescription>
          {description ? (
            <CardTitle className="text-muted-foreground text-sm font-normal">{description}</CardTitle>
          ) : null}
        </div>
        {icon ? (
          <div className="border-border/60 bg-background/80 text-primary flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm">
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="relative flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="text-foreground text-3xl font-semibold tracking-tight">
            {formatStatValue(value, format, currencySymbol, precision)}
          </div>
          {trend ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium',
                  trendMeta.className
                )}
              >
                <TrendIcon className="h-4 w-4" />
                {trend.value}
              </span>
              {trend.label ? <span className="text-muted-foreground">{trend.label}</span> : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
