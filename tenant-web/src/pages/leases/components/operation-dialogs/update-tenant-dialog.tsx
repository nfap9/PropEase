
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { updateTenantSchema, type UpdateTenantFormData } from '@/schemas/lease-operations';
import { useUpdateTenant } from '@/hooks/use-lease-operations';
import { tenantsApi } from '@/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';

interface UpdateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function UpdateTenantDialog({ open, onOpenChange, orgId, leaseId }: UpdateTenantDialogProps) {
  const form = useForm<UpdateTenantFormData>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: { newTenantId: '' },
  });

  const updateTenant = useUpdateTenant(orgId, leaseId);

  const { data: tenants } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(orgId),
    enabled: open,
  });

  const onSubmit = (data: UpdateTenantFormData) => {
    updateTenant.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑租客</DialogTitle>
          <DialogDescription>将租约的租客更换为其他已存在的租客</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormProvider {...form}>
            <div className="space-y-2">
              <Label htmlFor="newTenantId">新租客 *</Label>
              <Controller
                name="newTenantId"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择新租客" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants?.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} {tenant.phone && `(${tenant.phone})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.newTenantId && (
                <p className="text-sm text-destructive">{form.formState.errors.newTenantId.message}</p>
              )}
            </div>
          </FormProvider>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={updateTenant.isPending}>
              {updateTenant.isPending ? '提交中...' : '确认更换'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
