import { useEffect } from 'react';
import { AlertCircle, Droplets, Zap } from 'lucide-react';
import { Modal, Alert, Button, Input, DatePicker, Select, Form, InputNumber, Space } from 'antd';
import type { UtilityReading } from '@/types';
import dayjs from 'dayjs';

interface EditUtilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  utility: UtilityReading | null;
}

export function EditUtilityDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  utility,
}: EditUtilityDialogProps) {
  const [form] = Form.useForm();

  const readingContext = Form.useWatch('reading_context', form);

  useEffect(() => {
    if (utility) {
      form.setFieldsValue({
        reading_date: utility.reading_date ? dayjs(utility.reading_date) : null,
        water_reading: utility.water_reading ?? undefined,
        electricity_reading: utility.electricity_reading ?? undefined,
        water_previous: utility.water_previous ?? undefined,
        electricity_previous: utility.electricity_previous ?? undefined,
        reading_context: 'normal',
        notes: utility.notes ?? '',
        anomaly_reason: '',
      });
    }
  }, [utility, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit({
        ...values,
        reading_date: values.reading_date?.format('YYYY-MM-DD') ?? '',
        water_reading: values.water_reading ?? undefined,
        electricity_reading: values.electricity_reading ?? undefined,
        water_previous: values.water_previous ?? undefined,
        electricity_previous: values.electricity_previous ?? undefined,
        anomaly_reason: values.anomaly_reason?.trim() || undefined,
      });
    });
  };

  const roomDisplay = utility?.room
    ? `${utility.room.apartment?.name || ''} - ${utility.room.room_number}`
    : '';

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="编辑水电读数"
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={isPending} onClick={handleSubmit}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </Space>
      }
      className="max-w-lg"
    >
      <p className="text-gray-500 mb-4">修改水电表读数</p>
      <Form form={form} layout="vertical" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="年份">
            <Input value={utility?.period_year} disabled />
          </Form.Item>
          <Form.Item label="月份">
            <Input value={`${utility?.period_month}月`} disabled />
          </Form.Item>
        </div>

        <Form.Item label="房间">
          <Input value={roomDisplay} disabled />
        </Form.Item>

        <Form.Item
          name="reading_date"
          label="读数日期"
          rules={[{ required: true, message: '请选择读数日期' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>

        <Form.Item name="reading_context" label="录入场景">
          <Select
            style={{ width: '100%' }}
            options={[
              { value: 'normal', label: '正常抄表' },
              { value: 'initial', label: '首次录入' },
              { value: 'meter_reset', label: '更换新表' },
            ]}
          />
        </Form.Item>

        {readingContext !== 'normal' && (
          <Alert
            type="info"
            message={readingContext === 'initial' ? '首次录入基线' : '更换新表说明'}
            description={
              readingContext === 'initial'
                ? '首次录入时会自动把上一读数同步为当前值，适合补录历史首期读数。'
                : '换表后请改成新表当前值，并填写新表起始读数与原因。'
            }
            icon={<AlertCircle className="h-4 w-4" />}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="water_reading" label={<span className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" />水表读数 (m³)</span>}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="electricity_reading" label={<span className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />电表读数 (kWh)</span>}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        {readingContext !== 'normal' && (
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="water_previous" label="水表上一读数">
              <InputNumber
                min={0}
                step={0.01}
                placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '请输入新表起始值'}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="electricity_previous" label="电表上一读数">
              <InputNumber
                min={0}
                step={0.01}
                placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '请输入新表起始值'}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
        )}

        <Form.Item
          name="anomaly_reason"
          label={
            readingContext === 'normal'
              ? '异常说明（可选）'
              : readingContext === 'initial'
                ? '说明（可选）'
                : '更换原因 *'
          }
        >
          <Input.TextArea
            placeholder={
              readingContext === 'normal'
                ? '如遇到暴涨用量、人工核对等特殊情况，可在此说明'
                : readingContext === 'initial'
                  ? '例如：补录本租约第一期读数'
                  : '例如：旧水表故障，本月已更换'
            }
            rows={2}
          />
        </Form.Item>

        <Form.Item name="notes" label="备注">
          <Input.TextArea placeholder="请输入备注" rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
