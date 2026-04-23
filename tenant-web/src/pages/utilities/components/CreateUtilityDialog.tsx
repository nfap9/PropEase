import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Modal, Alert, Button, Input, DatePicker, Select, Radio, Form, InputNumber, Space } from 'antd';
import type { Apartment, Room, UtilityReading } from '@/types';
import { Droplets, Zap } from 'lucide-react';
import { utilitiesApi } from '@/api/utilities';
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

interface ApartmentRoomGroup {
  apartment: Apartment;
  rooms: Room[];
}

interface CreateUtilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UtilityFormData) => void;
  isPending: boolean;
  apartmentRooms: ApartmentRoomGroup[];
  orgId: string;
  preset?: {
    apartmentId: string;
    roomId: string;
    periodYear: number;
    periodMonth: number;
    readingDate: string;
    waterPrevious?: number | null;
    electricityPrevious?: number | null;
  } | null;
}

export function CreateUtilityDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  apartmentRooms,
  orgId,
  preset,
}: CreateUtilityDialogProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const todayDate = today.toISOString().split('T')[0];

  const [existingReading, setExistingReading] = useState<UtilityReading | null>(null);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

  const form = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
    defaultValues: {
      room_id: '',
      period_year: currentYear,
      period_month: currentMonth,
      reading_date: todayDate,
      water_reading: undefined,
      electricity_reading: undefined,
      reading_context: 'normal',
      notes: '',
    },
  });

  // 监听 reading_context 变化（不触发重新渲染整个表单）
  const readingContext = useWatch({ control: form.control, name: 'reading_context' });

  // 监听 room_id, period_year, period_month 用于查询
  const watchedRoomId = useWatch({ control: form.control, name: 'room_id' });
  const watchedYear = useWatch({ control: form.control, name: 'period_year' });
  const watchedMonth = useWatch({ control: form.control, name: 'period_month' });

  useEffect(() => {
    if (!open) return;

    if (preset) {
      setSelectedApartmentId(preset.apartmentId);
      form.reset({
        room_id: preset.roomId,
        period_year: preset.periodYear,
        period_month: preset.periodMonth,
        reading_date: preset.readingDate,
        water_reading: undefined,
        electricity_reading: undefined,
        water_previous: preset.waterPrevious ?? undefined,
        electricity_previous: preset.electricityPrevious ?? undefined,
        reading_context: 'normal',
        notes: '',
      });
      return;
    }

    setSelectedApartmentId(null);
    form.reset({
      room_id: '',
      period_year: currentYear,
      period_month: currentMonth,
      reading_date: todayDate,
      water_reading: undefined,
      electricity_reading: undefined,
      water_previous: undefined,
      electricity_previous: undefined,
      reading_context: 'normal',
      notes: '',
    });
  }, [currentMonth, currentYear, form, open, preset, todayDate]);

  const roomsForSelectedApartment = useMemo(() => {
    const group = apartmentRooms?.find((g) => g.apartment.id === selectedApartmentId);
    return group?.rooms || [];
  }, [apartmentRooms, selectedApartmentId]);

  const handleApartmentChange = (aptId: string) => {
    setSelectedApartmentId(aptId);
    form.setValue('room_id', '');
  };

  const { data: existingReadings = [] } = useQuery({
    queryKey: ['utilities', 'check', orgId, watchedRoomId, watchedYear, watchedMonth],
    queryFn: () =>
      utilitiesApi.list({
        room_id: watchedRoomId || undefined,
        period_year: watchedYear,
        period_month: watchedMonth,
      }),
    enabled: !!orgId && !!watchedRoomId && watchedYear > 0 && watchedMonth > 0,
  });

  const handleSubmit = (data: UtilityFormData) => {
    const existing = existingReadings.find((r) => r.room_id === data.room_id);
    if (existing) {
      setExistingReading(existing);
      return;
    }
    onSubmit({
      ...data,
      anomaly_reason: data.anomaly_reason?.trim() || undefined,
    });
    form.reset();
  };

  const handleConfirmOverride = () => {
    const values = form.getValues();
    onSubmit({
      ...values,
      anomaly_reason: values.anomaly_reason?.trim() || undefined,
    });
    form.reset();
    setExistingReading(null);
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        title="录入水电读数"
        footer={
          <Space>
            <Button onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="primary" loading={isPending} onClick={form.handleSubmit(handleSubmit)}>
              {isPending ? '保存中...' : '保存'}
            </Button>
          </Space>
        }
        className="max-w-lg"
        data-testid="utilities-entry-dialog"
      >
        <p className="text-gray-500 mb-4">录入房间的水电表读数</p>
        <Form layout="vertical" className="space-y-4">
          {/* 公寓选择 */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="公寓">
              <Select
                value={selectedApartmentId || undefined}
                onChange={handleApartmentChange}
                placeholder="选择公寓"
                style={{ width: 180 }}
                options={apartmentRooms?.map(({ apartment }) => ({
                  value: apartment.id,
                  label: apartment.name,
                }))}
              />
            </Form.Item>
            {/* 房间选择 */}
            <Controller
              name="room_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Form.Item label="房间" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                  <Select
                    {...field}
                    value={field.value || undefined}
                    onChange={field.onChange}
                    placeholder={selectedApartmentId ? '选择房间' : '先选公寓'}
                    disabled={!selectedApartmentId}
                    style={{ width: 180 }}
                    options={roomsForSelectedApartment.map((room) => ({
                      value: room.id,
                      label: room.room_number,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </div>

          {/* 年份 */}
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="period_year"
              control={form.control}
              render={({ field }) => (
                <Form.Item label="年份">
                  <Select
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(Number(val))}
                    style={{ width: 140 }}
                    options={Array.from({ length: 3 }, (_, i) => currentYear - 1 + i).map((year) => ({
                      value: year.toString(),
                      label: `${year}年`,
                    }))}
                  />
                </Form.Item>
              )}
            />
            {/* 月份 */}
            <Controller
              name="period_month"
              control={form.control}
              render={({ field }) => (
                <Form.Item label="月份">
                  <Select
                    value={field.value?.toString()}
                    onChange={(val) => field.onChange(Number(val))}
                    style={{ width: 120 }}
                    options={Array.from({ length: 12 }, (_, monthIdx) => monthIdx + 1).map((month) => ({
                      value: month.toString(),
                      label: `${month}月`,
                    }))}
                  />
                </Form.Item>
              )}
            />
          </div>

          {/* 读数日期 */}
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

          {/* 录入场景 */}
          <Controller
            name="reading_context"
            control={form.control}
            render={({ field }) => (
              <Form.Item label="录入场景">
                <Radio.Group value={field.value} onChange={(e) => field.onChange(e.target.value as UtilityFormData['reading_context'])}>
                  <Space direction="horizontal">
                    <Radio value="normal">正常抄表</Radio>
                    <Radio value="initial">首次录入</Radio>
                    <Radio value="meter_reset">更换新表</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            )}
          />

          {readingContext !== 'normal' && (
            <Alert
              type="info"
              message={readingContext === 'initial' ? '首次录入基线' : '更换新表说明'}
              description={
                readingContext === 'initial'
                  ? '首次录入时，系统会把上一读数自动同步为当前值，避免当期误计费用。'
                  : '更换新表后，请填写更换后的起始读数，并补充原因，系统将按你填写的上一读数计算本期用量。'
              }
              icon={<AlertCircle className="h-4 w-4" />}
            />
          )}

          {/* 水电读数 */}
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

          {/* 上一期读数（首次/换表时显示） */}
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
                      placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '换表后请输入新表起始值'}
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
                      placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '换表后请输入新表起始值'}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                )}
              />
            </div>
          )}

          {/* 异常说明 */}
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
                        ? '例如：新租客入住房间，首次建立读数基线'
                        : '例如：旧电表损坏，2026-03-17 更换新表'
                  }
                  rows={2}
                />
              </Form.Item>
            )}
          />

          {/* 备注 */}
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

      {existingReading && (
        <Modal
          open={!!existingReading}
          onCancel={() => setExistingReading(null)}
          title="该账期已有读数"
          onOk={handleConfirmOverride}
          okText="确认覆盖"
          cancelText="取消"
        >
          <p>
            {existingReading.room?.apartment?.name} - {existingReading.room?.room_number}
            {existingReading.period_year}年{existingReading.period_month}月已有读数记录。确定要覆盖吗？
          </p>
        </Modal>
      )}
    </>
  );
}
