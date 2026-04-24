import { useState, useEffect, useMemo } from 'react';
import { Check, Loader2, Settings2 } from 'lucide-react';
import { FacilitySelectorDialog } from '@/components/common/facility-selector-dialog';
import { EditRoomDialog } from '@/pages/rooms/components/EditRoomDialog';
import { Modal, Drawer, Button, Input, Select, Switch, Form, InputNumber, Space } from 'antd';
import type { Room, RoomFacilities } from '@/types';
import { LAYOUT_OPTIONS } from '@/constants/apartment-detail';
import type { RoomEditFormData } from '@apartment-ultra/api-contract';
import type { GeneratedFloorRooms } from '@/types';
import { getFacilitiesSummary, parseFloors, parseRoomNumbers, buildGeneratedRoomGroups, buildRoomFormValues } from '@/utils/apartment-detail';

// ============ CreateRoomDialog ============

export function CreateRoomDialog({
  apartmentName,
  open,
  onOpenChange,
  facilities,
  onFacilitiesChange,
  facilityDialogOpen,
  onFacilityDialogOpenChange,
  onSubmit,
  isPending,
}: {
  apartmentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilities: RoomFacilities | null;
  onFacilitiesChange: (value: RoomFacilities | null) => void;
  facilityDialogOpen: boolean;
  onFacilityDialogOpenChange: (open: boolean) => void;
  onSubmit: (data: { room_number: string; layout?: string; area?: number; notes?: string }) => void;
  isPending: boolean;
}) {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        title={`在 ${apartmentName} 添加新房间`}
        footer={
          <Space>
            <Button onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="primary" loading={isPending} onClick={handleSubmit}>
              {isPending ? '创建中...' : '创建'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="room_number"
              label="房间号"
              rules={[{ required: true, message: '请输入房间号' }]}
            >
              <Input placeholder="请输入房间号" />
            </Form.Item>
            <Form.Item name="layout" label="户型">
              <Select placeholder="选择户型">
                {LAYOUT_OPTIONS.map((layout) => (
                  <Select.Option key={layout} value={layout}>
                    {layout}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="area" label="面积 (m²)">
            <InputNumber min={0} step={0.01} placeholder="请输入面积" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={2} />
          </Form.Item>

          <Form.Item label="家具家电">
            <Button className="w-full justify-between" onClick={() => onFacilityDialogOpenChange(true)}>
              <span className="text-gray-500">{getFacilitiesSummary(facilities)}</span>
              <Settings2 className="h-4 w-4" />
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <FacilitySelectorDialog
        value={facilities}
        onChange={onFacilitiesChange}
        open={facilityDialogOpen}
        onOpenChange={onFacilityDialogOpenChange}
      />
    </>
  );
}

// ============ BatchCreateRoomDialog ============

export function BatchCreateRoomDialog({
  open,
  onOpenChange,
  selectedRooms,
  onToggleAll,
  onToggleFloor,
  onToggleRoom,
  onSubmitRooms,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRooms: Set<string>;
  onToggleAll: (select: boolean) => void;
  onToggleFloor: (roomNumbers: string[], select: boolean) => void;
  onToggleRoom: (roomNumber: string) => void;
  onSubmitRooms: () => void;
  isPending: boolean;
}) {
  const [floors, setFloors] = useState('1');
  const [roomNumbers, setRoomNumbers] = useState('1-10');

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setFloors('1');
      setRoomNumbers('1-10');
    }
  }, [open]);

  const generatedRooms: GeneratedFloorRooms[] = useMemo(
    () => buildGeneratedRoomGroups(floors, roomNumbers),
    [floors, roomNumbers]
  );

  const totalGeneratedRooms = generatedRooms.reduce((sum, floorGroup) => sum + floorGroup.rooms.length, 0);

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="批量添加房间"
      width={800}
      footer={
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-gray-500">
            已选择 <span className="font-medium">{selectedRooms.size}</span> 个房间
          </p>
          <Space>
            <Button onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="primary" onClick={onSubmitRooms} disabled={selectedRooms.size === 0 || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  创建中...
                </>
              ) : (
                <>确认添加 ({selectedRooms.size})</>
              )}
            </Button>
          </Space>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Floor and room number inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">楼层</label>
            <Input
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
              placeholder="如 1,2,3 或 1-5"
              addonAfter={<button type="button" className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setFloors('')}>清除</button>}
            />
            <p className="text-xs text-gray-500 mt-1">支持多楼层（如 1,2,3 或 1-5）</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">房间号</label>
            <Input
              value={roomNumbers}
              onChange={(e) => setRoomNumbers(e.target.value)}
              placeholder="如 1,2,3 或 1-10"
            />
            <p className="text-xs text-gray-500 mt-1">支持多房间号（如 1,2,3 或 1-10）</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="small" onClick={() => onToggleAll(true)}>
            全选
          </Button>
          <Button size="small" onClick={() => onToggleAll(false)}>
            取消全选
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          将生成 {totalGeneratedRooms} 个房间，点击房间号启用/禁用
        </div>

        <div className="max-h-[400px] space-y-4 overflow-y-auto">
          {generatedRooms.map(({ floor, rooms }) => {
            const selectedCount = rooms.filter((roomNumber) => selectedRooms.has(roomNumber)).length;
            const allSelected = selectedCount === rooms.length;
            const someSelected = selectedCount > 0 && !allSelected;

            return (
              <div key={floor} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type={allSelected ? 'primary' : 'default'}
                      size="small"
                      className="h-7"
                      onClick={() => onToggleFloor(rooms, !allSelected)}
                    >
                      {allSelected ? (
                        <Check className="mr-1 h-4 w-4 inline" />
                      ) : someSelected ? (
                        <span className="mr-1 flex h-4 w-4 items-center justify-center text-xs">-</span>
                      ) : (
                        <span className="mr-1 h-4 w-4" />
                      )}
                      {floor}楼
                    </Button>
                    <span className="text-sm text-gray-500">
                      ({selectedCount}/{rooms.length})
                    </span>
                  </div>
                  <Button type="text" size="small" className="h-7 text-xs" onClick={() => onToggleFloor(rooms, !allSelected)}>
                    {allSelected ? '取消整层' : '选择整层'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rooms.map((roomNumber) => {
                    const isSelected = selectedRooms.has(roomNumber);
                    return (
                      <button
                        key={roomNumber}
                        type="button"
                        onClick={() => onToggleRoom(roomNumber)}
                        className={`rounded-md px-3 py-1.5 font-mono text-sm transition-colors ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {roomNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}

// ============ DeleteRoomDialog ============

export function DeleteRoomDialog({
  open,
  onOpenChange,
  room,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="确认删除"
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" danger loading={isPending} onClick={onConfirm}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                删除中...
              </>
            ) : (
              '删除'
            )}
          </Button>
        </Space>
      }
    >
      <p>
        确定要删除房间 &quot;{room?.room_number ?? ''}&quot; 吗？此操作不可撤销。
      </p>
    </Modal>
  );
}

// ============ BatchEditDialog ============

export function BatchEditDialog({
  open,
  onOpenChange,
  selectedCount,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSubmit: (data: { layout?: string; area?: number; monthly_rent?: number; maintenance?: boolean }) => void;
  isPending: boolean;
}) {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="批量编辑"
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={isPending} onClick={handleSubmit}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </Space>
      }
    >
      <p className="mb-4 text-sm text-gray-600">为选中的 {selectedCount} 个房间设置属性（留空则不修改）</p>
      <Form form={form} layout="vertical" className="space-y-4">
        <Form.Item name="layout" label="户型">
          <Select placeholder="不修改" allowClear>
            {LAYOUT_OPTIONS.map((layout) => (
              <Select.Option key={layout} value={layout}>
                {layout}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="area" label="面积 (m²)">
          <InputNumber min={0} step={0.01} placeholder="不修改" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="monthly_rent" label="月租 (元)">
          <InputNumber min={0} step={0.01} placeholder="不修改" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="maintenance" label="设为维修中" valuePropName="checked">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">开启后房间将标记为维修中状态</p>
            <Switch />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ============ RoomEditDialog ============

export function RoomEditDialog({
  open,
  onOpenChange,
  room,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onSubmit: (data: RoomEditFormData & { facilities?: RoomFacilities | null }) => void;
  isPending: boolean;
}) {
  return (
    <EditRoomDialog
      open={open}
      onOpenChange={onOpenChange}
      apartmentName={room?.apartment?.name}
      initialValues={room ? buildRoomFormValues(room) : {}}
      facilities={room?.facilities ?? null}
      onSubmit={onSubmit}
      isPending={isPending}
    />
  );
}
