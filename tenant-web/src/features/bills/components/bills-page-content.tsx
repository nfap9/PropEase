'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { useAuth } from '@/lib/auth/context';
import type { Bill, BillStatus } from '@/types';
import { createBillsColumns } from '../bills.columns';
import { useBillsData, useBillShare } from '../bills.hooks';
import {
  generateBillsSchema,
  getDefaultGenerateValues,
  getDefaultPaymentValues,
  paymentSchema,
  type GenerateBillsFormData,
  type PaymentFormData,
} from '../bills.schemas';
import { buildBillStats, filterBillsByStatus, getBillStatusFilter } from '../bills.utils';
import { BillDetailDialog, BillGenerateDialog, BillPaymentDialog } from './bill-dialogs';
import { BillsListView } from './bills-list-view';

function BillsFallback() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    </MainLayout>
  );
}

export function BillsPageContent() {
  const searchParams = useSearchParams();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const initialStatus = getBillStatusFilter(searchParams.get('status'));
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>(initialStatus ?? 'all');
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
    orgId,
    selectedBillId,
    isDetailOpen,
    onPaymentSuccess: () => {
      setIsPaymentOpen(false);
      paymentForm.reset(getDefaultPaymentValues());
      setSelectedBill(null);
    },
    onGenerateSuccess: (created, skipped) => {
      setIsGenerateOpen(false);
      generateForm.reset(getDefaultGenerateValues());
      toast.success(`出账完成：新增 ${created} 笔，跳过 ${skipped} 笔`);
    },
  });

  const filteredBills = useMemo(() => filterBillsByStatus(bills, statusFilter), [bills, statusFilter]);
  const stats = useMemo(() => buildBillStats(bills), [bills]);

  const handleViewDetail = useCallback((bill: Bill) => {
    setSelectedBillId(bill.id);
    setIsDetailOpen(true);
  }, []);

  const handlePayment = useCallback((bill: Bill) => {
    setSelectedBill(bill);
    paymentForm.reset(getDefaultPaymentValues(bill.total_amount - bill.paid_amount));
    setIsPaymentOpen(true);
  }, [paymentForm]);

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
      <MainLayout>
        <BillsListView
          orgId={orgId}
          billsLoading={billsLoading}
          bills={filteredBills}
          columns={columns}
          stats={stats}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onGenerate={() => setIsGenerateOpen(true)}
          onExport={(type) => exportExcel(type, statusFilter)}
        />

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
      </MainLayout>
    </PermissionPageGuard>
  );
}

export function BillsPageSuspenseFallback() {
  return <BillsFallback />;
}
