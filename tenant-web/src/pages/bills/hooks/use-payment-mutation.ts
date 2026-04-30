/**
 * usePaymentMutation - 收款操作
 *
 * 成功后会 invalidateBills 缓存，触发列表自动刷新。
 */
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billsApi } from '@/api/bills';
import { getErrorMessage } from '@propease/web-shared';
import { filterEmptyStrings } from '@/utils/form';
import type { PaymentFormData } from '@/types';
import { tenantMessages } from '@/constants/messages';

export function usePaymentMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ billId, data }: { billId: string; data: PaymentFormData }) =>
      billsApi.createPayment(billId, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success(tenantMessages.bills.toast.paymentRecorded);
    },
    onError: (error) => toast.error(getErrorMessage(error, tenantMessages.bills.errors.payment)),
  });

  const recordPayment = useCallback(
    (billId: string, data: PaymentFormData, onSuccess?: () => void) => {
      mutation.mutate({ billId, data }, { onSuccess });
    },
    [mutation],
  );

  return {
    recordPayment,
    isRecordingPayment: mutation.isPending,
  };
}
