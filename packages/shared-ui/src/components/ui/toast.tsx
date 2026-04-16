
import * as React from 'react';
import { Toaster, toast as sonnerToast, type ToasterProps } from 'sonner';

/**
 * 统一的全局消息提示容器。
 * 建议在应用根 Provider 中仅挂载一次。
 */
export function AppToaster(props: ToasterProps) {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-2xl border border-border/70 bg-background/95 shadow-2xl backdrop-blur',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton: 'rounded-lg',
          cancelButton: 'rounded-lg',
        },
      }}
      {...props}
    />
  );
}

export interface AppToastPromiseMessages {
  loading: React.ReactNode;
  success: React.ReactNode | ((data: unknown) => React.ReactNode);
  error: React.ReactNode | ((error: unknown) => React.ReactNode);
}

/**
 * 项目统一的 toast 调用入口。
 * 这样业务代码只依赖一套约定，后续如果需要更换消息实现，不必全项目搜索替换。
 */
export const appToast = {
  success(message: React.ReactNode, description?: React.ReactNode) {
    return sonnerToast.success(message, { description });
  },
  error(message: React.ReactNode, description?: React.ReactNode) {
    return sonnerToast.error(message, { description });
  },
  warning(message: React.ReactNode, description?: React.ReactNode) {
    return sonnerToast.warning(message, { description });
  },
  info(message: React.ReactNode, description?: React.ReactNode) {
    return sonnerToast.info(message, { description });
  },
  loading(message: React.ReactNode, description?: React.ReactNode) {
    return sonnerToast.loading(message, { description });
  },
  dismiss(id?: string | number) {
    sonnerToast.dismiss(id);
  },
  promise<T>(promise: Promise<T>, messages: AppToastPromiseMessages) {
    return sonnerToast.promise(promise, messages);
  },
};

/**
 * 兼容已有 `toast.xxx` 调用风格的别名导出。
 */
export const toast = appToast;
