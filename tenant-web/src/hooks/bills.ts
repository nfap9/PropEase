import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billsApi } from '@/api/bills';
import { billFeeItemsApi } from '@/api/feeTypes';
import { shareBillSummary } from '@/utils/bills-share';
import { getErrorMessage } from '@/utils/error';
import { filterEmptyStrings } from '@/utils/form';
import type { Bill, BillFeeItem, BillStatus } from '@/types';
import type { GenerateBillsFormData, PaymentFormData } from '@/types';
import { buildBillPdfFilename, buildBillsExcelFilename, downloadBlob } from '@/utils/bills';
import { tenantMessages } from '@/constants/messages';

interface UseBillsDataOptions {
  selectedBillId: string | null;
  isDetailOpen: boolean;
  onPaymentSuccess: () => void;
  onGenerateSuccess: (created: number, skipped: number) => void;
}

export function useBillsData({
  selectedBillId,
  isDetailOpen,
  onPaymentSuccess,
  onGenerateSuccess,
}: UseBillsDataOptions) {
  const queryClient = useQueryClient();

  const billsQuery = useQuery({
    queryKey: ['bills'],
    queryFn: () => billsApi.list(),
  });

  const billDetailQuery = useQuery({
    queryKey: ['bills', selectedBillId],
    queryFn: () => billsApi.get(selectedBillId!),
    enabled: Boolean(selectedBillId && isDetailOpen),
  });

  const billFeeItemsQuery = useQuery({
    queryKey: ['bills', selectedBillId, 'fee-items'],
    queryFn: () => billFeeItemsApi.list(selectedBillId!),
    enabled: Boolean(selectedBillId && isDetailOpen),
  });

  const invalidateBills = () => {
    queryClient.invalidateQueries({ queryKey: ['bills'] });
  };

  const paymentMutation = useMutation({
    mutationFn: ({ billId, data }: { billId: string; data: PaymentFormData }) =>
      billsApi.createPayment(billId, filterEmptyStrings(data)),
    onSuccess: () => {
      invalidateBills();
      onPaymentSuccess();
      toast.success(tenantMessages.bills.toast.paymentRecorded);
    },
    onError: (error) => toast.error(getErrorMessage(error, tenantMessages.bills.errors.payment)),
  });

  const generateMutation = useMutation({
    mutationFn: (data: GenerateBillsFormData) => billsApi.generate(data),
    onSuccess: (result) => {
      invalidateBills();
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      onGenerateSuccess(result.created, result.skipped);
    },
    onError: (error) => toast.error(getErrorMessage(error, tenantMessages.bills.errors.generate)),
  });

  const exportPdf = async (billId: string) => {
    const blob = await billsApi.exportPdf(billId);
    downloadBlob(blob, buildBillPdfFilename(billId));
  };

  const exportExcel = async (exportType: 'all' | 'unfinished', statusFilter: BillStatus | 'all') => {
    try {
      const filters: { status?: BillStatus; year?: number; month?: number } = {};
      if (exportType === 'all' && statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const blob = await billsApi.exportExcel({ ...filters, exportType });
      downloadBlob(blob, buildBillsExcelFilename(exportType));
      toast.success(tenantMessages.bills.toast.exportSuccess);
    } catch (error) {
      toast.error(getErrorMessage(error, tenantMessages.bills.errors.export));
    }
  };

  return {
    bills: billsQuery.data,
    billsLoading: billsQuery.isLoading,
    billDetail: billDetailQuery.data,
    billDetailLoading: billDetailQuery.isLoading,
    billFeeItems: billFeeItemsQuery.data,
    feeItemsLoading: billFeeItemsQuery.isLoading,
    paymentMutation,
    generateMutation,
    exportPdf,
    exportExcel,
  };
}

export function useBillShare(organizationName?: string) {
  const [sharingBillId, setSharingBillId] = useState<string | null>(null);

  const handleShareBill = async (bill: Bill, feeItems: BillFeeItem[] = []) => {
    try {
      setSharingBillId(bill.id);
      const result = await shareBillSummary({
        bill,
        organizationName,
        feeItems,
      });
      toast.success(result === 'shared' ? tenantMessages.bills.toast.shared : tenantMessages.bills.toast.downloaded);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      toast.error(getErrorMessage(error, tenantMessages.bills.errors.share));
    } finally {
      setSharingBillId((current) => (current === bill.id ? null : current));
    }
  };

  return {
    sharingBillId,
    handleShareBill,
  };
}
