'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from './page-header';

type ListPageMaxWidth = '4xl' | '5xl' | '6xl' | '7xl' | 'full';

const widthClasses: Record<ListPageMaxWidth, string> = {
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-none',
};

export interface ListPageLayoutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 页面标题。 */
  title: React.ReactNode;
  /** 页面描述。 */
  description?: React.ReactNode;
  /** 标题区右侧操作。 */
  actions?: React.ReactNode;
  /** 标题下方工具条。 */
  toolbar?: React.ReactNode;
  /** 页面主体内容。 */
  children: React.ReactNode;
  /** 标题测试 id。 */
  titleTestId?: string;
  /** 页面内容最大宽度。 */
  maxWidth?: ListPageMaxWidth;
  /** 主体内容类名。 */
  contentClassName?: string;
}

/**
 * 列表页组合层。
 *
 * 基于 `PageHeader` 组合出标准列表页结构：
 * 标题区 -> 工具条 -> 主体内容。
 * 适用于管理页、配置页、列表页等典型后台结构。
 */
export function ListPageLayout({
  title,
  description,
  actions,
  toolbar,
  children,
  titleTestId,
  maxWidth = '6xl',
  className,
  contentClassName,
  ...props
}: ListPageLayoutProps) {
  return (
    <div className={cn('mx-auto space-y-6', widthClasses[maxWidth], className)} {...props}>
      <PageHeader title={title} description={description} actions={actions} titleTestId={titleTestId} />
      {toolbar ? <div>{toolbar}</div> : null}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
