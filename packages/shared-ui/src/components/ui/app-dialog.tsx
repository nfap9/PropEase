
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';

type AppDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const dialogSizeClasses: Record<AppDialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[min(96vw,72rem)]',
};

export interface AppDialogProps {
  /** 是否打开，对应受控模式。 */
  open: boolean;
  /** 弹窗开关回调。 */
  onOpenChange: (open: boolean) => void;
  /** 弹窗标题。 */
  title: React.ReactNode;
  /** 弹窗描述。 */
  description?: React.ReactNode;
  /** 对话框主体内容。 */
  children: React.ReactNode;
  /** 底部操作区，例如“取消 / 确认”。 */
  footer?: React.ReactNode;
  /** 弹窗尺寸。 */
  size?: AppDialogSize;
  /** 标题区右侧扩展操作。 */
  headerAction?: React.ReactNode;
  /** 标题区类名。 */
  headerClassName?: string;
  /** 主体内容区类名。 */
  bodyClassName?: string;
  /** 底部区域类名。 */
  footerClassName?: string;
  /** 内容容器类名。 */
  className?: string;
  /** 内容容器测试 id。 */
  contentTestId?: string;
  /** 是否为模态框，默认 `true`。 */
  modal?: boolean;
}

/**
 * 应用级通用对话框。
 * 适合表单编辑、确认信息展示、轻量级业务操作等场景。
 *
 * 设计原则：
 * 1. 只封装结构和样式，不接管业务状态。
 * 2. 通过 `children` / `footer` 组合内容，避免把按钮文案等业务细节写死。
 * 3. 提供合理默认尺寸和滚动体验，减少页面重复样板代码。
 */
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  headerAction,
  headerClassName,
  bodyClassName,
  footerClassName,
  className,
  contentTestId,
  modal = true,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={modal}>
      <DialogContent
        className={cn(
          'border-border/70 bg-background/95 max-h-[calc(100vh-3rem)] overflow-hidden rounded-3xl p-0 shadow-2xl backdrop-blur',
          dialogSizeClasses[size],
          className
        )}
        data-testid={contentTestId}
      >
        <div className="flex max-h-[calc(100vh-3rem)] flex-col">
          <DialogHeader
            className={cn(
              'border-border/60 from-primary/[0.04] gap-3 border-b bg-gradient-to-r to-transparent px-6 py-5 text-left',
              headerClassName
            )}
          >
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="space-y-1">
                <DialogTitle>{title}</DialogTitle>
                {description ? <DialogDescription>{description}</DialogDescription> : null}
              </div>
              {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
            </div>
          </DialogHeader>

          <div className={cn('flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>

          {footer ? (
            <DialogFooter
              className={cn('border-border/60 bg-muted/20 border-t px-6 py-4 sm:space-x-3', footerClassName)}
            >
              {footer}
            </DialogFooter>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
