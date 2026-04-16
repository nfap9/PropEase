
import * as React from 'react';

import { cn } from '../../lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  isPending?: boolean;
  confirmDisabled?: boolean;
  hideConfirm?: boolean;
  intent?: 'default' | 'destructive';
  contentClassName?: string;
  contentTestId?: string;
  cancelTestId?: string;
  confirmTestId?: string;
}

/**
 * 统一的确认弹层。
 *
 * 仅负责展示确认语义和统一交互，不承载业务请求、权限判断或数据获取逻辑。
 * 业务侧只需要传入文案、打开状态和确认回调，即可快速构建删除、停用、终止等场景。
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = '确认',
  cancelLabel = '取消',
  isPending = false,
  confirmDisabled = false,
  hideConfirm = false,
  intent = 'default',
  contentClassName,
  contentTestId,
  cancelTestId,
  confirmTestId,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={contentClassName} data-testid={contentTestId}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={cancelTestId}>{cancelLabel}</AlertDialogCancel>
          {!hideConfirm ? (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={confirmDisabled || isPending}
              data-testid={confirmTestId}
              className={cn(
                intent === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined
              )}
            >
              {confirmLabel}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
