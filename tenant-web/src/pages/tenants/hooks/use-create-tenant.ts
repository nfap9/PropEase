import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tenantsApi } from '@/api/tenants';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import type { Tenant } from '@/types';

export type CreateTenantData = Partial<Record<string, unknown>>;

export function useCreateTenant({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantData) => tenantsApi.create(filterEmptyStrings(data) as Parameters<typeof tenantsApi.create>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      toast.success('租客创建成功');
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });
}
