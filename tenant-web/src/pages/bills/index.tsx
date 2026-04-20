import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAsyncDialogSubmit, usePageQueryState } from '@apartment-ultra/shared-ui';
import { toast } from 'sonner';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import type { Bill, BillStatus } from '@/types';
import { createBillsColumns } from '@/pages/bills/components/columns';
import { useBillsData, useBillShare } from '@/hooks/bills';
import {
  generateBillsSchema,
  getDefaultGenerateValues,
  getDefaultPaymentValues,
  paymentSchema,
  type GenerateBillsFormData,
  type PaymentFormData,
} from '@/schemas/bills';
import { buildBillStats, filterBillsByStatus, getBillStatusFilter } from '@/utils/bills';
import { BillsListView } from '@/pages/bills/components/bills-list-view';

const BillDetailDialog = lazy(() => import('@/pages/bills/components/bill-dialogs').then((mod) => ({ default: mod.BillDetailDialog })));
const BillGenerateDialog = lazy(() => import('@/pages/bills/components/bill-dialogs').then((mod) => ({ default: mod.BillGenerateDialog })));
const BillPaymentDialog = lazy(() => import('@/pages/bills/components/bill-dialogs').then((mod) => ({ default: mod.BillPaymentDialog })));

function BillsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function BillsPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  // 权限检查
  const canGenerateBill = hasPermission(PERMISSIONS.BILL_CREATE);
  const canEditBill = hasPermission(PERMISSIONS.BILL_EDIT);

  const statusFilterQuery = usePageQueryState<BillStatus | 'all'>({
    queryKey: 'status',
    defaultValue: 'all',
    parse: (value) => getBillStatusFilter(value) ?? 'all',
    serialize: (value) => (value === 'all' ? null : value),
  });
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: getDefaultPaymentValues(),
  });

  const generateForm = useForm<GenerateBillsFormData>({
    resolver: zodResolver(generateBillsSchema),
    defaultValues: getDefaultGenerateValues(),
  });
  const paymentSubmit = useAsyncDialogSubmit({
    close: () => setIsPaymentOpen(false),
    reset: () => paymentForm.reset(getDefaultPaymentValues()),
    clear: () => setSelectedBill(null),
  });
  const generateSubmit = useAsyncDialogSubmit<[number, number]>({
    close: () => setIsGenerateOpen(false),
    reset: () => generateForm.reset(getDefaultGenerateValues()),
    afterSuccess: (created, skipped) => {
      toast.success(`出账完成：新增 ${created} 笔，跳过 ${skipped} 笔`);
    },
  });

  const { sharingBillId, handleShareBill } = useBillShare(organization?.name);
  const {
    bills,
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
    onPaymentSuccess: paymentSubmit.handleSuccess,
    onGenerateSuccess: generateSubmit.handleSuccess,
  });

  const filteredBills = useMemo(
    () => filterBillsByStatus(bills, statusFilterQuery.value),
    [bills, statusFilterQuery.value]
  );
  const stats = useMemo(() => buildBillStats(bills), [bills]);

  const handleViewDetail = useCallback((bill: Bill) => {
    setSelectedBillId(bill.id);
    setIsDetailOpen(true);
  }, []);

  const handlePayment = useCallback(
    (bill: Bill) => {
      setSelectedBill(bill);
      paymentForm.reset(getDefaultPaymentValues(bill.total_amount - bill.paid_amount));
      setIsPaymentOpen(true);
    },
    [paymentForm]
  );

  const handlePaymentFromDetail = () => {
    if (!billDetail) {
      return;
    }

    handlePayment(billDetail);
    setIsDetailOpen(false);
    setSelectedBillId(null);
  };

  const columns = useMemo(
    () =>
      createBillsColumns({
        sharingBillId,
        onViewDetail: handleViewDetail,
        onPayment: handlePayment,
        onExportPdf: exportPdf,
        onShare: (bill) => handleShareBill(bill),
      }),
    [exportPdf, handlePayment, handleShareBill, handleViewDetail, sharingBillId]
  );

  if (authLoading) {
    return <BillsFallback />;
  }

  return (
    <PermissionPageGuard>
      <BillsListView
        orgId={orgId}
        billsLoading={billsLoading}
        bills={filteredBills}
        columns={columns}
        stats={stats}
        statusFilter={statusFilterQuery.value}
        onStatusFilterChange={statusFilterQuery.setValue}
        onGenerate={() => setIsGenerateOpen(true)}
        onExport={(type) => exportExcel(type, statusFilterQuery.value)}
        canGenerateBill={canGenerateBill}
      />

      <Suspense fallback={null}>
        <BillDetailDialog
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) {
              setSelectedBillId(null);
            }
          }}
          selectedBillId={selectedBillId}
          billDetail={billDetail}
          billFeeItems={billFeeItems}
          isLoading={billDetailLoading}
          feeItemsLoading={feeItemsLoading}
          sharingBillId={sharingBillId}
          onPayment={handlePaymentFromDetail}
          onShare={() => billDetail && handleShareBill(billDetail, billFeeItems ?? [])}
          onExportPdf={exportPdf}
          canEditBill={canEditBill}
        />

        <BillGenerateDialog
          open={isGenerateOpen}
          onOpenChange={setIsGenerateOpen}
          form={generateForm}
          onSubmit={(data) => generateMutation.mutate(data)}
          isPending={generateMutation.isPending}
        />

        <BillPaymentDialog
          open={isPaymentOpen}
          onOpenChange={setIsPaymentOpen}
          selectedBill={selectedBill}
          form={paymentForm}
          onSubmit={(data) => {
            if (!selectedBill) {
              return;
            }

            paymentMutation.mutate({
              billId: selectedBill.id,
              data,
            });
          }}
          isPending={paymentMutation.isPending}
        />
      </Suspense>
    </PermissionPageGuard>
  );
}
