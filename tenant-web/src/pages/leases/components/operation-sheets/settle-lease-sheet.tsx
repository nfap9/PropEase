import { useSettleLease } from '@/hooks/use-lease-operations';
import { Button, Drawer, Input, Alert, Card, Form, InputNumber } from 'antd';
import { AlertTriangle } from 'lucide-react';
import type { SettleLeaseFormData } from '@/schemas/lease-operations';

interface SettleLeaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function SettleLeaseSheet({ open, onOpenChange, orgId, leaseId }: SettleLeaseSheetProps) {
  const [form] = Form.useForm();
  const settleLease = useSettleLease(leaseId);

  const watchFields = Form.useWatch(['finalWaterReading', 'finalElectricityReading', 'penaltyAmount'], form);

  const onSubmit = (values: Record<string, unknown>) => {
    settleLease.mutate(values as unknown as SettleLeaseFormData, {
      onSuccess: () => {
        onOpenChange(false);
        form.resetFields();
      },
    });
  };

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="退租结算"
      width={400}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" danger loading={settleLease.isPending} onClick={() => form.submit()}>
            {settleLease.isPending ? '处理中...' : '确认退租结算'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">完成租约的最终结算，包括最后一期账单和押金处理</p>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{
          finalWaterReading: undefined,
          finalElectricityReading: undefined,
          penaltyAmount: undefined,
          remarks: '',
        }}
        onFinish={onSubmit}
      >
        <Alert
          message="退租结算后，租约将自动终止，房间将变为空置状态"
          type="warning"
          showIcon
          icon={<AlertTriangle className="h-4 w-4" />}
        />

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="finalWaterReading"
            label="最终水表读数"
            rules={[{ type: 'number', min: 0, message: '读数不能为负' }]}
          >
            <InputNumber min={0} step={0.01} placeholder="请输入" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="finalElectricityReading"
            label="最终电表读数"
            rules={[{ type: 'number', min: 0, message: '读数不能为负' }]}
          >
            <InputNumber min={0} step={0.01} placeholder="请输入" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item
          name="penaltyAmount"
          label="违约金金额"
          rules={[{ type: 'number', min: 0, message: '违约金不能为负' }]}
        >
          <InputNumber min={0} step={0.01} placeholder="如有违约金请输入" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="remarks" label="备注">
          <Input placeholder="可选备注" />
        </Form.Item>

        {(watchFields.finalWaterReading !== undefined || watchFields.finalElectricityReading !== undefined) && (
          <Card title="结算预览" className="text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">最终水表读数</span>
                <span>{watchFields.finalWaterReading ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">最终电表读数</span>
                <span>{watchFields.finalElectricityReading ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">违约金</span>
                <span>¥{(watchFields.penaltyAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        )}
      </Form>
    </Drawer>
  );
}
