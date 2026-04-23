import { useChangeUtilityRates } from '@/hooks/use-lease-operations';
import { Button, Drawer, Form, InputNumber, Select } from 'antd';
import type { ChangeUtilityRatesFormData } from '@/types';

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
  const [form] = Form.useForm();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const changeUtilityRates = useChangeUtilityRates(leaseId);

  const onSubmit = (values: Record<string, unknown>) => {
    changeUtilityRates.mutate(values as unknown as ChangeUtilityRatesFormData, {
      onSuccess: () => {
        onOpenChange(false);
        form.resetFields();
      },
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
          <Button type="primary" loading={changeUtilityRates.isPending} onClick={() => form.submit()}>
            {changeUtilityRates.isPending ? '提交中...' : '确认变更'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">当前：水 ¥{currentWaterRate}/吨 · 电 ¥{currentElectricityRate}/度</p>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{
          waterRate: currentWaterRate,
          electricityRate: currentElectricityRate,
          effectiveFromYear: currentYear,
          effectiveFromMonth: currentMonth,
        }}
        onFinish={onSubmit}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="waterRate"
            label="新水价 (元/吨)"
            rules={[{ required: true, message: '请输入水价' }, { type: 'number', min: 0, message: '价格不能为负' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="electricityRate"
            label="新电价 (元/度)"
            rules={[{ required: true, message: '请输入电价' }, { type: 'number', min: 0, message: '价格不能为负' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="effectiveFromYear"
            label="生效年份"
            rules={[{ required: true, message: '请选择年份' }]}
          >
            <Select className="w-full">
              {years.map((y) => (
                <Select.Option key={y} value={y}>
                  {y}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="effectiveFromMonth"
            label="生效月份"
            rules={[{ required: true, message: '请选择月份' }]}
          >
            <Select className="w-full">
              {months.map((m) => (
                <Select.Option key={m} value={m}>
                  {m} 月
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}
