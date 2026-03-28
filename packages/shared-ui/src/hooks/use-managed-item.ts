import * as React from 'react';
import { useDisclosure } from './use-disclosure';
import { useSelection } from './use-selection';

/**
 * 可直接传给受控弹窗组件的 props 结构。
 */
export interface ManagedDialogProps {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}

/**
 * “当前操作项 + 当前动作弹窗”组合状态的返回结构。
 *
 * 这是一个组合型 hook，用来把列表页里常见的：
 * - `selectedItem`
 * - `isCreateOpen / isEditOpen / isDeleteOpen`
 * - `openEdit(item) / closeDialog()`
 *
 * 收敛成统一模式。
 */
export interface UseManagedItemResult<TItem, TAction extends string> {
  activeAction: TAction | null;
  selectedItem: TItem | null;
  openAction: (action: TAction) => void;
  openFor: (action: TAction, item: TItem) => void;
  close: () => void;
  clearSelection: () => void;
  isOpen: (action: TAction) => boolean;
  dialogProps: (action: TAction) => ManagedDialogProps;
}

/**
 * 管理“当前选中项 + 当前打开动作”的组合状态。
 *
 * 最适合列表页面中的 CRUD 弹窗场景，例如：
 * - 创建：只打开弹窗，不依赖选中项
 * - 编辑：需要先选中某条记录，再打开编辑弹窗
 * - 删除：需要先选中某条记录，再打开删除确认弹窗
 * - 重置密码、查看详情、发放权益等同类动作
 *
 * 设计目标：
 * - 统一管理 `selectedItem`
 * - 避免页面里堆叠多组 `useState`
 * - 给多个弹窗统一生成 `open/onOpenChange`
 *
 * @typeParam TItem 当前被操作的数据类型
 * @typeParam TAction 动作名称联合类型，例如 `'create' | 'edit' | 'delete'`
 * @returns 当前动作、当前选中项，以及一组可直接复用的方法
 *
 * @example
 * ```tsx
 * type UserDialogAction = 'create' | 'edit' | 'delete';
 *
 * const dialogState = useManagedItem<AdminUser, UserDialogAction>();
 *
 * <Button onClick={() => dialogState.openAction('create')}>新建</Button>
 *
 * <EditUserDialog
 *   {...dialogState.dialogProps('edit')}
 *   user={dialogState.selectedItem}
 * />
 * ```
 */
export function useManagedItem<TItem, TAction extends string>(): UseManagedItemResult<TItem, TAction> {
  const { isOpen, open, close: closeDisclosure } = useDisclosure(false);
  const { selected, select, clear } = useSelection<TItem>();
  const [activeAction, setActiveAction] = React.useState<TAction | null>(null);

  /**
   * 关闭当前动作弹层，并清空动作与选中项。
   */
  const close = () => {
    closeDisclosure();
    setActiveAction(null);
    clear();
  };

  /**
   * 打开一个不依赖选中项的动作，例如“create”。
   */
  const openAction = (action: TAction) => {
    clear();
    setActiveAction(action);
    open();
  };

  /**
   * 为某个对象打开动作，例如“edit(user)” 或 “delete(plan)”。
   */
  const openFor = (action: TAction, item: TItem) => {
    select(item);
    setActiveAction(action);
    open();
  };

  /**
   * 判断指定动作当前是否处于打开状态。
   */
  const isActionOpen = (action: TAction) => isOpen && activeAction === action;

  /**
   * 生成适配 `Dialog / Sheet / AlertDialog` 这类受控组件的 props。
   */
  const dialogProps = (action: TAction): ManagedDialogProps => ({
    open: isActionOpen(action),
    onOpenChange: (nextOpen) => {
      if (nextOpen) {
        setActiveAction(action);
        open();
        return;
      }

      close();
    },
  });

  return {
    activeAction,
    selectedItem: selected,
    openAction,
    openFor,
    close,
    clearSelection: clear,
    isOpen: isActionOpen,
    dialogProps,
  };
}
