import { useState, useCallback } from 'react';
import type { Bill } from '@/types';

export interface BillDialogState {
  // Dialog open states
  isPaymentOpen: boolean;
  isGenerateOpen: boolean;
  isDetailOpen: boolean;

  // Selected items
  selectedBillId: string | null;
  selectedBill: Bill | null;

  // Dialog actions
  openDetailDialog: (billId: string) => void;
  closeDetailDialog: () => void;
  openPaymentDialog: (bill: Bill) => void;
  closePaymentDialog: () => void;
  openGenerateDialog: () => void;
  closeGenerateDialog: () => void;
}

export function useBillDialogState(): BillDialogState {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const closePaymentDialog = useCallback(() => {
    setIsPaymentOpen(false);
    setSelectedBill(null);
  }, []);

  const closeGenerateDialog = useCallback(() => {
    setIsGenerateOpen(false);
  }, []);

  const closeDetailDialog = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedBillId(null);
  }, []);

  const openDetailDialog = useCallback((billId: string) => {
    setSelectedBillId(billId);
    setIsDetailOpen(true);
  }, []);

  const openPaymentDialog = useCallback((bill: Bill) => {
    setSelectedBill(bill);
    setIsPaymentOpen(true);
  }, []);

  const openGenerateDialog = useCallback(() => {
    setIsGenerateOpen(true);
  }, []);

  return {
    isPaymentOpen,
    isGenerateOpen,
    isDetailOpen,
    selectedBillId,
    selectedBill,
    openDetailDialog,
    closeDetailDialog,
    openPaymentDialog,
    closePaymentDialog,
    openGenerateDialog,
    closeGenerateDialog,
  };
}
