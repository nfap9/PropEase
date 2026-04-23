import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Modal, Input, Select, DatePicker, Form } from 'antd';
import { TenantSelectWithCreate } from '@/components/common/tenant-select-with-create';
import { FeeItemsEditor, type FeeItem } from '@/components/common/fee-items-editor';
import { leasesApi } from '@/api/leases';
import { apartmentsApi, roomsApi, utilityConfigApi } from '@/api/apartments';
import { toDateInputValue } from '@/utils/date';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { Room, Apartment } from '@/types';
import type { UtilityConfig } from '@apartment-ultra/api-contract';

export interface LeaseCreatedParams {
  room_id: string;
  room_display: string;
  start_date: string;
  is_historical_entry: boolean;
}

export interface LeaseFormDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSuccess?: () => void;
  onLeaseCreated?: (params: LeaseCreatedParams) => void;
}

export function LeaseFormDialog({
  orgId,
  open,
  onOpenChange,
  room,
  onSuccess,
  onLeaseCreated,
}: LeaseFormDialogProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [utilityConfig, setUtilityConfig] = useState<UtilityConfig | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);

  const isRoomSpecified = !!room;

  // Watch form values
  // 获取公寓列表
  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId && !isRoomSpecified,
  });

  // 获取房间列表
  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(selectedApartmentId!),
    enabled: !!orgId && !isRoomSpecified && selectedApartmentId !== null,
  });

  const roomId = Form.useWatch('room_id', form);
  const tenantId = Form.useWatch('tenant_id', form);
  const startDate = Form.useWatch('start_date', form);
  const endDate = Form.useWatch('end_date', form);

  const effectiveApartmentId = isRoomSpecified
    ? room?.apartment_id
    : rooms?.find((r) => r.id === roomId)?.apartment_id;

  // 获取水电配置
  useEffect(() => {
    if (effectiveApartmentId && open) {
      utilityConfigApi.get(effectiveApartmentId).then(setUtilityConfig).catch(() => setUtilityConfig(null));
    } else {
      setUtilityConfig(null);
    }
  }, [effectiveApartmentId, orgId, open]);

  // 当水电配置变化时，更新表单
  const updateFormWithUtilityConfig = useCallback(() => {
    if (utilityConfig) {
      if (utilityConfig.water_price_per_unit != null) {
        form.setFieldValue('water_rate', utilityConfig.water_price_per_unit);
      }
      if (utilityConfig.electricity_price_per_unit != null) {
        form.setFieldValue('electricity_rate', utilityConfig.electricity_price_per_unit);
      }
    }
  }, [utilityConfig, form]);

  useEffect(() => {
    updateFormWithUtilityConfig();
  }, [updateFormWithUtilityConfig]);

  // 初始化/重置表单
  useEffect(() => {
    if (room && open) {
      const waterPrice = utilityConfig?.water_price_per_unit ?? 0;
      const elecPrice = utilityConfig?.electricity_price_per_unit ?? 0;
      form.setFieldsValue({
        room_id: room.id,
        tenant_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: undefined,
        monthly_rent: room.pricing?.monthly_rent ?? 0,
        deposit: 0,
        water_rate: waterPrice,
        electricity_rate: elecPrice,
        notes: '',
      });
    } else if (!isRoomSpecified && open) {
      form.setFieldsValue({
        room_id: undefined,
        tenant_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: undefined,
        monthly_rent: 0,
        deposit: 0,
        water_rate: 0,
        electricity_rate: 0,
        notes: '',
      });
      setSelectedApartmentId(null);
    }
    setFeeItems([]);
  }, [room, open, isRoomSpecified]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown> & { fee_items?: FeeItem[] }) => {
      const { fee_items, ...rest } = data;
      const payload = filterEmptyStrings(rest);
      const items = fee_items ?? [];
      if (items.length > 0) {
        (payload as Record<string, unknown>).fee_items = items.map((item) => ({
          fee_name: item.name,
          fee_amount: item.amount,
          fee_cycle: item.cycle,
          quantity: 1,
          notes: item.notes || undefined,
        }));
      }
      return leasesApi.create(payload as Parameters<typeof leasesApi.create>[0]);
    },
    onSuccess: (createdLease, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      onOpenChange(false);
      form.resetFields();
      toast.success('签约成功');
      const roomId = createdLease.room_id;
      const startDateVal = createdLease.start_date;
      const isHistoricalEntry = (variables.start_date as string) < toDateInputValue(new Date());
      const matchedRoom = room ?? rooms?.find((r) => r.id === variables.room_id);
      const aptName =
        matchedRoom?.apartment?.name ??
        apartments?.find((a) => a.id === matchedRoom?.apartment_id)?.name ??
        '';
      const roomDisplay = matchedRoom ? `${aptName} - ${matchedRoom.room_number}` : '';
      onLeaseCreated?.({
        room_id: roomId,
        room_display: roomDisplay,
        start_date: startDateVal,
        is_historical_entry: isHistoricalEntry,
      });
      onSuccess?.();
    },
    onError: (error) => toast.error(getErrorMessage(error, '签约失败，请重试')),
  });

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      createMutation.mutate({ ...values, fee_items: feeItems });
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={isRoomSpecified ? '签约' : '新增租约'}
      width={720}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)} data-testid="leases-cancel-btn">取消</Button>,
        <Button key="submit" type="primary" loading={createMutation.isPending} onClick={handleSubmit} data-testid="leases-confirm-btn">
          {createMutation.isPending ? '创建中...' : '确认签约'}
        </Button>,
      ]}
    >
      <div className="mb-4 text-sm text-gray-600">
        {isRoomSpecified && room
          ? `为房间 ${room.room_number} 创建租约`
          : '创建新的租约'}
      </div>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
      >
        {isRoomSpecified ? (
          <Form.Item label="房间">
            <Input value={room ? `${room.apartment?.name || ''} - ${room.room_number}` : ''} disabled />
          </Form.Item>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="选择公寓">
              <Select
                value={selectedApartmentId || undefined}
                onChange={(value) => {
                  setSelectedApartmentId(value);
                  form.setFieldValue('room_id', undefined);
                }}
                placeholder="选择公寓"
                data-testid="leases-apartment-select"
              >
                {apartments?.map((apt: Apartment) => (
                  <Select.Option key={apt.id} value={apt.id}>{apt.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="room_id"
              label="选择房间"
              rules={[{ required: true, message: '请选择房间' }]}
            >
              <Select
                value={roomId}
                onChange={(value) => form.setFieldValue('room_id', value)}
                placeholder="选择房间"
                data-testid="leases-room-select"
              >
                {rooms
                  ?.filter((r) => r.status === 'available')
                  .map((r: Room) => (
                    <Select.Option key={r.id} value={r.id}>
                      {r.room_number} {r.pricing?.monthly_rent ? `- ¥${r.pricing.monthly_rent}/月` : '- 暂无定价'}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          </div>
        )}

        <Form.Item
          name="tenant_id"
          label="选择租客"
          rules={[{ required: true, message: '请选择租客' }]}
        >
          <div data-testid="leases-tenant-select">
            <TenantSelectWithCreate
              orgId={orgId}
              value={tenantId}
              onValueChange={(value) => form.setFieldValue('tenant_id', value)}
              error={form.getFieldError('tenant_id')?.[0]}
            />
          </div>
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="start_date"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker
              value={startDate}
              onChange={(_, dateString) => form.setFieldValue('start_date', dateString)}
              className="w-full"
              data-testid="leases-start-date-input"
            />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期">
            <DatePicker
              value={endDate}
              onChange={(_, dateString) => form.setFieldValue('end_date', dateString || undefined)}
              className="w-full"
              data-testid="leases-end-date-input"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="monthly_rent"
            label="月租 (元)"
            rules={[{ required: true, message: '请输入月租' }, { type: 'number', min: 0, message: '月租不能为负' }]}
          >
            <Input type="number" step="0.01" placeholder="请输入月租金额" data-testid="leases-monthly-rent-input" />
          </Form.Item>
          <Form.Item
            name="deposit"
            label="押金 (元)"
            rules={[{ type: 'number', min: 0, message: '押金不能为负' }]}
          >
            <Input type="number" step="0.01" placeholder="请输入押金金额" data-testid="leases-deposit-input" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="water_rate"
            label={
              <span>
                水费单价（元/吨）
                {utilityConfig?.water_price_per_unit != null && (
                  <span className="text-gray-500 text-xs ml-1">(公寓配置: ¥{utilityConfig.water_price_per_unit}/吨)</span>
                )}
              </span>
            }
            rules={[{ type: 'number', min: 0, message: '价格不能为负' }]}
          >
            <Input type="number" step="0.01" placeholder="请输入水费单价" />
          </Form.Item>
          <Form.Item
            name="electricity_rate"
            label={
              <span>
                电费单价（元/度）
                {utilityConfig?.electricity_price_per_unit != null && (
                  <span className="text-gray-500 text-xs ml-1">(公寓配置: ¥{utilityConfig.electricity_price_per_unit}/度)</span>
                )}
              </span>
            }
            rules={[{ type: 'number', min: 0, message: '价格不能为负' }]}
          >
            <Input type="number" step="0.01" placeholder="请输入电费单价" />
          </Form.Item>
        </div>

        <FeeItemsEditor items={feeItems} onChange={setFeeItems} />

        <Form.Item name="notes" label="备注">
          <Input placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
