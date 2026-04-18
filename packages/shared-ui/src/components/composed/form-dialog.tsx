
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from '../shadcn/button';
import { AppDialog, type AppDialogProps } from './app-dialog';

type FormDialogSize = NonNullable<AppDialogProps['size']>;

export interface FormDialogProps {
  /** 是否打开，对应受控模式。 */
  open: boolean;
  /** 弹窗开关回调。 */
  onOpenChange: (open: boolean) => void;
  /** 标题。 */
  title: React.ReactNode;
  /** 描述文案。 */
  description?: React.ReactNode;
  /** 表单字段内容。 */
  children: React.ReactNode;
  /** 表单提交处理。 */
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  /** 外部表单 id，适用于字段与底部按钮分离的场景。 */
  formId?: string;
  /** 提交按钮文案。 */
  submitLabel?: React.ReactNode;
  /** 取消按钮文案。 */
  cancelLabel?: React.ReactNode;
  /** 提交中状态。 */
  isPending?: boolean;
  /** 是否禁用提交按钮。 */
  submitDisabled?: boolean;
  /** 提交按钮风格。 */
  submitVariant?: ButtonProps['variant'];
  /** 取消按钮风格。 */
  cancelVariant?: ButtonProps['variant'];
  /** 取消操作回调，默认关闭弹窗。 */
  onCancel?: () => void;
  /** 对话框尺寸。 */
  size?: FormDialogSize;
  /** 内容容器类名。 */
  className?: string;
  /** 主体区域类名。 */
  bodyClassName?: string;
  /** 表单类名。 */
  formClassName?: string;
  /** 内容测试 id。 */
  contentTestId?: string;
  /** 表单测试 id。 */
  formTestId?: string;
  /** 取消按钮测试 id。 */
  cancelTestId?: string;
  /** 提交按钮测试 id。 */
  submitTestId?: string;
}

/**
 * 表单弹窗场景壳。
 *
 * 适用于“标题 + 表单字段 + 底部取消/提交”的标准业务弹窗。
 * 组件只统一结构、尺寸和按钮交互，不接管表单 schema、字段渲染或 mutation。
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  formId,
  submitLabel = '保存',
  cancelLabel = '取消',
  isPending = false,
  submitDisabled = false,
  submitVariant = 'default',
  cancelVariant = 'outline',
  onCancel,
  size = 'md',
  className,
  bodyClassName,
  formClassName,
  contentTestId,
  formTestId,
  cancelTestId,
  submitTestId,
}: FormDialogProps) {
  const generatedFormId = React.useId();
  const resolvedFormId = formId ?? `form-dialog-${generatedFormId.replace(/:/g, '')}`;

  const handleCancel = () => {
    onCancel?.();
    if (!onCancel) {
      onOpenChange(false);
    }
  };

  const footer = (
    <>
      <Button type="button" variant={cancelVariant} onClick={handleCancel} data-testid={cancelTestId}>
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        variant={submitVariant}
        form={resolvedFormId}
        disabled={submitDisabled || isPending}
        data-testid={submitTestId}
      >
        {submitLabel}
      </Button>
    </>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      className={className}
      contentTestId={contentTestId}
      bodyClassName={cn('py-0', bodyClassName)}
      footer={footer}
    >
      <form
        id={resolvedFormId}
        onSubmit={onSubmit}
        className={cn('space-y-4 py-5', formClassName)}
        data-testid={formTestId}
      >
        {children}
      </form>
    </AppDialog>
  );
}
