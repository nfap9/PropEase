import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Droplets, Zap } from 'lucide-react';
import { Modal, Alert, Button, Input, DatePicker, Select, Form, InputNumber, Space } from 'antd';
import type { UtilityReading } from '@/types';
import dayjs from 'dayjs';

const utilitySchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  period_year: z.number().min(2020).max(2100),
  period_month: z.number().min(1).max(12),
  reading_date: z.string().min(1, '请选择读数日期'),
  water_reading: z.number().min(0).optional(),
  electricity_reading: z.number().min(0).optional(),
  water_previous: z.number().min(0).optional(),
  electricity_previous: z.number().min(0).optional(),
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

  const readingContext = useWatch({ control: form.control, name: 'reading_context' });

  useEffect(() => {
    if (utility) {
      form.reset({
        room_id: utility.room_id,
        period_year: utility.period_year,
        period_month: utility.period_month,
        reading_date: utility.reading_date,
        water_reading: utility.water_reading ?? undefined,
        electricity_reading: utility.electricity_reading ?? undefined,
        water_previous: utility.water_previous ?? undefined,
        electricity_previous: utility.electricity_previous ?? undefined,
        reading_context: 'normal',
        notes: utility.notes ?? '',
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

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="编辑水电读数"
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={isPending} onClick={form.handleSubmit(handleSubmit)}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </Space>
      }
      className="max-w-lg"
    >
      <p className="text-gray-500 mb-4">修改水电表读数</p>
      <Form layout="vertical" className="space-y-4">
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

        <Controller
          name="reading_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="读数日期"
              required
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <DatePicker
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
                className="w-full"
              />
            </Form.Item>
          )}
        />

        <Controller
          name="reading_context"
          control={form.control}
          render={({ field }) => (
            <Form.Item label="录入场景">
              <Select
                value={field.value}
                onChange={field.onChange}
                style={{ width: '100%' }}
                options={[
                  { value: 'normal', label: '正常抄表' },
                  { value: 'initial', label: '首次录入' },
                  { value: 'meter_reset', label: '更换新表' },
                ]}
              />
            </Form.Item>
          )}
        />

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
          <Controller
            name="water_reading"
            control={form.control}
            render={({ field }) => (
              <Form.Item label={<span className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" />水表读数 (m³)</span>}>
                <InputNumber
                  {...field}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val ?? '')}
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
          />
          <Controller
            name="electricity_reading"
            control={form.control}
            render={({ field }) => (
              <Form.Item label={<span className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />电表读数 (kWh)</span>}>
                <InputNumber
                  {...field}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val ?? '')}
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
          />
        </div>

        {readingContext !== 'normal' && (
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="water_previous"
              control={form.control}
              render={({ field }) => (
                <Form.Item label="水表上一读数">
                  <InputNumber
                    {...field}
                    value={field.value ?? ''}
                    onChange={(val) => field.onChange(val ?? '')}
                    min={0}
                    step={0.01}
                    placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '请输入新表起始值'}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
            />
            <Controller
              name="electricity_previous"
              control={form.control}
              render={({ field }) => (
                <Form.Item label="电表上一读数">
                  <InputNumber
                    {...field}
                    value={field.value ?? ''}
                    onChange={(val) => field.onChange(val ?? '')}
                    min={0}
                    step={0.01}
                    placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '请输入新表起始值'}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
            />
          </div>
        )}

        <Controller
          name="anomaly_reason"
          control={form.control}
          render={({ field }) => (
            <Form.Item
              label={
                readingContext === 'normal'
                  ? '异常说明（可选）'
                  : readingContext === 'initial'
                    ? '说明（可选）'
                    : '更换原因 *'
              }
            >
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
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
          )}
        />

        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <Form.Item label="备注">
              <Input.TextArea {...field} value={field.value ?? ''} placeholder="请输入备注" rows={2} />
            </Form.Item>
          )}
        />
      </Form>
    </Modal>
  );
}
