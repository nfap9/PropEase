import { forwardRef, useImperativeHandle } from 'react';
import { Form, Select } from 'antd';
import type { Room, Apartment } from '@propease/api-contract';

export interface RoomInfoSectionRef {
  validate: () => Promise<void>;
  getValues: () => { room_id: string };
}

interface RoomInfoSectionProps {
  room?: Room | null;
  isRoomSpecified: boolean;
  apartments?: Apartment[];
  rooms?: Room[];
  selectedApartmentId: string | null;
  onApartmentChange: (id: string) => void;
}

export const RoomInfoSection = forwardRef<RoomInfoSectionRef, RoomInfoSectionProps>(function RoomInfoSection(
  { room, isRoomSpecified, apartments, rooms, selectedApartmentId, onApartmentChange },
  ref
) {
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    validate: async () => {
      if (!isRoomSpecified) {
        await form.validateFields(['room_id']);
      }
    },
    getValues: () => form.getFieldsValue(),
  }));

  return (
    <Form form={form} layout="vertical">
      {isRoomSpecified && room ? (
        <Form.Item>
          <p className="text-sm text-gray-500">
            {room.apartment?.name || '未知公寓'} - {room.room_number}
          </p>
          <input type="hidden" name="room_id" value={room.id} />
        </Form.Item>
      ) : (
        <>
          <Form.Item label="公寓" name="apartment_id">
            <Select
              value={selectedApartmentId || ''}
              onChange={onApartmentChange}
              placeholder="请选择公寓"
              options={apartments?.map((apt) => ({ label: apt.name, value: apt.id }))}
            />
          </Form.Item>
          <Form.Item
            label="房间"
            name="room_id"
            rules={[{ required: true, message: '请选择房间' }]}
          >
            <Select
              placeholder="请选择空置房间"
              onChange={(v) => {
                const selected = rooms?.find((r) => r.id === v);
                if (selected?.pricing?.monthly_rent) {
                  form.setFieldValue('monthly_rent', selected.pricing.monthly_rent);
                }
              }}
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
    </Form>
  );
});
