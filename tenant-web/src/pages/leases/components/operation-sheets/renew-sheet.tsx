import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { renewSchema, type RenewFormData } from '@/schemas/lease-operations';
import { useRenew } from '@/hooks/use-lease-operations';
import { Button, Drawer, Input, DatePicker, Form } from 'antd';

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
      <Form
        layout="vertical"
        onFinish={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Form.Item
          label="新结束日期"
          name="newEndDate"
          required
          validateStatus={form.formState.errors.newEndDate ? 'error' : ''}
          help={form.formState.errors.newEndDate?.message}
        >
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
        </Form.Item>
        <Form.Item
          label="原因备注"
          name="reason"
          validateStatus={form.formState.errors.reason ? 'error' : ''}
          help={form.formState.errors.reason?.message}
        >
          <Controller
            name="reason"
            control={form.control}
            render={({ field }) => <Input {...field} placeholder="可选" />}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
