
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Select } from 'antd';
import { Settings2 } from 'lucide-react';
import { Room, RoomFacilities } from '@/types';
import { FacilitySelectorDialog } from '@/components/common/facility-selector-dialog';
import { getFacilityLabel } from '@/constants/facilities';

const roomSchema = z.object({
  room_number: z.string().min(1, '请输入房间号'),
  layout: z.string().optional(),
  area: z.number().min(0, '面积不能为负').optional(),
  monthly_rent: z.number().min(0, '租金不能为负'),
  notes: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

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
  onSubmit: (data: RoomFormData & { facilities?: RoomFacilities | null }) => void;
  isPending: boolean;
  room: Room | null;
}

/** 生成设施摘要 */
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
  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });
  const [facilities, setFacilities] = useState<RoomFacilities | null>(null);
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);

  useEffect(() => {
    if (room) {
      form.reset({
        room_number: room.room_number,
        layout: room.layout || '',
        area: room.area || 0,
        monthly_rent: room.pricing?.monthly_rent ?? 0,
        notes: room.notes || '',
      });
      setFacilities(room.facilities);
    }
  }, [room, form]);

  const handleSubmit = (data: RoomFormData) => {
    onSubmit({ ...data, facilities });
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        title="编辑房间"
        footer={[
          <Button key="cancel" onClick={() => onOpenChange(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.handleSubmit(handleSubmit)()} loading={isPending}>
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
              <Controller
                name="room_number"
                control={form.control}
                render={({ field }) => (
                  <Input data-testid={testids?.NUMBER_INPUT} {...field} />
                )}
              />
              {form.formState.errors.room_number && (
                <p className="text-sm text-destructive">{form.formState.errors.room_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">户型</span>
              <Select
                value={form.watch('layout') || ''}
                onChange={(value) => form.setValue('layout', value)}
                className="w-full"
                placeholder="选择户型"
                options={LAYOUT_OPTIONS.map((layout) => ({ value: layout, label: layout }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">面积 (m²)</span>
            <Input
              type="number"
              step="0.01"
              data-testid={testids?.AREA_INPUT}
              {...form.register('area', { valueAsNumber: true })}
            />
            {form.formState.errors.area && (
              <p className="text-sm text-destructive">{form.formState.errors.area.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">月租 (元) *</span>
            <Controller
              name="monthly_rent"
              control={form.control}
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  data-testid={testids?.MONTHLY_RENT_INPUT}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                />
              )}
            />
            {form.formState.errors.monthly_rent && (
              <p className="text-sm text-destructive">{form.formState.errors.monthly_rent.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">备注</span>
            <Input data-testid={testids?.NOTES_INPUT} {...form.register('notes')} />
          </div>

          {/* 家具家电配置按钮 */}
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

      {/* 家具家电配置二级弹窗 */}
      <FacilitySelectorDialog
        value={facilities}
        onChange={setFacilities}
        open={facilityDialogOpen}
        onOpenChange={setFacilityDialogOpen}
      />
    </>
  );
}
