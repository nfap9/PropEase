'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';
import { Label } from './label';

export interface FilterFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  contentClassName?: string;
  labelClassName?: string;
}

/**
 * 筛选表单项布局容器。
 *
 * 统一筛选区的标签位置、冒号样式和响应式宽度：
 * - 标签固定在左侧
 * - 控件区域自适应伸缩
 * - 适合放在 `DataTable.toolbar` 里组合搜索与筛选
 */
export function FilterField({
  label,
  className,
  contentClassName,
  labelClassName,
  children,
  ...props
}: FilterFieldProps) {
  return (
    <div className={cn('flex w-full min-w-0 max-w-full items-center gap-3 sm:flex-[1_1_320px]', className)} {...props}>
      <Label className={cn('w-[88px] shrink-0 whitespace-nowrap text-xs text-foreground/80 sm:w-24', labelClassName)}>
        {label}:
      </Label>
      <div className={cn('min-w-0 flex-1', contentClassName)}>{children}</div>
    </div>
  );
}
