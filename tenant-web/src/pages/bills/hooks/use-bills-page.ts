import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Bill, BillStatus } from '@/types';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { useBillsData, useBillShare } from '@/pages/bills/hooks/use-bills';
import { buildBillStats, filterBillsByStatus } from '@/utils/bills';
import { useBillFilters } from './use-bill-filters';
import { useBillDialogState } from './use-bill-dialog-state';

export interface BillsPageState {
  // Data
  bills: Bill[];
  billsLoading: boolean;
  filteredBills: Bill[];
  stats: ReturnType<typeof buildBillStats>;

  // Bill detail
  billDetail: ReturnType<typeof useBillsData>['billDetail'];
  billDetailLoading: boolean;
  billFeeItems: ReturnType<typeof useBillsData>['billFeeItems'];
  feeItemsLoading: boolean;

  // Mutations
  exportPdf: ReturnType<typeof useBillsData>['exportPdf'];
  exportExcel: ReturnType<typeof useBillsData>['exportExcel'];
  handleShareBill: ReturnType<typeof useBillShare>['handleShareBill'];
  paymentMutation: ReturnType<typeof useBillsData>['paymentMutation'];
  generateMutation: ReturnType<typeof useBillsData>['generateMutation'];

  // Permissions
  canGenerateBill: boolean;
  canEditBill: boolean;

  // Sharing
  sharingBillId: string | null;

  // Filters
  statusFilter: BillStatus | 'all';
  setStatusFilter: (v: BillStatus | 'all') => void;

  // Dialog state
  isPaymentOpen: boolean;
  isGenerateOpen: boolean;
  isDetailOpen: boolean;
  selectedBillId: string | null;
  selectedBill: Bill | null;

  // Dialog actions
  handleViewDetail: (bill: Bill) => void;
  handlePayment: (bill: Bill) => void;
  handlePaymentFromDetail: () => void;
  handleGenerate: () => void;
  handleExport: (type: 'all' | 'unfinished') => void;
  openDetailDialog: (billId: string) => void;
  closeDetailDialog: () => void;
  openPaymentDialog: (bill: Bill) => void;
  closePaymentDialog: () => void;
  openGenerateDialog: () => void;
  closeGenerateDialog: () => void;
}

export function useBillsPage(): BillsPageState {
  const { organization } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  const filters = useBillFilters();
  const dialogs = useBillDialogState();

  const canGenerateBill = hasPermission(PERMISSIONS.BILL_CREATE);
  const canEditBill = hasPermission(PERMISSIONS.BILL_EDIT);

  const { sharingBillId, handleShareBill } = useBillShare(organization?.name);

  const handleGenerateSuccess = useCallback((created: number, skipped: number) => {
    dialogs.closeGenerateDialog();
    toast.success(`出账完成：新增 ${created} 笔，跳过 ${skipped} 笔`);
  }, [dialogs]);

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
    selectedBillId: dialogs.selectedBillId,
    isDetailOpen: dialogs.isDetailOpen,
    onPaymentSuccess: dialogs.closePaymentDialog,
    onGenerateSuccess: handleGenerateSuccess,
  });

  const filteredBills = useMemo(
    () => filterBillsByStatus(bills, filters.statusFilter),
    [bills, filters.statusFilter]
  );
  const stats = useMemo(() => buildBillStats(bills), [bills]);

  const handleViewDetail = useCallback((bill: Bill) => {
    dialogs.openDetailDialog(bill.id);
  }, [dialogs]);

  const handlePayment = useCallback((bill: Bill) => {
    dialogs.openPaymentDialog(bill);
  }, [dialogs]);

  const handlePaymentFromDetail = useCallback(() => {
    if (billDetail) {
      dialogs.openPaymentDialog(billDetail);
      dialogs.closeDetailDialog();
    }
  }, [billDetail, dialogs]);

  const handleGenerate = useCallback(() => {
    dialogs.openGenerateDialog();
  }, [dialogs]);

  const handleExport = useCallback((type: 'all' | 'unfinished') => {
    exportExcel(type, filters.statusFilter);
  }, [exportExcel, filters.statusFilter]);

  return {
    // Data
    bills,
    billsLoading,
    filteredBills,
    stats,

    // Bill detail
    billDetail,
    billDetailLoading,
    billFeeItems,
    feeItemsLoading,

    // Mutations
    exportPdf,
    exportExcel,
    handleShareBill,
    paymentMutation,
    generateMutation,

    // Permissions
    canGenerateBill,
    canEditBill,

    // Sharing
    sharingBillId,

    // Filters
    statusFilter: filters.statusFilter,
    setStatusFilter: filters.setStatusFilter,

    // Dialog state
    isPaymentOpen: dialogs.isPaymentOpen,
    isGenerateOpen: dialogs.isGenerateOpen,
    isDetailOpen: dialogs.isDetailOpen,
    selectedBillId: dialogs.selectedBillId,
    selectedBill: dialogs.selectedBill,

    // Dialog actions
    handleViewDetail,
    handlePayment,
    handlePaymentFromDetail,
    handleGenerate,
    handleExport,
    openDetailDialog: dialogs.openDetailDialog,
    closeDetailDialog: dialogs.closeDetailDialog,
    openPaymentDialog: dialogs.openPaymentDialog,
    closePaymentDialog: dialogs.closePaymentDialog,
    openGenerateDialog: dialogs.openGenerateDialog,
    closeGenerateDialog: dialogs.closeGenerateDialog,
  };
}
