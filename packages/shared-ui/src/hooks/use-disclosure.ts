import * as React from 'react';

/**
 * 通用开关状态的返回结构。
 *
 * 适用于 Dialog、Drawer、Popover、Sheet 以及任何简单的布尔开关场景。
 */
export interface UseDisclosureResult {
  isOpen: boolean;
  setOpen: (nextOpen: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * 管理一个布尔开关状态。
 *
 * 适用场景：
 * - 控制弹窗、抽屉、气泡层是否打开
 * - 控制“展开/收起”“显示/隐藏”之类的 UI 状态
 *
 * 相比直接写 `useState(false)`，这个 hook 统一提供了 `open / close / toggle`
 * 这类语义化操作，能减少重复代码并提升可读性。
 *
 * @param defaultOpen 初始是否为打开状态，默认 `false`
 * @returns 当前开关状态及常用控制方法
 *
 * @example
 * ```tsx
 * const dialog = useDisclosure();
 *
 * <Button onClick={dialog.open}>打开弹窗</Button>
 * <Dialog open={dialog.isOpen} onOpenChange={dialog.setOpen} />
 * ```
 */
export function useDisclosure(defaultOpen = false): UseDisclosureResult {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return {
    isOpen,
    setOpen: setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((current) => !current),
  };
}
