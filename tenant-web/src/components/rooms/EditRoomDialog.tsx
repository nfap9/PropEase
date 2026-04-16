'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Room, RoomFacilities } from '@/types';
import { FacilitySelectorDialog } from '@/components/common/facility-selector-dialog';
import { getFacilityLabel } from '@/constants/facilities';
import { Settings2 } from 'lucide-react';

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
        monthly_rent: room.monthly_rent,
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg" data-testid={testids?.EDIT_DIALOG}>
          <DialogHeader>
            <DialogTitle>编辑房间</DialogTitle>
            <DialogDescription>修改房间信息</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>所属公寓</Label>
              <Input value={room?.apartment?.name || ''} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-room_number" required>
                  房间号
                </Label>
                <Input
                  id="edit-room_number"
                  data-testid={testids?.NUMBER_INPUT}
                  {...form.register('room_number')}
                />
                {form.formState.errors.room_number && (
                  <p className="text-sm text-destructive">{form.formState.errors.room_number.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-layout">户型</Label>
                <Select
                  value={form.watch('layout') || ''}
                  onValueChange={(value) => form.setValue('layout', value)}
                >
                  <SelectTrigger className="min-w-[120px]" data-testid={testids?.LAYOUT_SELECT}>
                    <SelectValue placeholder="选择户型" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUT_OPTIONS.map((layout) => (
                      <SelectItem key={layout} value={layout}>
                        {layout}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-area">面积 (m²)</Label>
              <Input
                id="edit-area"
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
              <Label htmlFor="edit-monthly_rent" required>
                月租 (元)
              </Label>
              <Input
                id="edit-monthly_rent"
                type="number"
                step="0.01"
                data-testid={testids?.MONTHLY_RENT_INPUT}
                {...form.register('monthly_rent', { valueAsNumber: true })}
              />
              {form.formState.errors.monthly_rent && (
                <p className="text-sm text-destructive">{form.formState.errors.monthly_rent.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">备注</Label>
              <Input id="edit-notes" {...form.register('notes')} data-testid={testids?.NOTES_INPUT} />
            </div>

            {/* 家具家电配置按钮 */}
            <div className="space-y-2">
              <Label>家具家电</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setFacilityDialogOpen(true)}
              >
                <span className="text-muted-foreground">
                  {getFacilitiesSummary(facilities)}
                </span>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid={testids?.CANCEL_BUTTON}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending} data-testid={testids?.CONFIRM_BUTTON}>
                {isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
