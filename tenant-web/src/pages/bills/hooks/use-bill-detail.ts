/**
 * useBillDetail - 获取账单详情和费用项
 *
 * enabled 由 open 状态控制：弹窗关闭时不发起请求。
 * billId 为 null 时也不会发起请求（queryKey 包含 billId）。
 */
import { useQuery } from '@tanstack/react-query';
import { billsApi } from '@/api/bills';
import { billFeeItemsApi } from '@/api/feeTypes';

export function useBillDetail(billId: string | null, enabled: boolean) {
  const billDetailQuery = useQuery({
    queryKey: ['bills', billId],
    queryFn: () => billsApi.get(billId!),
    enabled: Boolean(billId && enabled),
  });

  const billFeeItemsQuery = useQuery({
    queryKey: ['bills', billId, 'fee-items'],
    queryFn: () => billFeeItemsApi.list(billId!),
    enabled: Boolean(billId && enabled),
  });

  return {
    billDetail: billDetailQuery.data,
    billFeeItems: billFeeItemsQuery.data,
    isLoadingBillDetail: billDetailQuery.isLoading,
    isLoadingFeeItems: billFeeItemsQuery.isLoading,
  };
}
