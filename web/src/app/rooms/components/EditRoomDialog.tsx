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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Room, RoomFacilities } from '@/types';
import { FacilitySelector } from '@/components/common/facility-selector';

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid={testids?.EDIT_DIALOG}>
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
              <Label htmlFor="edit-room_number">房间号</Label>
              <Input
                id="edit-room_number"
                data-testid={testids?.NUMBER_INPUT}
                {...form.register('room_number')}
              />
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-monthly_rent">月租 (元)</Label>
            <Input
              id="edit-monthly_rent"
              type="number"
              step="0.01"
              data-testid={testids?.MONTHLY_RENT_INPUT}
              {...form.register('monthly_rent', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">备注</Label>
            <Input id="edit-notes" {...form.register('notes')} data-testid={testids?.NOTES_INPUT} />
          </div>
          <FacilitySelector value={facilities} onChange={setFacilities} disabled={isPending} />
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
  );
}
