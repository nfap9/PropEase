/**
 * useBillExport - 账单导出
 *
 * exportPdf：导出单个账单 PDF
 * exportExcel：导出账单列表 Excel，支持按状态筛选
 */
import { toast } from 'sonner';
import { billsApi } from '@/api/bills';
import { getErrorMessage } from '@apartment-ultra/web-shared';
import { buildBillPdfFilename, buildBillsExcelFilename, downloadBlob } from '@/utils/bills';
import type { BillStatus } from '@/types';
import { tenantMessages } from '@/constants/messages';

export function useBillExport() {
  const exportPdf = async (billId: string) => {
    const blob = await billsApi.exportPdf(billId);
    downloadBlob(blob, buildBillPdfFilename(billId));
  };

  const exportExcel = async (exportType: 'all' | 'unfinished', statusFilter: BillStatus | 'all') => {
    try {
      const filters: { status?: BillStatus; year?: number; month?: number } = {};
      // 仅在导出全部且有状态筛选时传入 status，避免无筛选时多余的查询参数
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
    exportPdf,
    exportExcel,
  };
}
