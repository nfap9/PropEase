
import { Check, Loader2, Settings2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { FacilitySelectorDialog } from '@/components/common/facility-selector-dialog';
import { EditRoomDialog } from '@/pages/rooms/components/EditRoomDialog';
import { Modal, Drawer, Button, Input, Select, Switch, Form } from 'antd';
import type { Room, RoomFacilities } from '@/types';
import {
  type BatchEditFormData,
  type RoomBatchConfigData,
  type RoomFormData,
  LAYOUT_OPTIONS,
} from '@/schemas/apartment-detail';
import type { GeneratedFloorRooms } from '@/utils/apartment-detail';
import { getFacilitiesSummary } from '@/utils/apartment-detail';

function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

export function CreateRoomDialog({
  apartmentName,
  open,
  onOpenChange,
  form,
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
  form: UseFormReturn<RoomFormData>;
  facilities: RoomFacilities | null;
  onFacilitiesChange: (value: RoomFacilities | null) => void;
  facilityDialogOpen: boolean;
  onFacilityDialogOpenChange: (open: boolean) => void;
  onSubmit: (data: RoomFormData) => void;
  isPending: boolean;
}) {
  return (
    <>
      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        title={`在 ${apartmentName} 添加新房间`}
        footer={[
          <Button key="cancel" onClick={() => onOpenChange(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={isPending} onClick={form.handleSubmit(onSubmit)}>
            {isPending ? '创建中...' : '创建'}
          </Button>,
        ]}
      >
        <Form layout="vertical" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="房间号"
              name="room_number"
              required
              validateStatus={form.formState.errors.room_number ? 'error' : ''}
              help={form.formState.errors.room_number?.message}
            >
              <Input placeholder="请输入房间号" {...form.register('room_number')} />
            </Form.Item>
            <Form.Item label="户型" name="layout">
              <Select
                value={form.watch('layout') || ''}
                onChange={(value) => form.setValue('layout', value)}
                placeholder="选择户型"
              >
                {LAYOUT_OPTIONS.map((layout) => (
                  <Select.Option key={layout} value={layout}>
                    {layout}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="面积 (m²)" name="area">
            <Input type="number" step="0.01" placeholder="请输入面积" {...form.register('area', { valueAsNumber: true })} />
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <Input placeholder="请输入备注" {...form.register('notes')} />
          </Form.Item>

          <Form.Item label="家具家电">
            <Button
              className="w-full justify-between"
              onClick={() => onFacilityDialogOpenChange(true)}
            >
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

export function BatchCreateRoomDialog({
  open,
  onOpenChange,
  form,
  generatedRooms,
  selectedRooms,
  onToggleAll,
  onToggleFloor,
  onToggleRoom,
  onSubmitRooms,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<RoomBatchConfigData>;
  generatedRooms: GeneratedFloorRooms[];
  selectedRooms: Set<string>;
  onToggleAll: (select: boolean) => void;
  onToggleFloor: (roomNumbers: string[], select: boolean) => void;
  onToggleRoom: (roomNumber: string) => void;
  onSubmitRooms: () => void;
  isPending: boolean;
}) {
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
          <div className="flex gap-3">
            <Button onClick={() => onOpenChange(false)}>取消</Button>
            <Button
              type="primary"
              onClick={onSubmitRooms}
              disabled={selectedRooms.size === 0 || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  创建中...
                </>
              ) : (
                <>确认添加 ({selectedRooms.size})</>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Form layout="vertical" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="楼层"
              name="floors"
              required
              validateStatus={form.formState.errors.floors ? 'error' : ''}
              help={form.formState.errors.floors?.message}
              extra="支持多楼层（如 1,2,3 或 1-5）"
            >
              <Input placeholder="如 1,2,3 或 1-5" {...form.register('floors')} />
            </Form.Item>
            <Form.Item
              label="房间号"
              name="room_numbers"
              required
              validateStatus={form.formState.errors.room_numbers ? 'error' : ''}
              help={form.formState.errors.room_numbers?.message}
              extra="支持多房间号（如 1,2,3 或 1-5）"
            >
              <Input placeholder="如 1,2,3 或 1-5" {...form.register('room_numbers')} />
            </Form.Item>
          </div>
        </Form>

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
                  <Button
                    type="text"
                    size="small"
                    className="h-7 text-xs"
                    onClick={() => onToggleFloor(rooms, !allSelected)}
                  >
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
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          取消
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          loading={isPending}
          onClick={onConfirm}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
              删除中...
            </>
          ) : (
            '删除'
          )}
        </Button>,
      ]}
    >
      <p>确定要删除房间 &quot;{room?.room_number ?? ''}&quot; 吗？此操作不可撤销。</p>
    </Modal>
  );
}

export function BatchEditDialog({
  open,
  onOpenChange,
  form,
  selectedCount,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<BatchEditFormData>;
  selectedCount: number;
  onSubmit: (data: BatchEditFormData) => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="批量编辑"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isPending}
          onClick={form.handleSubmit(onSubmit)}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
              保存中...
            </>
          ) : (
            '保存'
          )}
        </Button>,
      ]}
    >
      <p className="mb-4 text-sm text-gray-600">为选中的 {selectedCount} 个房间设置属性（留空则不修改）</p>
      <Form layout="vertical" className="space-y-4">
        <Form.Item label="户型" name="layout">
          <Select
            value={form.watch('layout') || '__none__'}
            onChange={(value) => form.setValue('layout', value === '__none__' ? undefined : value)}
            placeholder="不修改"
          >
            <Select.Option value="__none__">不修改</Select.Option>
            {LAYOUT_OPTIONS.map((layout) => (
              <Select.Option key={layout} value={layout}>
                {layout}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="面积 (m²)" name="area">
          <Input
            type="number"
            step="0.01"
            placeholder="不修改"
            value={form.watch('area') ?? ''}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === '') {
                form.setValue('area', undefined);
                return;
              }

              const parsed = parseFloat(nextValue);
              form.setValue('area', isNaN(parsed) ? undefined : parsed);
            }}
          />
        </Form.Item>

        <Form.Item label="月租 (元)" name="monthly_rent">
          <Input
            type="number"
            step="0.01"
            placeholder="不修改"
            value={form.watch('monthly_rent') ?? ''}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === '') {
                form.setValue('monthly_rent', undefined);
                return;
              }

              const parsed = parseFloat(nextValue);
              form.setValue('monthly_rent', isNaN(parsed) ? undefined : parsed);
            }}
          />
        </Form.Item>

        <Form.Item label="设为维修中">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              开启后房间将标记为维修中状态
            </p>
            <Switch
              checked={form.watch('maintenance') ?? false}
              onChange={(checked) => form.setValue('maintenance', checked)}
            />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

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
  onSubmit: (data: RoomFormData & { facilities?: RoomFacilities | null }) => void;
  isPending: boolean;
}) {
  return (
    <EditRoomDialog open={open} onOpenChange={onOpenChange} onSubmit={onSubmit} isPending={isPending} room={room} />
  );
}
