import * as React from 'react';

export interface UseAsyncDialogSubmitOptions<TArgs extends unknown[] = []> {
  /** 提交成功后关闭弹层。 */
  close?: () => void;
  /** 提交成功后重置表单或局部状态。 */
  reset?: () => void;
  /** 提交成功后清理选中项或上下文。 */
  clear?: () => void;
  /** 额外成功回调，适合提示文案或联动刷新。 */
  afterSuccess?: (...args: TArgs) => void;
}

export interface UseAsyncDialogSubmitResult<TArgs extends unknown[] = []> {
  /** 可直接用作 mutation `onSuccess` 的统一收尾回调。 */
  handleSuccess: (...args: TArgs) => void;
}

/**
 * 管理异步弹层提交成功后的统一收尾逻辑。
 *
 * 适用于新增、编辑、邀请、支付、生成等表单或确认弹层场景，把常见的：
 * - 关闭弹层
 * - 重置表单
 * - 清空选中项
 * - 追加成功提示
 *
 * 收敛为一个稳定回调，避免页面里重复拼接 `onSuccess` 流程。
 *
 * 这个 hook 不负责：
 * - 发起 mutation
 * - 错误处理
 * - 成功提示文案本身
 *
 * @typeParam TArgs mutation 成功回调透传的参数元组
 *
 * @example
 * ```tsx
 * const inviteSubmit = useAsyncDialogSubmit({
 *   close: () => setIsInviteOpen(false),
 *   reset: () => inviteForm.reset(),
 * });
 *
 * const inviteMutation = useMutation({
 *   mutationFn: inviteMember,
 *   onSuccess: inviteSubmit.handleSuccess,
 * });
 * ```
 */
export function useAsyncDialogSubmit<TArgs extends unknown[] = []>({
  close,
  reset,
  clear,
  afterSuccess,
}: UseAsyncDialogSubmitOptions<TArgs>): UseAsyncDialogSubmitResult<TArgs> {
  const handleSuccess = React.useCallback(
    (...args: TArgs) => {
      close?.();
      reset?.();
      clear?.();
      afterSuccess?.(...args);
    },
    [afterSuccess, clear, close, reset]
  );

  return {
    handleSuccess,
  };
}
