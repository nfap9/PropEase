
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { renewSchema, type RenewFormData } from '@/schemas/lease-operations';
import { useRenew } from '@/hooks/use-lease-operations';
import { Button, Drawer, Input, DatePicker } from 'antd';
import { Label } from '@/components/common/label';

interface RenewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentEndDate?: string | null;
}

export function RenewSheet({ open, onOpenChange, orgId, leaseId, currentEndDate }: RenewSheetProps) {
  const form = useForm<RenewFormData>({
    resolver: zodResolver(renewSchema),
    defaultValues: { newEndDate: '', reason: '' },
  });

  const renew = useRenew(leaseId);

  const onSubmit = (data: RenewFormData) => {
    renew.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="续约"
      width={400}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={renew.isPending} onClick={form.handleSubmit(onSubmit)}>
            {renew.isPending ? '提交中...' : '确认续约'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">当前结束日期：{currentEndDate ? new Date(currentEndDate).toLocaleDateString() : '长期'}</p>
      <FormProvider {...form}>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEndDate">新结束日期 *</Label>
            <Controller
              name="newEndDate"
              control={form.control}
              render={({ field }) => (
                <DatePicker
                  value={field.value || ''}
                  onChange={(_, dateString) => field.onChange(dateString)}
                  className="w-full"
                />
              )}
            />
            {form.formState.errors.newEndDate && (
              <p className="text-sm text-red-500">{form.formState.errors.newEndDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">原因备注</Label>
            <Controller
              name="reason"
              control={form.control}
              render={({ field }) => <Input {...field} placeholder="可选" />}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-500">{form.formState.errors.reason.message}</p>
            )}
          </div>
        </form>
      </FormProvider>
    </Drawer>
  );
}
