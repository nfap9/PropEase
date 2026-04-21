import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeRentSchema, type ChangeRentFormData } from '@/schemas/lease-operations';
import { useChangeRent } from '@/hooks/use-lease-operations';
import { Button, Drawer, Input, Select, Form } from 'antd';

interface ChangeRentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentRent: number;
}

export function ChangeRentSheet({ open, onOpenChange, orgId, leaseId, currentRent }: ChangeRentSheetProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const form = useForm<ChangeRentFormData>({
    resolver: zodResolver(changeRentSchema),
    defaultValues: {
      newRent: currentRent,
      effectiveFromYear: currentYear,
      effectiveFromMonth: currentMonth,
      reason: '',
    },
  });

  const changeRent = useChangeRent(leaseId);

  const onSubmit = (data: ChangeRentFormData) => {
    changeRent.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="房租变更"
      width={400}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={changeRent.isPending} onClick={form.handleSubmit(onSubmit)}>
            {changeRent.isPending ? '提交中...' : '确认变更'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">当前月租：¥{currentRent.toLocaleString()}</p>
      <Form
        layout="vertical"
        onFinish={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Form.Item
          label="新月租 (元)"
          name="newRent"
          required
          validateStatus={form.formState.errors.newRent ? 'error' : ''}
          help={form.formState.errors.newRent?.message}
        >
          <Controller
            name="newRent"
            control={form.control}
            render={({ field }) => <Input type="number" step="0.01" {...field} />}
          />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="生效年份"
            name="effectiveFromYear"
            required
            validateStatus={form.formState.errors.effectiveFromYear ? 'error' : ''}
            help={form.formState.errors.effectiveFromYear?.message}
          >
            <Controller
              name="effectiveFromYear"
              control={form.control}
              render={({ field }) => (
                <Select onChange={field.onChange} value={String(field.value)} className="w-full">
                  {years.map((y) => (
                    <Select.Option key={y} value={String(y)}>
                      {y}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>
          <Form.Item
            label="生效月份"
            name="effectiveFromMonth"
            required
            validateStatus={form.formState.errors.effectiveFromMonth ? 'error' : ''}
            help={form.formState.errors.effectiveFromMonth?.message}
          >
            <Controller
              name="effectiveFromMonth"
              control={form.control}
              render={({ field }) => (
                <Select onChange={field.onChange} value={String(field.value)} className="w-full">
                  {months.map((m) => (
                    <Select.Option key={m} value={String(m)}>
                      {m} 月
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          </Form.Item>
        </div>
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
