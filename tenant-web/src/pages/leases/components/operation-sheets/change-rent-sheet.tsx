import { useChangeRent } from '@/pages/leases/hooks/use-lease-operations';
import { Button, Drawer, Input, Select, Form, InputNumber } from 'antd';

interface ChangeRentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentRent: number;
}

export function ChangeRentSheet({ open, onOpenChange, orgId, leaseId, currentRent }: ChangeRentSheetProps) {
  const [form] = Form.useForm();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const changeRent = useChangeRent(leaseId);

  const onSubmit = (values: { newRent: number; effectiveFromYear: number; effectiveFromMonth: number; reason: string }) => {
    changeRent.mutate(values, {
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
      title="房租变更"
      width={400}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={changeRent.isPending} onClick={() => form.submit()}>
            {changeRent.isPending ? '提交中...' : '确认变更'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">当前月租：¥{currentRent.toLocaleString()}</p>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{
          newRent: currentRent,
          effectiveFromYear: currentYear,
          effectiveFromMonth: currentMonth,
          reason: '',
        }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="newRent"
          label="新月租 (元)"
          rules={[{ required: true, message: '请输入新月租' }, { type: 'number', min: 0, message: '租金不能为负' }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
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
        <Form.Item name="reason" label="原因备注">
          <Input placeholder="可选" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
