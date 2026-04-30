/**
 * useBillShare - 账单分享
 *
 * sharingBillId 用于禁用分享按钮（避免重复点击），
 * 在 BillsListView（操作列菜单）和 BillDetailDialog（底部按钮）中都要读取。
 * 因此状态提升到父组件 index.tsx 中管理。
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { shareBillSummary } from '@/utils/bills-share';
import { getErrorMessage } from '@propease/web-shared';
import type { Bill, BillFeeItem } from '@/types';
import { tenantMessages } from '@/constants/messages';

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
      // 用户取消分享时不应报错
      if (error instanceof DOMException && error.name === 'AbortException') {
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
