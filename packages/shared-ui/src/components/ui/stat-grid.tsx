'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';

type StatGridColumns = 2 | 3 | 4 | 6;

const gridClasses: Record<StatGridColumns, string> = {
  2: 'grid gap-4 sm:grid-cols-2',
  3: 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3',
  4: 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
  6: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

export interface StatGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 每行指标卡列数配置。 */
  columns?: StatGridColumns;
}

/**
 * 指标卡网格容器。
 *
 * 适用于 dashboard、列表页顶部 KPI、设置页摘要统计等场景，
 * 统一指标区的响应式列数和间距。
 */
export function StatGrid({ columns = 4, className, ...props }: StatGridProps) {
  return <div className={cn(gridClasses[columns], className)} {...props} />;
}
