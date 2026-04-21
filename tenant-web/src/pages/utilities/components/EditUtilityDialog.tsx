import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Droplets, Zap } from 'lucide-react';
import { Modal, Alert, Button, Input, DatePicker, Select, Form } from 'antd';
import { UtilityReading } from '@/types';
import dayjs from 'dayjs';

const optionalNumberField = z
  .union([z.number().min(0), z.nan().transform(() => undefined)])
  .optional();

const utilitySchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  period_year: z.number().min(2020).max(2100),
  period_month: z.number().min(1).max(12),
  reading_date: z.string().min(1, '请选择读数日期'),
  water_reading: optionalNumberField,
  electricity_reading: optionalNumberField,
  water_previous: optionalNumberField,
  electricity_previous: optionalNumberField,
  notes: z.string().optional(),
  reading_context: z.enum(['normal', 'initial', 'meter_reset']),
  anomaly_reason: z.string().max(200, '异常说明请控制在 200 字内').optional(),
});

type UtilityFormData = z.infer<typeof utilitySchema>;

interface EditUtilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UtilityFormData) => void;
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
  const form = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
  });

  useEffect(() => {
    if (utility) {
      form.reset({
        room_id: utility.room_id,
        period_year: utility.period_year,
        period_month: utility.period_month,
        reading_date: utility.reading_date,
        water_reading: utility.water_reading || 0,
        electricity_reading: utility.electricity_reading || 0,
        water_previous: utility.water_previous || undefined,
        electricity_previous: utility.electricity_previous || undefined,
        reading_context: 'normal',
        notes: utility.notes || '',
      });
    }
  }, [utility, form]);

  const handleSubmit = (data: UtilityFormData) => {
    onSubmit({
      ...data,
      anomaly_reason: data.anomaly_reason?.trim() || undefined,
    });
  };

  const roomDisplay = utility?.room
    ? `${utility.room.apartment?.name || ''} - ${utility.room.room_number}`
    : '';
  const readingContext = form.watch('reading_context');

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="编辑水电读数"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="primary" onClick={form.handleSubmit(handleSubmit)} loading={isPending}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </div>
      }
      className="max-w-lg"
    >
      <p className="text-gray-500 mb-4">修改水电表读数</p>
      <Form
        layout="vertical"
        onFinish={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="年份">
            <Input value={utility?.period_year} disabled />
          </Form.Item>
          <Form.Item label="月份">
            <Input value={`${utility?.period_month}月`} disabled />
          </Form.Item>
        </div>
        <Form.Item
          label="读数日期"
          name="reading_date"
          validateStatus={form.formState.errors.reading_date ? 'error' : ''}
          help={form.formState.errors.reading_date?.message}
        >
          <DatePicker
            value={form.watch('reading_date') ? dayjs(form.watch('reading_date')) : null}
            onChange={(date) => form.setValue('reading_date', date?.format('YYYY-MM-DD') || '')}
            className="w-full"
          />
        </Form.Item>
        <Form.Item label="录入场景" name="reading_context">
          <Select
            value={readingContext}
            onChange={(value: UtilityFormData['reading_context']) =>
              form.setValue('reading_context', value)
            }
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
        <Form.Item label="房间">
          <Input value={roomDisplay} disabled />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label={<span className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" />水表读数 (m³)</span>}>
            <Input
              type="number"
              step="0.01"
              {...form.register('water_reading', { valueAsNumber: true })}
            />
          </Form.Item>
          <Form.Item label={<span className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />电表读数 (kWh)</span>}>
            <Input
              type="number"
              step="0.01"
              {...form.register('electricity_reading', { valueAsNumber: true })}
            />
          </Form.Item>
        </div>
        {readingContext !== 'normal' && (
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="水表上一读数">
              <Input
                type="number"
                step="0.01"
                placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '请输入新表起始值'}
                {...form.register('water_previous', { valueAsNumber: true })}
              />
            </Form.Item>
            <Form.Item label="电表上一读数">
              <Input
                type="number"
                step="0.01"
                placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '请输入新表起始值'}
                {...form.register('electricity_previous', { valueAsNumber: true })}
              />
            </Form.Item>
          </div>
        )}
        <Form.Item
          label={
            readingContext === 'normal'
              ? '异常说明（可选）'
              : readingContext === 'initial'
                ? '说明（可选）'
                : '更换原因 *'
          }
        >
          <Input
            placeholder={
              readingContext === 'normal'
                ? '如遇到暴涨用量、人工核对等特殊情况，可在此说明'
                : readingContext === 'initial'
                  ? '例如：补录本租约第一期读数'
                  : '例如：旧水表故障，本月已更换'
            }
            {...form.register('anomaly_reason')}
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input placeholder="请输入备注" {...form.register('notes')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
