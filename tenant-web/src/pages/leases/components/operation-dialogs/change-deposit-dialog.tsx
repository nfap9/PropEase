
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeDepositSchema, type ChangeDepositFormData } from '@/schemas/lease-operations';
import { useChangeDeposit } from '@/hooks/use-lease-operations';
import { Modal, Button, Input } from 'antd';
import { Label } from '@/components/common/label';

interface ChangeDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentDeposit: number;
}

export function ChangeDepositDialog({ open, onOpenChange, orgId, leaseId, currentDeposit }: ChangeDepositDialogProps) {
  const form = useForm<ChangeDepositFormData>({
    resolver: zodResolver(changeDepositSchema),
    defaultValues: { newDeposit: currentDeposit, reason: '' },
  });

  const changeDeposit = useChangeDeposit(leaseId);

  const onSubmit = (data: ChangeDepositFormData) => {
    changeDeposit.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="押金变更"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={changeDeposit.isPending} onClick={form.handleSubmit(onSubmit)}>
          {changeDeposit.isPending ? '提交中...' : '确认变更'}
        </Button>,
      ]}
    >
      <p className="mb-4 text-sm text-gray-600">当前押金：¥{currentDeposit.toLocaleString()}</p>
      <FormProvider {...form}>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newDeposit">新押金 (元) *</Label>
            <Controller
              name="newDeposit"
              control={form.control}
              render={({ field }) => <Input type="number" step="0.01" {...field} />}
            />
            {form.formState.errors.newDeposit && (
              <p className="text-sm text-red-500">{form.formState.errors.newDeposit.message}</p>
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
    </Modal>
  );
}
