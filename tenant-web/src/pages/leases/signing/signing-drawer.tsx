import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Drawer, Form, Select, Input, DatePicker, InputNumber } from 'antd';
import { leasesApi } from '@/api/leases';
import { apartmentsApi, roomsApi, apartmentConfigApi } from '@/api/apartments';
import { toDateInputValue } from '@/utils/date';
import { getErrorMessage } from '@propease/web-shared';
import { FeeItemsEditor, type FeeItem } from './fee-items-editor';
import type { Room, ApartmentConfig } from '@propease/api-contract';

interface SubmitData {
  room_id?: string;
  tenant_name: string;
  tenant_phone: string;
  tenant_id_card?: string;
  tenant_emergency_contact?: string;
  tenant_emergency_phone?: string;
  tenant_notes?: string;
  start_date: string;
  end_date?: string;
  monthly_rent: number;
  deposit?: number;
  water_rate?: number;
  electricity_rate?: number;
  notes?: string;
}

interface LeaseSigningDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSuccess?: () => void;
  onLeaseCreated?: (params: {
    room_id: string;
    room_display: string;
    start_date: string;
    is_historical_entry: boolean;
  }) => void;
}

export function LeaseSigningDrawer({
  orgId,
  open,
  onOpenChange,
  room,
  onSuccess,
  onLeaseCreated,
}: LeaseSigningDrawerProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [apartmentConfig, setApartmentConfig] = useState<ApartmentConfig | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);

  const isRoomSpecified = !!room;

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId && !isRoomSpecified,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(selectedApartmentId!),
    enabled: !!orgId && !isRoomSpecified && selectedApartmentId !== null,
  });

  const effectiveApartmentId = isRoomSpecified ? room?.apartment_id : selectedApartmentId;

  useEffect(() => {
    if (effectiveApartmentId && open) {
      apartmentConfigApi
        .get(effectiveApartmentId)
        .then(setApartmentConfig)
        .catch(() => setApartmentConfig(null));
    } else {
      setApartmentConfig(null);
    }
  }, [effectiveApartmentId, orgId, open]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        ...(isRoomSpecified && room ? { room_id: room.id } : {}),
        monthly_rent: room?.pricing?.monthly_rent ?? 0,
        deposit: 0,
        water_rate: apartmentConfig?.water_price_per_unit ?? 0,
        electricity_rate: apartmentConfig?.electricity_price_per_unit ?? 0,
      });
      setFeeItems([]);
      setSelectedApartmentId(null);
    }
  }, [open, room, apartmentConfig, form, isRoomSpecified]);

  const createMutation = useMutation({
    mutationFn: async (data: SubmitData) => {
      const leaseData = {
        room_id: data.room_id!,
        tenant_info: {
          name: data.tenant_name,
          phone: data.tenant_phone,
          id_card: data.tenant_id_card,
          emergency_contact: data.tenant_emergency_contact,
          emergency_phone: data.tenant_emergency_phone,
          notes: data.tenant_notes,
        },
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        monthly_rent: data.monthly_rent,
        deposit: data.deposit,
        water_rate: data.water_rate,
        electricity_rate: data.electricity_rate,
        notes: data.notes,
      };
      if (feeItems && feeItems.length > 0) {
        (leaseData as Record<string, unknown>).fee_items = feeItems.map((item) => ({
          fee_name: item.name,
          fee_amount: item.amount,
          fee_cycle: item.cycle,
          quantity: 1,
          notes: item.notes || undefined,
        }));
      }
      const lease = await leasesApi.create(leaseData);
      return { lease, data };
    },
    onSuccess: ({ lease: createdLease, data: variables }) => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      toast.success('签约成功');
      const startDate = createdLease.start_date;
      const isHistoricalEntry = variables.start_date < toDateInputValue(new Date());
      const matchedRoom = room ?? rooms?.find((r) => r.id === variables.room_id);
      const aptName =
        matchedRoom?.apartment?.name ?? apartments?.find((a) => a.id === matchedRoom?.apartment_id)?.name ?? '';
      const roomDisplay = matchedRoom ? `${aptName} - ${matchedRoom.room_number}` : '';
      onLeaseCreated?.({
        room_id: createdLease.room_id,
        room_display: roomDisplay,
        start_date: startDate,
        is_historical_entry: isHistoricalEntry,
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, '签约失败，请重试')),
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        start_date: values.start_date?.format ? values.start_date.format('YYYY-MM-DD') : values.start_date,
        end_date: values.end_date?.format ? values.end_date.format('YYYY-MM-DD') : values.end_date,
      };
      createMutation.mutate(data);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleDrawerOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={() => handleDrawerOpenChange(false)}
        title="合同签约"
        footer={
          <Button type="primary" onClick={handleSubmit} disabled={createMutation.isPending}>
            确认签约
          </Button>
        }
        placement="right"
        width={600}
      >
        <Form form={form} layout="vertical" className="px-2" size="large">
          {isRoomSpecified && room ? (
            <Form.Item>
              <p className="text-sm text-gray-500">
                {room.apartment?.name || '未知公寓'} - {room.room_number}
              </p>
            </Form.Item>
          ) : (
            <>
              <Form.Item label="公寓" name="apartment_id">
                <Select
                  value={selectedApartmentId || ''}
                  onChange={setSelectedApartmentId}
                  placeholder="请选择公寓"
                  options={apartments?.map((apt) => ({ label: apt.name, value: apt.id }))}
                />
              </Form.Item>
              <Form.Item label="房间" name="room_id" rules={[{ required: true, message: '请选择房间' }]}>
                <Select
                  placeholder="请选择空置房间"
                  options={rooms
                    ?.filter((r: Room) => r.status === 'available')
                    .map((r: Room) => ({
                      label: `${r.room_number} - ¥${r.pricing?.monthly_rent || 0}/月`,
                      value: r.id,
                    }))}
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="租客姓名" name="tenant_name" rules={[{ required: true, message: '请输入租客姓名' }]}>
            <Input placeholder="请输入租客姓名" />
          </Form.Item>
          <Form.Item label="联系电话" name="tenant_phone" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item label="身份证号" name="tenant_id_card">
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item label="紧急联系人" name="tenant_emergency_contact">
            <Input placeholder="请输入紧急联系人" />
          </Form.Item>
          <Form.Item label="紧急联系电话" name="tenant_emergency_phone">
            <Input placeholder="请输入紧急联系电话" />
          </Form.Item>

          <Form.Item label="开始日期" name="start_date" rules={[{ required: true, message: '请选择开始日期' }]}>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label="结束日期" name="end_date">
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label="月租" name="monthly_rent" rules={[{ required: true, message: '请输入月租' }]}>
            <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
          </Form.Item>
          <Form.Item label="押金" name="deposit">
            <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
          </Form.Item>

          <FeeItemsEditor items={feeItems} onChange={setFeeItems} />

          <Form.Item label="水费单价" name="water_rate">
            <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
          </Form.Item>
          <Form.Item label="电费单价" name="electricity_rate">
            <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
          </Form.Item>
          <Form.Item label="备注" name="notes">
            <Input.TextArea placeholder="备注信息" rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
