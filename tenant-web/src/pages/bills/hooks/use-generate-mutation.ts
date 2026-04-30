/**
 * useGenerateMutation - 生成账单操作
 *
 * 成功后会 invalidateBills 和 dashboard-overview 缓存。
 */
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billsApi } from '@/api/bills';
import { getErrorMessage } from '@propease/web-shared';
import type { GenerateBillsFormData } from '@/types';
import { tenantMessages } from '@/constants/messages';

export function useGenerateMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: GenerateBillsFormData) => billsApi.generate(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success(`出账完成：新增 ${result.created} 笔，跳过 ${result.skipped} 笔`);
    },
    onError: (error) => toast.error(getErrorMessage(error, tenantMessages.bills.errors.generate)),
  });

  const generateBills = useCallback(
    (data: GenerateBillsFormData, onSuccess?: (created: number, skipped: number) => void) => {
      mutation.mutate(data, {
        onSuccess: onSuccess ? (result) => onSuccess(result.created, result.skipped) : undefined,
      });
    },
    [mutation],
  );

  return {
    generateBills,
    isGenerating: mutation.isPending,
  };
}
