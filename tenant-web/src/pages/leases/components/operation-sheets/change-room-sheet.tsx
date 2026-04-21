import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { changeRoomSchema, type ChangeRoomFormData } from '@/schemas/lease-operations';
import { useChangeRoom } from '@/hooks/use-lease-operations';
import { roomsApi, apartmentsApi } from '@/api/apartments';
import { Button, Drawer, Input, Select, DatePicker, Form } from 'antd';

interface ChangeRoomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function ChangeRoomSheet({ open, onOpenChange, orgId, leaseId }: ChangeRoomSheetProps) {
  const form = useForm<ChangeRoomFormData>({
    resolver: zodResolver(changeRoomSchema),
    defaultValues: { newRoomId: '', changeDate: '', reason: '' },
  });

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

  const onSubmit = (data: ChangeRoomFormData) => {
    changeRoom.mutate(data, {
      onSuccess: () => onOpenChange(false),
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
          <Button type="primary" loading={changeRoom.isPending} onClick={form.handleSubmit(onSubmit)}>
            {changeRoom.isPending ? '提交中...' : '确认换房'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">将租约切换到其他房间</p>
      <Form
        layout="vertical"
        onFinish={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Form.Item
          label="目标房间"
          name="newRoomId"
          required
          validateStatus={form.formState.errors.newRoomId ? 'error' : ''}
          help={form.formState.errors.newRoomId?.message}
        >
          <Controller
            name="newRoomId"
            control={form.control}
            render={({ field }) => (
              <Select
                onChange={field.onChange}
                value={field.value}
                placeholder="选择目标房间"
                className="w-full"
              >
                {availableRooms.map((room) => (
                  <Select.Option key={room.id} value={room.id}>
                    {room.apartment?.name} - {room.room_number}
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>
        <Form.Item
          label="变更日期"
          name="changeDate"
          required
          validateStatus={form.formState.errors.changeDate ? 'error' : ''}
          help={form.formState.errors.changeDate?.message}
        >
          <Controller
            name="changeDate"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                value={field.value || ''}
                onChange={(_, dateString) => field.onChange(dateString)}
                className="w-full"
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label="原因备注"
          name="reason"
          validateStatus={form.formState.errors.reason ? 'error' : ''}
          help={form.formState.errors.reason?.message}
        >
          <Controller
            name="reason"
            control={form.control}
            render={({ field }) => <Input {...field} placeholder="可选" />}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
