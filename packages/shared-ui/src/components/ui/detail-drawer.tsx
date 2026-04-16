
import * as React from 'react';

import { AppDrawer, type AppDrawerProps } from './app-drawer';

type DetailDrawerSize = Extract<NonNullable<AppDrawerProps['size']>, 'sm' | 'md' | 'lg' | 'xl'>;

export interface DetailDrawerProps {
  /** 是否打开，对应受控模式。 */
  open: boolean;
  /** 抽屉开关回调。 */
  onOpenChange: (open: boolean) => void;
  /** 抽屉标题。 */
  title: React.ReactNode;
  /** 抽屉说明。 */
  description?: React.ReactNode;
  /** 详情主体。 */
  children: React.ReactNode;
  /** 底部操作区。 */
  footer?: React.ReactNode;
  /** 标题区右侧操作。 */
  headerAction?: React.ReactNode;
  /** 抽屉尺寸。 */
  size?: DetailDrawerSize;
  /** 内容容器类名。 */
  className?: string;
  /** 内容容器测试 id。 */
  contentTestId?: string;
  /** 主体类名。 */
  bodyClassName?: string;
}

/**
 * 详情抽屉场景壳。
 *
 * 适用于信息查看、侧边详情与轻量操作组合的场景。
 * 推荐将数据获取、加载状态与操作按钮逻辑保留在业务侧，只把展示壳统一到共享层。
 */
export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  headerAction,
  size = 'sm',
  className,
  contentTestId,
  bodyClassName,
}: DetailDrawerProps) {
  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      headerAction={headerAction}
      size={size}
      className={className}
      contentTestId={contentTestId}
      bodyClassName={bodyClassName}
    >
      {children}
    </AppDrawer>
  );
}
