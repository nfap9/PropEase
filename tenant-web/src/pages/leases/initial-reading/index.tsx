import { Link } from 'react-router-dom';
import { Modal, Button, Input, DatePicker, Form } from 'antd';
import { Droplets, Zap } from 'lucide-react';
import { useInitialReadingDialog } from '../signing/use-initial-reading-dialog';

export interface InitialReadingDialogProps {
  orgId: string;
  roomId: string;
  roomDisplay: string;
  startDate: string;
  isHistoricalLeaseEntry?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InitialReadingDialog({
  orgId,
  roomId,
  roomDisplay,
  startDate,
  isHistoricalLeaseEntry = false,
  open,
  onOpenChange,
  onSuccess,
}: InitialReadingDialogProps) {
  const [form] = Form.useForm();

  const { handleSave, handleSkip, isPending } = useInitialReadingDialog({
    orgId,
    roomId,
    startDate,
    open,
    onOpenChange,
    onSuccess,
    form,
  });

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="录入初始水电读数"
      footer={[
        <Button key="skip" variant="text" onClick={handleSkip}>跳过</Button>,
        <Button key="submit" type="primary" loading={isPending} onClick={handleSave}>
          {isPending ? '保存中...' : '保存'}
        </Button>,
      ]}
    >
      <div className="mb-4 text-sm text-gray-600">
        {isHistoricalLeaseEntry ? (
          <>
            历史租约已创建，建议先记录当前表底数。历史月份数据可稍后前往
            <Link to="/workspace/utilities?tab=history" className="mx-1 underline underline-offset-4">历史水电记录</Link>
            继续补录。
          </>
        ) : (
          '签约后需记录初始水电表读数，便于后续出账计算。可填写后保存，或跳过稍后在水电录入页补录。'
        )}
      </div>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={getInitialValues()}
      >
        <Form.Item label="房间">
          <Input value={roomDisplay} disabled />
        </Form.Item>
        <Form.Item label="月份">
          <Input value={getPeriodLabel(startDate)} disabled />
        </Form.Item>
        <Form.Item
          name="reading_date"
          label="读数日期"
          rules={[{ required: true, message: '请选择读数日期' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="water_reading" label={<span className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" />水表读数 (m³)</span>}>
            <Input type="number" step="0.01" placeholder="选填" />
          </Form.Item>
          <Form.Item name="electricity_reading" label={<span className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />电表读数 (kWh)</span>}>
            <Input type="number" step="0.01" placeholder="选填" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

function getInitialValues() {
  return {
    water_reading: undefined,
    electricity_reading: undefined,
  };
}

function getPeriodLabel(startDate: string): string {
  const start = new Date(startDate);
  return `${start.getFullYear()}年${start.getMonth() + 1}月`;
}
