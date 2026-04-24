import { Form } from 'antd';
import { useCreateTenant, type CreateTenantData } from '@/pages/tenants/hooks/use-create-tenant';
import type { Tenant } from '@/types';

interface UseCreateTenantDialogOptions {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (tenant: Tenant) => void;
  form: ReturnType<typeof Form.useForm>[0];
}

export function useCreateTenantDialog({
  orgId,
  open,
  onOpenChange,
  onSuccess,
  form,
}: UseCreateTenantDialogOptions) {
  const createMutation = useCreateTenant({ orgId });

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      createMutation.mutate(values as CreateTenantData, {
        onSuccess: (newTenant) => {
          onOpenChange(false);
          form.resetFields();
          onSuccess?.(newTenant);
        },
      });
    });
  };

  return {
    handleSubmit,
    isPending: createMutation.isPending,
  };
}
