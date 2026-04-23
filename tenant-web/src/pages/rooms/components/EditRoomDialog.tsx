import { useEffect, useState } from 'react';
import { Modal, Button, Input, Select, InputNumber, Form } from 'antd';
import { Settings2 } from 'lucide-react';
import { Room, RoomFacilities } from '@/types';
import { FacilitySelectorDialog } from '@/components/common/facility-selector-dialog';
import { getFacilityLabel } from '@/utils/facilities';
import type { RoomEditFormData } from '@apartment-ultra/api-contract';

const LAYOUT_OPTIONS = [
  '单间',
  '一室一厅',
  '两室一厅',
  '三室一厅',
  '三室两厅',
  '四室两厅',
  '复式',
  'Loft',
];

interface EditRoomDialogProps {
  testids?: Record<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoomEditFormData & { facilities?: RoomFacilities | null }) => void;
  isPending: boolean;
  room: Room | null;
}

function getFacilitiesSummary(facilities: RoomFacilities | null): string {
  if (!facilities || (facilities.furniture.length === 0 && facilities.appliances.length === 0)) {
    return '未配置';
  }
  const allItems = [...facilities.furniture, ...facilities.appliances];
  const count = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const names = allItems.slice(0, 4).map((item) => {
    const label = getFacilityLabel(item.code);
    return item.quantity > 1 ? `${label}×${item.quantity}` : label;
  });
  const remaining = allItems.length - 4;
  const summary = names.join('、');
  return remaining > 0 ? `${summary} 等${count}件` : `${summary} 共${count}件`;
}

export function EditRoomDialog({
  testids,
  open,
  onOpenChange,
  onSubmit,
  isPending,
  room,
}: EditRoomDialogProps) {
  const [form] = Form.useForm();
  const [facilities, setFacilities] = useState<RoomFacilities | null>(null);
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
  const layout = Form.useWatch('layout', form);

  useEffect(() => {
    if (room) {
      form.setFieldsValue({
        room_number: room.room_number,
        layout: room.layout || '',
        maintenance: room.maintenance,
        area: room.area || 0,
        monthly_rent: room.pricing?.monthly_rent ?? 0,
        notes: room.notes || '',
      });
      setFacilities(room.facilities);
    }
  }, [room, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit({ ...values, facilities });
    });
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        title="编辑房间"
        footer={[
          <Button key="cancel" onClick={() => onOpenChange(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} loading={isPending}>
            {isPending ? '保存中...' : '保存'}
          </Button>,
        ]}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">所属公寓</span>
            <Input value={room?.apartment?.name || ''} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">房间号 *</span>
              <Form.Item name="room_number" rules={[{ required: true, message: '请输入房间号' }]} style={{ marginBottom: 0 }}>
                <Input data-testid={testids?.NUMBER_INPUT} />
              </Form.Item>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">户型</span>
              <Form.Item name="layout" style={{ marginBottom: 0 }}>
                <Select
                  value={layout}
                  onChange={(value) => form.setFieldValue('layout', value)}
                  className="w-full"
                  placeholder="选择户型"
                  options={LAYOUT_OPTIONS.map((l) => ({ value: l, label: l }))}
                />
              </Form.Item>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">面积 (m²)</span>
            <Form.Item name="area" rules={[{ type: 'number', min: 0, message: '面积不能为负' }]} style={{ marginBottom: 0 }}>
              <InputNumber
                min={0}
                step={0.01}
                data-testid={testids?.AREA_INPUT}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">月租 (元) *</span>
            <Form.Item name="monthly_rent" rules={[{ required: true, message: '请输入月租' }, { type: 'number', min: 0, message: '月租不能为负' }]} style={{ marginBottom: 0 }}>
              <InputNumber
                min={0}
                step={0.01}
                data-testid={testids?.MONTHLY_RENT_INPUT}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">备注</span>
            <Form.Item name="notes" style={{ marginBottom: 0 }}>
              <Input data-testid={testids?.NOTES_INPUT} />
            </Form.Item>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">家具家电</span>
            <Button
              type="default"
              className="w-full justify-between"
              onClick={() => setFacilityDialogOpen(true)}
              icon={<Settings2 className="h-4 w-4" />}
            >
              <span className="text-muted-foreground">{getFacilitiesSummary(facilities)}</span>
            </Button>
          </div>
        </div>
      </Modal>

      <FacilitySelectorDialog
        value={facilities}
        onChange={setFacilities}
        open={facilityDialogOpen}
        onOpenChange={setFacilityDialogOpen}
      />
    </>
  );
}
