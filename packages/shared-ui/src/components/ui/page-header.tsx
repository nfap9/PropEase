
import * as React from 'react';

import { cn } from '../../lib/utils';

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 页面标题。 */
  title: React.ReactNode;
  /** 页面补充说明，当前仅保留兼容，不在标题区展示。 */
  description?: React.ReactNode;
  /** 标题区右侧操作。 */
  actions?: React.ReactNode;
  /** 标题测试 id。 */
  titleTestId?: string;
}

/**
 * 页面标题区。
 *
 * 适用于列表页、管理页和概览页顶部的“标题 + 操作区”结构。
 * 组件只统一排版和视觉节奏，不承载具体业务按钮逻辑。
 */
export function PageHeader({ title, description: _description, actions, className, titleTestId, ...props }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)} {...props}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl" data-testid={titleTestId}>
          {title}
        </h2>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
