import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { Bill, BillStatus } from '@/types';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { useBillsData, useBillShare } from '@/hooks/bills';
import {
  generateBillsSchema,
  getDefaultGenerateValues,
  getDefaultPaymentValues,
  paymentSchema,
  type GenerateBillsFormData,
  type PaymentFormData,
} from '@/schemas/bills';
import { buildBillStats, filterBillsByStatus } from '@/utils/bills';

// ============== 导出类型 ==============
export interface BillsPageState {
  // 筛选
  statusFilter: BillStatus | 'all';
  setStatusFilter: (v: BillStatus | 'all') => void;

  // 弹窗
  isPaymentOpen: boolean;
  isGenerateOpen: boolean;
  isDetailOpen: boolean;

  // 选中数据
  selectedBillId: string | null;
  selectedBill: Bill | null;

  // 表单
  paymentForm: ReturnType<typeof useForm<PaymentFormData>>;
  generateForm: ReturnType<typeof useForm<GenerateBillsFormData>>;

  // 权限
  canGenerateBill: boolean;
  canEditBill: boolean;

  // 共享状态
  sharingBillId: string | null;

  // 操作
  handleViewDetail: (bill: Bill) => void;
  handlePayment: (bill: Bill) => void;
  handlePaymentFromDetail: () => void;
  handleGenerate: () => void;
  handleExport: (type: 'all' | 'unfinished') => void;

  // 弹窗控制
  openPaymentDialog: (bill: Bill) => void;
  closePaymentDialog: () => void;
  openGenerateDialog: () => void;
  closeGenerateDialog: () => void;
  openDetailDialog: (billId: string) => void;
  closeDetailDialog: () => void;

  // 列表数据
  bills: Bill[];
  billsLoading: boolean;
  filteredBills: Bill[];
  stats: ReturnType<typeof buildBillStats>;

  // 详情数据
  billDetail: ReturnType<typeof useBillsData>['billDetail'];
  billDetailLoading: boolean;
  billFeeItems: ReturnType<typeof useBillsData>['billFeeItems'];
  feeItemsLoading: boolean;

  // 操作方法
  exportPdf: ReturnType<typeof useBillsData>['exportPdf'];
  exportExcel: ReturnType<typeof useBillsData>['exportExcel'];
  handleShareBill: ReturnType<typeof useBillShare>['handleShareBill'];

  // Mutations
  paymentMutation: ReturnType<typeof useBillsData>['paymentMutation'];
  generateMutation: ReturnType<typeof useBillsData>['generateMutation'];
}

export function useBillsPage(): BillsPageState {
  const { organization } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  // ============== 状态 ==============
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // ============== 表单 ==============
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: getDefaultPaymentValues(),
  });

  const generateForm = useForm<GenerateBillsFormData>({
    resolver: zodResolver(generateBillsSchema),
    defaultValues: getDefaultGenerateValues(),
  });

  // ============== 权限 ==============
  const canGenerateBill = hasPermission(PERMISSIONS.BILL_CREATE);
  const canEditBill = hasPermission(PERMISSIONS.BILL_EDIT);

  // ============== 共享 ==============
  const { sharingBillId, handleShareBill } = useBillShare(organization?.name);

  // ============== 成功回调 ==============
  const closePaymentDialog = useCallback(() => {
    setIsPaymentOpen(false);
    paymentForm.reset(getDefaultPaymentValues());
    setSelectedBill(null);
  }, [paymentForm]);

  const closeGenerateDialog = useCallback(() => {
    setIsGenerateOpen(false);
    generateForm.reset(getDefaultGenerateValues());
  }, [generateForm]);

  const handleGenerateSuccess = useCallback((created: number, skipped: number) => {
    closeGenerateDialog();
    toast.success(`出账完成：新增 ${created} 笔，跳过 ${skipped} 笔`);
  }, [closeGenerateDialog]);

  const closeDetailDialog = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedBillId(null);
  }, []);

  // ============== 数据 ==============
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

  // ============== 派生数据 ==============
  const filteredBills = useMemo(
    () => filterBillsByStatus(bills, statusFilter),
    [bills, statusFilter]
  );
  const stats = useMemo(() => buildBillStats(bills), [bills]);

  // ============== 操作处理 ==============
  const handleViewDetail = useCallback((bill: Bill) => {
    setSelectedBillId(bill.id);
    setIsDetailOpen(true);
  }, []);

  const openPaymentDialog = useCallback((bill: Bill) => {
    setSelectedBill(bill);
    paymentForm.reset(getDefaultPaymentValues(bill.total_amount - bill.paid_amount));
    setIsPaymentOpen(true);
  }, [paymentForm]);

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
    // 状态
    statusFilter,
    setStatusFilter,
    isPaymentOpen,
    isGenerateOpen,
    isDetailOpen,
    selectedBillId,
    selectedBill,
    // 表单
    paymentForm,
    generateForm,
    // 权限
    canGenerateBill,
    canEditBill,
    // 共享
    sharingBillId,
    // 操作
    handleViewDetail,
    handlePayment,
    handlePaymentFromDetail,
    handleGenerate,
    handleExport,
    // 弹窗控制（暴露给外部）
    openPaymentDialog,
    closePaymentDialog,
    openGenerateDialog: handleGenerate,
    closeGenerateDialog,
    openDetailDialog: (billId: string) => {
      setSelectedBillId(billId);
      setIsDetailOpen(true);
    },
    closeDetailDialog,
    // 数据
    bills,
    billsLoading,
    filteredBills,
    stats,
    billDetail,
    billDetailLoading,
    billFeeItems,
    feeItemsLoading,
    // 操作方法
    exportPdf,
    exportExcel,
    handleShareBill,
    // Mutations
    paymentMutation,
    generateMutation,
  };
}
