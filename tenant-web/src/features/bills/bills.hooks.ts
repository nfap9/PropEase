import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billsApi, billFeeItemsApi } from '@/lib/api';
import { shareBillSummary } from '@/lib/bills/share';
import { getErrorMessage } from '@/lib/utils/error';
import { filterEmptyStrings } from '@/lib/utils/form';
import type { Bill, BillFeeItem, BillStatus } from '@/types';
import type { GenerateBillsFormData, PaymentFormData } from './bills.schemas';
import { buildBillPdfFilename, buildBillsExcelFilename, downloadBlob } from './bills.utils';

interface UseBillsDataOptions {
  orgId?: string;
  selectedBillId: string | null;
  isDetailOpen: boolean;
  onPaymentSuccess: () => void;
  onGenerateSuccess: (created: number, skipped: number) => void;
}

export function useBillsData({
  orgId,
  selectedBillId,
  isDetailOpen,
  onPaymentSuccess,
  onGenerateSuccess,
}: UseBillsDataOptions) {
  const queryClient = useQueryClient();

  const billsQuery = useQuery({
    queryKey: ['bills', orgId],
    queryFn: () => billsApi.list(orgId!),
    enabled: Boolean(orgId),
  });

  const billDetailQuery = useQuery({
    queryKey: ['bills', orgId, selectedBillId],
    queryFn: () => billsApi.get(orgId!, selectedBillId!),
    enabled: Boolean(orgId && selectedBillId && isDetailOpen),
  });

  const billFeeItemsQuery = useQuery({
    queryKey: ['bills', orgId, selectedBillId, 'fee-items'],
    queryFn: () => billFeeItemsApi.list(orgId!, selectedBillId!),
    enabled: Boolean(orgId && selectedBillId && isDetailOpen),
  });

  const invalidateBills = () => {
    queryClient.invalidateQueries({ queryKey: ['bills', orgId] });
  };

  const paymentMutation = useMutation({
    mutationFn: ({ billId, data }: { billId: string; data: PaymentFormData }) =>
      billsApi.createPayment(orgId!, billId, filterEmptyStrings(data)),
    onSuccess: () => {
      invalidateBills();
      onPaymentSuccess();
      toast.success('付款登记成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '登记失败，请重试')),
  });

  const generateMutation = useMutation({
    mutationFn: (data: GenerateBillsFormData) => billsApi.generate(orgId!, data),
    onSuccess: (result) => {
      invalidateBills();
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      onGenerateSuccess(result.created, result.skipped);
    },
    onError: (error) => toast.error(getErrorMessage(error, '出账失败，请重试')),
  });

  const exportPdf = async (billId: string) => {
    const blob = await billsApi.exportPdf(orgId!, billId);
    downloadBlob(blob, buildBillPdfFilename(billId));
  };

  const exportExcel = async (exportType: 'all' | 'unfinished', statusFilter: BillStatus | 'all') => {
    try {
      const filters: { status?: BillStatus; year?: number; month?: number } = {};
      if (exportType === 'all' && statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const blob = await billsApi.exportExcel(orgId!, { ...filters, exportType });
      downloadBlob(blob, buildBillsExcelFilename(exportType));
      toast.success('导出成功');
    } catch (error) {
      toast.error(getErrorMessage(error, '导出失败，请重试'));
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
      toast.success(
        result === 'shared' ? '已调起系统分享面板' : '分享图已下载，可直接转发给租客或同事'
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      toast.error(getErrorMessage(error, '生成分享图失败，请重试'));
    } finally {
      setSharingBillId((current) => (current === bill.id ? null : current));
    }
  };

  return {
    sharingBillId,
    handleShareBill,
  };
}
