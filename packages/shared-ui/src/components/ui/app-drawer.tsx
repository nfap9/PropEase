
import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';

import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from './sheet';

type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

const drawerSizeClasses: Record<DrawerSide, Record<DrawerSize, string>> = {
  left: {
    sm: 'w-full sm:max-w-md',
    md: 'w-full sm:max-w-xl',
    lg: 'w-full sm:max-w-2xl',
    xl: 'w-full sm:max-w-4xl',
    full: 'w-full sm:max-w-none',
  },
  right: {
    sm: 'w-full sm:max-w-md',
    md: 'w-full sm:max-w-xl',
    lg: 'w-full sm:max-w-2xl',
    xl: 'w-full sm:max-w-4xl',
    full: 'w-full sm:max-w-none',
  },
  top: {
    sm: 'h-[40vh]',
    md: 'h-[55vh]',
    lg: 'h-[70vh]',
    xl: 'h-[82vh]',
    full: 'h-screen',
  },
  bottom: {
    sm: 'h-[40vh]',
    md: 'h-[55vh]',
    lg: 'h-[70vh]',
    xl: 'h-[82vh]',
    full: 'h-screen',
  },
};

export interface AppDrawerProps {
  /** 是否打开，对应受控模式。 */
  open: boolean;
  /** 抽屉开关回调。 */
  onOpenChange: (open: boolean) => void;
  /** 抽屉标题。 */
  title: React.ReactNode;
  /** 抽屉补充说明。 */
  description?: React.ReactNode;
  /** 抽屉内容。 */
  children: React.ReactNode;
  /** 抽屉底部操作区。 */
  footer?: React.ReactNode;
  /** 抽屉打开方向，默认从右侧滑入。 */
  side?: DrawerSide;
  /** 抽屉尺寸。 */
  size?: DrawerSize;
  /** 标题区右侧操作内容。 */
  headerAction?: React.ReactNode;
  /** 容器类名。 */
  className?: string;
  /** 内容容器测试 id。 */
  contentTestId?: string;
  /** 内容区类名。 */
  bodyClassName?: string;
  /** 标题区类名。 */
  headerClassName?: string;
  /** 底部操作区类名。 */
  footerClassName?: string;
  /** 是否为模态抽屉，默认 `true`。 */
  modal?: boolean;
}

/**
 * 应用级通用抽屉。
 * 适合需要较大编辑空间、分步信息录入、侧边详情查看等场景。
 *
 * 与基础 `Sheet` 的区别：
 * 1. 内置统一头部、内容区、底部结构；
 * 2. 默认开启粘性头尾和内容滚动；
 * 3. 统一了尺寸、留白和视觉样式，减少页面重复实现。
 */
export function AppDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'lg',
  headerAction,
  className,
  contentTestId,
  bodyClassName,
  headerClassName,
  footerClassName,
  modal = true,
}: AppDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={modal}>
      <SheetContent
        side={side}
        className={cn(
          'border-border/70 bg-background/95 flex h-screen flex-col overflow-hidden p-0 shadow-2xl backdrop-blur',
          drawerSizeClasses[side][size],
          className
        )}
        data-testid={contentTestId}
      >
        <SheetHeader
          className={cn(
            'border-border/60 from-primary/[0.05] sticky top-0 z-10 gap-3 border-b bg-gradient-to-r to-transparent px-6 py-5 text-left',
            headerClassName
          )}
        >
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="space-y-1">
              <SheetTitle>{title}</SheetTitle>
              {description ? <SheetDescription>{description}</SheetDescription> : null}
            </div>
            {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
          </div>
        </SheetHeader>

        <div className={cn('scrollbar-subtle flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>

        {footer ? (
          <SheetFooter
            className={cn(
              'border-border/60 bg-background/95 sticky bottom-0 z-10 border-t px-6 py-4 sm:space-x-3',
              footerClassName
            )}
          >
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/**
 * 兼容旧用法的别名组件。
 * 推荐新代码优先使用 `AppDrawer`，旧业务可以继续沿用 `CommonDrawer` 的 API。
 */
export interface CommonDrawerCompatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  className?: string;
}

export function CommonDrawer({
  open,
  onOpenChange,
  header,
  footer,
  children,
  width,
  className,
}: CommonDrawerCompatProps) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'border-border/70 bg-background/95 flex h-screen flex-col overflow-hidden p-0 shadow-2xl backdrop-blur',
          width ?? drawerSizeClasses.right.lg,
          className
        )}
      >
        {header ? (
          <div className="border-border/60 bg-background/95 sticky top-0 z-10 border-b px-6 py-4">{header}</div>
        ) : null}
        <div className="scrollbar-subtle flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="border-border/60 bg-background/95 sticky bottom-0 z-10 border-t px-6 py-4">{footer}</div>
        ) : null}
      </SheetContent>
    </SheetPrimitive.Root>
  );
}
