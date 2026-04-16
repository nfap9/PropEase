
import * as React from 'react';

import { cn } from '../../lib/utils';

export interface SplitSettingsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 左侧选择列表或导航区域。 */
  sidebar: React.ReactNode;
  /** 左侧栏宽度类名。 */
  sidebarWidthClassName?: string;
  /** 左侧栏额外类名。 */
  sidebarClassName?: string;
  /** 右侧内容区额外类名。 */
  contentClassName?: string;
  /** 左侧区域测试标识。 */
  sidebarTestId?: string;
  /** 右侧区域测试标识。 */
  contentTestId?: string;
}

/**
 * 左右分栏的设置页骨架。
 *
 * 适用于权限管理、角色管理、配置中心等“左侧选择，右侧编辑/详情”的页面。
 * 组件只提供统一布局与视觉边界，不负责列表数据和右侧业务内容。
 */
export function SplitSettingsPanel({
  sidebar,
  sidebarWidthClassName = 'w-56',
  sidebarClassName,
  contentClassName,
  sidebarTestId,
  contentTestId,
  className,
  children,
  ...props
}: SplitSettingsPanelProps) {
  return (
    <div className={cn('bg-card flex min-h-[400px] overflow-hidden rounded-lg border', className)} {...props}>
      <aside className={cn('shrink-0', sidebarWidthClassName, sidebarClassName)} data-testid={sidebarTestId}>
        {sidebar}
      </aside>
      <main className={cn('flex min-w-0 flex-1 flex-col', contentClassName)} data-testid={contentTestId}>
        {children}
      </main>
    </div>
  );
}
