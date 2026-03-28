import * as React from 'react';
import { useDisclosure } from './use-disclosure';
import { useSelection } from './use-selection';

/**
 * 可直接传给确认类弹层组件的 props 结构。
 */
export interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}

/**
 * “确认动作 + 当前目标项”状态的返回结构。
 *
 * 适用于删除、停用、终止、移除成员等需要先选中目标再确认的场景。
 */
export interface UseConfirmActionResult<TItem> {
  selectedItem: TItem | null;
  isOpen: boolean;
  openFor: (item: TItem) => void;
  close: () => void;
  clearSelection: () => void;
  setOpen: (nextOpen: boolean) => void;
  dialogProps: ConfirmActionDialogProps;
}

/**
 * 管理“确认弹层 + 当前目标项”状态。
 *
 * 这个 hook 只负责 UI 交互层，不负责：
 * - 删除/停用等异步逻辑
 * - 成功/失败提示
 * - 接口调用
 *
 * 设计目标：
 * - 统一 `selectedItem + isConfirmOpen` 这一类重复状态
 * - 提供 `openFor / close / dialogProps` 这组语义化 API
 * - 让 `ConfirmDialog` 这类组件接入更直接
 *
 * @typeParam TItem 当前待确认操作的对象类型
 * @returns 当前目标项、打开状态以及一组控制方法
 *
 * @example
 * ```tsx
 * const deleteConfirm = useConfirmAction<User>();
 *
 * <Button onClick={() => deleteConfirm.openFor(user)}>删除</Button>
 *
 * <ConfirmDialog
 *   {...deleteConfirm.dialogProps}
 *   onConfirm={() => api.delete(deleteConfirm.selectedItem!.id)}
 * />
 * ```
 */
export function useConfirmAction<TItem>(): UseConfirmActionResult<TItem> {
  const disclosure = useDisclosure(false);
  const selection = useSelection<TItem>();

  const close = React.useCallback(() => {
    disclosure.close();
    selection.clear();
  }, [disclosure, selection]);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        disclosure.open();
        return;
      }

      close();
    },
    [close, disclosure]
  );

  const openFor = React.useCallback(
    (item: TItem) => {
      selection.select(item);
      disclosure.open();
    },
    [disclosure, selection]
  );

  return {
    selectedItem: selection.selected,
    isOpen: disclosure.isOpen,
    openFor,
    close,
    clearSelection: selection.clear,
    setOpen,
    dialogProps: {
      open: disclosure.isOpen,
      onOpenChange: setOpen,
    },
  };
}
