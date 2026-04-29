import { useState, useCallback } from 'react';

interface UseConfirmActionOptions<T> {
  onConfirm?: (item: T) => void;
}

export function useConfirmAction<T>(
  options: UseConfirmActionOptions<T> = {}
) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openFor = useCallback((item: T) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
  }, []);

  const confirm = useCallback(() => {
    if (selectedItem) {
      options.onConfirm?.(selectedItem);
    }
    close();
  }, [selectedItem, options, close]);

  const dialogProps = {
    open: isOpen,
    onOpenChange: (open: boolean) => {
      if (!open) {
        close();
      }
    },
  };

  return {
    selectedItem,
    openFor,
    close,
    confirm,
    dialogProps,
  };
}
