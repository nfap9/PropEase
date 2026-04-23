import { Suspense, lazy, useMemo } from 'react';
import { Skeleton } from 'antd';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { createBillsColumns } from '@/pages/bills/components/columns';
import { BillsListView } from '@/pages/bills/components/bills-list-view';
import { useBillsPage } from './hooks/useBillsPage';

const BillDetailDialog = lazy(() =>
  import('@/pages/bills/components/bill-detail-dialog').then((m) => ({ default: m.BillDetailDialog }))
);
const BillGenerateDialog = lazy(() =>
  import('@/pages/bills/components/bill-generate-dialog').then((m) => ({ default: m.BillGenerateDialog }))
);
const BillPaymentDialog = lazy(() =>
  import('@/pages/bills/components/bill-payment-dialog').then((m) => ({ default: m.BillPaymentDialog }))
);

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
  const page = useBillsPage();

  // 列配置
  const columns = useMemo(
    () =>
      createBillsColumns({
        sharingBillId: page.sharingBillId,
        onViewDetail: page.handleViewDetail,
        onPayment: page.handlePayment,
        onExportPdf: page.exportPdf,
        onShare: (bill) => page.handleShareBill(bill),
      }),
    [page]
  );

  if (authLoading) {
    return <BillsFallback />;
  }

  return (
    <PermissionPageGuard>
      <BillsListView
        orgId={organization?.id}
        billsLoading={page.billsLoading}
        bills={page.filteredBills}
        columns={columns}
        stats={page.stats}
        statusFilter={page.statusFilter}
        onStatusFilterChange={page.setStatusFilter}
        onGenerate={page.handleGenerate}
        onExport={page.handleExport}
        canGenerateBill={page.canGenerateBill}
      />

      <Suspense fallback={null}>
        <BillDetailDialog
          open={page.isDetailOpen}
          onOpenChange={(open) => !open && page.closeDetailDialog()}
          selectedBillId={page.selectedBillId}
          billDetail={page.billDetail}
          billFeeItems={page.billFeeItems}
          isLoading={page.billDetailLoading}
          feeItemsLoading={page.feeItemsLoading}
          sharingBillId={page.sharingBillId}
          onPayment={page.handlePaymentFromDetail}
          onShare={() => page.billDetail && page.handleShareBill(page.billDetail, page.billFeeItems ?? [])}
          onExportPdf={page.exportPdf}
          canEditBill={page.canEditBill}
        />

        <BillGenerateDialog
          open={page.isGenerateOpen}
          onOpenChange={page.closeGenerateDialog}
          onSubmit={(data) => page.generateMutation.mutate(data)}
          isPending={page.generateMutation.isPending}
        />

        <BillPaymentDialog
          open={page.isPaymentOpen}
          onOpenChange={page.closePaymentDialog}
          selectedBill={page.selectedBill}
          onSubmit={(data) => page.selectedBill && page.paymentMutation.mutate({ billId: page.selectedBill.id, data })}
          isPending={page.paymentMutation.isPending}
        />
      </Suspense>
    </PermissionPageGuard>
  );
}
