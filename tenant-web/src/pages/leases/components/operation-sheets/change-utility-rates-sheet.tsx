import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeUtilityRatesSchema, type ChangeUtilityRatesFormData } from '@/schemas/lease-operations';
import { useChangeUtilityRates } from '@/hooks/use-lease-operations';
import { Button, Drawer, Input, Select, Form } from 'antd';

interface ChangeUtilityRatesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentWaterRate: number;
  currentElectricityRate: number;
}

export function ChangeUtilityRatesSheet({
  open,
  onOpenChange,
  orgId,
  leaseId,
  currentWaterRate,
  currentElectricityRate,
}: ChangeUtilityRatesSheetProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const form = useForm<ChangeUtilityRatesFormData>({
    resolver: zodResolver(changeUtilityRatesSchema),
    defaultValues: {
      waterRate: currentWaterRate,
      electricityRate: currentElectricityRate,
      effectiveFromYear: currentYear,
      effectiveFromMonth: currentMonth,
    },
  });

  const changeUtilityRates = useChangeUtilityRates(leaseId);

  const onSubmit = (data: ChangeUtilityRatesFormData) => {
    changeUtilityRates.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="水电单价变更"
      width={400}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={changeUtilityRates.isPending} onClick={form.handleSubmit(onSubmit)}>
            {changeUtilityRates.isPending ? '提交中...' : '确认变更'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">当前：水 ¥{currentWaterRate}/吨 · 电 ¥{currentElectricityRate}/度</p>
      <Form
        layout="vertical"
        onFinish={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="新水价 (元/吨)"
            name="waterRate"
            required
            validateStatus={form.formState.errors.waterRate ? 'error' : ''}
            help={form.formState.errors.waterRate?.message}
          >
            <Controller
              name="waterRate"
              control={form.control}
              render={({ field }) => <Input type="number" step="0.01" {...field} />}
            />
          </Form.Item>
          <Form.Item
            label="新电价 (元/度)"
            name="electricityRate"
            required
            validateStatus={form.formState.errors.electricityRate ? 'error' : ''}
            help={form.formState.errors.electricityRate?.message}
          >
            <Controller
              name="electricityRate"
              control={form.control}
              render={({ field }) => <Input type="number" step="0.01" {...field} />}
            />
          </Form.Item>
        </div>
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
      </Form>
    </Drawer>
  );
}
