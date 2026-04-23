import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeDepositSchema, type ChangeDepositFormData } from '@/schemas/lease-operations';
import { useChangeDeposit } from '@/hooks/use-lease-operations';
import { Modal, Button, Input, Form, InputNumber } from 'antd';

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
      <Form
        layout="vertical"
        onFinish={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Form.Item
          label="新押金 (元)"
          name="newDeposit"
          required
          validateStatus={form.formState.errors.newDeposit ? 'error' : ''}
          help={form.formState.errors.newDeposit?.message}
        >
          <Controller
            name="newDeposit"
            control={form.control}
            render={({ field }) => (
              <InputNumber
                {...field}
                value={field.value ?? ''}
                onChange={(val) => field.onChange(val ?? '')}
                min={0}
                step={0.01}
                style={{ width: '100%' }}
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
    </Modal>
  );
}
