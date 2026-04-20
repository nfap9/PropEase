import { useState, useCallback } from 'react';

interface UseManagedItemOptions<T, TAction extends string> {
  onSelect?: (item: T | null) => void;
  onAction?: (action: TAction | null) => void;
}

export function useManagedItem<T, TAction extends string>(
  options: UseManagedItemOptions<T, TAction> = {}
) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [currentAction, setCurrentAction] = useState<TAction | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openAction = useCallback((action: TAction) => {
    setCurrentAction(action);
    setIsOpen(true);
    options.onAction?.(action);
  }, [options]);

  const openFor = useCallback((action: TAction, item: T) => {
    setCurrentAction(action);
    setSelectedItem(item);
    setIsOpen(true);
    options.onSelect?.(item);
    options.onAction?.(action);
  }, [options]);

  const close = useCallback(() => {
    setIsOpen(false);
    setCurrentAction(null);
    setSelectedItem(null);
  }, []);

  const dialogProps = useCallback(
    (action: TAction) => ({
      open: isOpen && currentAction === action,
      onOpenChange: (open: boolean) => {
        if (!open) {
          close();
        }
      },
    }),
    [isOpen, currentAction, close]
  );

  return {
    selectedItem,
    currentAction,
    isOpen,
    openAction,
    openFor,
    close,
    dialogProps,
  };
}
