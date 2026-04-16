
import * as React from 'react';

import { cn } from '../../lib/utils';

export interface PageToolbarProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * 页面工具条。
 *
 * 适用于筛选器、搜索框、按钮组等横向工具集合。
 * 建议搭配 `PageHeader` 或 `PageSection` 使用，统一间距与换行表现。
 */
export function PageToolbar({ className, ...props }: PageToolbarProps) {
  return <div className={cn('flex flex-wrap items-center gap-2 sm:justify-end', className)} {...props} />;
}
