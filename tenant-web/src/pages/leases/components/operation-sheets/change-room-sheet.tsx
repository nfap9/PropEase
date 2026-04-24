import { useQuery } from '@tanstack/react-query';
import { useChangeRoom } from '@/pages/leases/hooks/use-lease-operations';
import { roomsApi, apartmentsApi } from '@/api/apartments';
import { Button, Drawer, Input, Select, DatePicker, Form } from 'antd';
import dayjs from 'dayjs';
import type { ChangeRoomFormData } from '@/types';

interface ChangeRoomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function ChangeRoomSheet({ open, onOpenChange, orgId, leaseId }: ChangeRoomSheetProps) {
  const [form] = Form.useForm();
  const changeRoom = useChangeRoom(leaseId);

  const { data: apartments } = useQuery({
    queryKey: ['apartments'],
    queryFn: () => apartmentsApi.list(),
    enabled: open,
  });

  const { data: rooms } = useQuery({
    queryKey: ['all-rooms', apartments?.map((a) => a.id)],
    queryFn: () => roomsApi.listAll(apartments?.map((a) => a.id) || []),
    enabled: open && !!apartments,
  });

  const availableRooms = rooms?.filter((r) => r.status === 'available') || [];

  const onSubmit = (values: Record<string, unknown>) => {
    changeRoom.mutate(values as unknown as ChangeRoomFormData, {
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
      title="换房"
      width={400}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={changeRoom.isPending} onClick={() => form.submit()}>
            {changeRoom.isPending ? '提交中...' : '确认换房'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">将租约切换到其他房间</p>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{ newRoomId: '', changeDate: null, reason: '' }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="newRoomId"
          label="目标房间"
          rules={[{ required: true, message: '请选择目标房间' }]}
        >
          <Select placeholder="选择目标房间" className="w-full">
            {availableRooms.map((room) => (
              <Select.Option key={room.id} value={room.id}>
                {room.apartment?.name} - {room.room_number}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="changeDate"
          label="变更日期"
          rules={[{ required: true, message: '请选择变更日期' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>
        <Form.Item name="reason" label="原因备注">
          <Input placeholder="可选" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
