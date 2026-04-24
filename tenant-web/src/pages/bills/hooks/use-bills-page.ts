import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Bill, BillStatus } from '@/types';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { useBillsData, useBillShare } from '@/hooks/use-bills';
import { buildBillStats, filterBillsByStatus } from '@/utils/bills';

export interface BillsPageState {
  statusFilter: BillStatus | 'all';
  setStatusFilter: (v: BillStatus | 'all') => void;
  isPaymentOpen: boolean;
  isGenerateOpen: boolean;
  isDetailOpen: boolean;
  selectedBillId: string | null;
  selectedBill: Bill | null;
  canGenerateBill: boolean;
  canEditBill: boolean;
  sharingBillId: string | null;
  handleViewDetail: (bill: Bill) => void;
  handlePayment: (bill: Bill) => void;
  handlePaymentFromDetail: () => void;
  handleGenerate: () => void;
  handleExport: (type: 'all' | 'unfinished') => void;
  openPaymentDialog: (bill: Bill) => void;
  closePaymentDialog: () => void;
  openGenerateDialog: () => void;
  closeGenerateDialog: () => void;
  openDetailDialog: (billId: string) => void;
  closeDetailDialog: () => void;
  bills: Bill[];
  billsLoading: boolean;
  filteredBills: Bill[];
  stats: ReturnType<typeof buildBillStats>;
  billDetail: ReturnType<typeof useBillsData>['billDetail'];
  billDetailLoading: boolean;
  billFeeItems: ReturnType<typeof useBillsData>['billFeeItems'];
  feeItemsLoading: boolean;
  exportPdf: ReturnType<typeof useBillsData>['exportPdf'];
  exportExcel: ReturnType<typeof useBillsData>['exportExcel'];
  handleShareBill: ReturnType<typeof useBillShare>['handleShareBill'];
  paymentMutation: ReturnType<typeof useBillsData>['paymentMutation'];
  generateMutation: ReturnType<typeof useBillsData>['generateMutation'];
}

export function useBillsPage(): BillsPageState {
  const { organization } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const canGenerateBill = hasPermission(PERMISSIONS.BILL_CREATE);
  const canEditBill = hasPermission(PERMISSIONS.BILL_EDIT);

  const { sharingBillId, handleShareBill } = useBillShare(organization?.name);

  const closePaymentDialog = useCallback(() => {
    setIsPaymentOpen(false);
    setSelectedBill(null);
  }, []);

  const closeGenerateDialog = useCallback(() => {
    setIsGenerateOpen(false);
  }, []);

  const handleGenerateSuccess = useCallback((created: number, skipped: number) => {
    closeGenerateDialog();
    toast.success(`出账完成：新增 ${created} 笔，跳过 ${skipped} 笔`);
  }, [closeGenerateDialog]);

  const closeDetailDialog = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedBillId(null);
  }, []);

  const {
    bills = [],
    billsLoading,
    billDetail,
    billDetailLoading,
    billFeeItems,
    feeItemsLoading,
    paymentMutation,
    generateMutation,
    exportPdf,
    exportExcel,
  } = useBillsData({
    selectedBillId,
    isDetailOpen,
    onPaymentSuccess: closePaymentDialog,
    onGenerateSuccess: handleGenerateSuccess,
  });

  const filteredBills = useMemo(
    () => filterBillsByStatus(bills, statusFilter),
    [bills, statusFilter]
  );
  const stats = useMemo(() => buildBillStats(bills), [bills]);

  const handleViewDetail = useCallback((bill: Bill) => {
    setSelectedBillId(bill.id);
    setIsDetailOpen(true);
  }, []);

  const openPaymentDialog = useCallback((bill: Bill) => {
    setSelectedBill(bill);
    setIsPaymentOpen(true);
  }, []);

  const handlePayment = useCallback((bill: Bill) => {
    openPaymentDialog(bill);
  }, [openPaymentDialog]);

  const handlePaymentFromDetail = useCallback(() => {
    if (billDetail) {
      openPaymentDialog(billDetail);
      closeDetailDialog();
    }
  }, [billDetail, openPaymentDialog, closeDetailDialog]);

  const handleGenerate = useCallback(() => {
    setIsGenerateOpen(true);
  }, []);

  const handleExport = useCallback((type: 'all' | 'unfinished') => {
    exportExcel(type, statusFilter);
  }, [exportExcel, statusFilter]);

  return {
    statusFilter,
    setStatusFilter,
    isPaymentOpen,
    isGenerateOpen,
    isDetailOpen,
    selectedBillId,
    selectedBill,
    canGenerateBill,
    canEditBill,
    sharingBillId,
    handleViewDetail,
    handlePayment,
    handlePaymentFromDetail,
    handleGenerate,
    handleExport,
    openPaymentDialog,
    closePaymentDialog,
    openGenerateDialog: handleGenerate,
    closeGenerateDialog,
    openDetailDialog: (billId: string) => {
      setSelectedBillId(billId);
      setIsDetailOpen(true);
    },
    closeDetailDialog,
    bills,
    billsLoading,
    filteredBills,
    stats,
    billDetail,
    billDetailLoading,
    billFeeItems,
    feeItemsLoading,
    exportPdf,
    exportExcel,
    handleShareBill,
    paymentMutation,
    generateMutation,
  };
}
