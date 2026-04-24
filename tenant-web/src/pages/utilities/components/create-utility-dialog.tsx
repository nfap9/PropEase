import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Modal, Alert, Button, Input, DatePicker, Select, Radio, Form, InputNumber, Space } from 'antd';
import type { Apartment, Room, UtilityReading } from '@/types';
import { Droplets, Zap } from 'lucide-react';
import { utilitiesApi } from '@/api/utilities';
import dayjs from 'dayjs';

interface ApartmentRoomGroup {
  apartment: Apartment;
  rooms: Room[];
}

interface CreateUtilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
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

  const [form] = Form.useForm();
  const [existingReading, setExistingReading] = useState<UtilityReading | null>(null);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

  const readingContext = Form.useWatch('reading_context', form);

  useEffect(() => {
    if (!open) return;

    if (preset) {
      setSelectedApartmentId(preset.apartmentId);
      form.setFieldsValue({
        room_id: preset.roomId,
        period_year: preset.periodYear,
        period_month: preset.periodMonth,
        reading_date: dayjs(preset.readingDate),
        water_reading: undefined,
        electricity_reading: undefined,
        water_previous: preset.waterPrevious ?? undefined,
        electricity_previous: preset.electricityPrevious ?? undefined,
        reading_context: 'normal',
        notes: '',
        anomaly_reason: '',
      });
      return;
    }

    setSelectedApartmentId(null);
    form.setFieldsValue({
      room_id: undefined,
      period_year: currentYear,
      period_month: currentMonth,
      reading_date: dayjs(todayDate),
      water_reading: undefined,
      electricity_reading: undefined,
      water_previous: undefined,
      electricity_previous: undefined,
      reading_context: 'normal',
      notes: '',
      anomaly_reason: '',
    });
  }, [currentMonth, currentYear, form, open, preset, todayDate]);

  const roomsForSelectedApartment = useMemo(() => {
    const group = apartmentRooms?.find((g) => g.apartment.id === selectedApartmentId);
    return group?.rooms || [];
  }, [apartmentRooms, selectedApartmentId]);

  const watchedRoomId = Form.useWatch('room_id', form);
  const watchedYear = Form.useWatch('period_year', form);
  const watchedMonth = Form.useWatch('period_month', form);

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

  const handleApartmentChange = (aptId: string) => {
    setSelectedApartmentId(aptId);
    form.setFieldValue('room_id', undefined);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const existing = existingReadings.find((r) => r.room_id === values.room_id);
      if (existing) {
        setExistingReading(existing);
        return;
      }
      onSubmit({
        ...values,
        reading_date: values.reading_date?.format('YYYY-MM-DD') ?? '',
        water_reading: values.water_reading ?? undefined,
        electricity_reading: values.electricity_reading ?? undefined,
        water_previous: values.water_previous ?? undefined,
        electricity_previous: values.electricity_previous ?? undefined,
        anomaly_reason: values.anomaly_reason?.trim() || undefined,
      });
      form.resetFields();
    });
  };

  const handleConfirmOverride = () => {
    const values = form.getFieldsValue();
    onSubmit({
      ...values,
      reading_date: values.reading_date?.format('YYYY-MM-DD') ?? '',
      water_reading: values.water_reading ?? undefined,
      electricity_reading: values.electricity_reading ?? undefined,
      water_previous: values.water_previous ?? undefined,
      electricity_previous: values.electricity_previous ?? undefined,
      anomaly_reason: values.anomaly_reason?.trim() || undefined,
    });
    form.resetFields();
    setExistingReading(null);
  };

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i).map((year) => ({
    value: year,
    label: `${year}年`,
  }));

  return (
    <>
      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        title="录入水电读数"
        footer={
          <Space>
            <Button onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit}>
              {isPending ? '保存中...' : '保存'}
            </Button>
          </Space>
        }
        className="max-w-lg"
        data-testid="utilities-entry-dialog"
      >
        <p className="text-gray-500 mb-4">录入房间的水电表读数</p>
        <Form form={form} layout="vertical" className="space-y-4">
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
            <Form.Item
              name="room_id"
              label="房间"
              rules={[{ required: true, message: '请选择房间' }]}
            >
              <Select
                placeholder={selectedApartmentId ? '选择房间' : '先选公寓'}
                disabled={!selectedApartmentId}
                style={{ width: 180 }}
                options={roomsForSelectedApartment.map((room) => ({
                  value: room.id,
                  label: room.room_number,
                }))}
              />
            </Form.Item>
          </div>

          {/* 年份 */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="period_year"
              label="年份"
              rules={[{ required: true, message: '请选择年份' }]}
            >
              <Select
                style={{ width: 140 }}
                options={yearOptions}
              />
            </Form.Item>
            <Form.Item
              name="period_month"
              label="月份"
              rules={[{ required: true, message: '请选择月份' }]}
            >
              <Select
                style={{ width: 120 }}
                options={Array.from({ length: 12 }, (_, monthIdx) => monthIdx + 1).map((month) => ({
                  value: month,
                  label: `${month}月`,
                }))}
              />
            </Form.Item>
          </div>

          {/* 读数日期 */}
          <Form.Item
            name="reading_date"
            label="读数日期"
            rules={[{ required: true, message: '请选择读数日期' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          {/* 录入场景 */}
          <Form.Item name="reading_context" label="录入场景">
            <Radio.Group>
              <Space direction="horizontal">
                <Radio value="normal">正常抄表</Radio>
                <Radio value="initial">首次录入</Radio>
                <Radio value="meter_reset">更换新表</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

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
            <Form.Item name="water_reading" label={<span className="flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" />水表读数 (m³)</span>}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="electricity_reading" label={<span className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />电表读数 (kWh)</span>}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* 上一期读数（首次/换表时显示） */}
          {readingContext !== 'normal' && (
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="water_previous" label="水表上一读数">
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '换表后请输入新表起始值'}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="electricity_previous" label="电表上一读数">
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '换表后请输入新表起始值'}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          )}

          {/* 异常说明 */}
          <Form.Item
            name="anomaly_reason"
            label={
              readingContext === 'normal'
                ? '异常说明（可选）'
                : readingContext === 'initial'
                  ? '说明（可选）'
                  : '更换原因 *'
            }
            rules={readingContext === 'meter_reset' ? [{ required: true, message: '请填写更换原因' }] : []}
          >
            <Input.TextArea
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

          {/* 备注 */}
          <Form.Item name="notes" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={2} />
          </Form.Item>
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
