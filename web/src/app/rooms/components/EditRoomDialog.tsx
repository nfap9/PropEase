'use client';

import { useEffect } from 'react';
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
import { Room, RoomStatus } from '@/types';

const roomSchema = z.object({
  room_number: z.string().min(1, '请输入房间号'),
  layout: z.string().optional(),
  area: z.number().min(0, '面积不能为负').optional(),
  monthly_rent: z.number().min(0, '租金不能为负'),
  status: z.enum(['available', 'occupied', 'maintenance']),
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoomFormData) => void;
  isPending: boolean;
  room: Room | null;
}

export function EditRoomDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  room,
}: EditRoomDialogProps) {
  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  useEffect(() => {
    if (room) {
      form.reset({
        room_number: room.room_number,
        layout: room.layout || '',
        area: room.area || 0,
        monthly_rent: room.monthly_rent,
        status: room.status,
        notes: room.notes || '',
      });
    }
  }, [room, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑房间</DialogTitle>
          <DialogDescription>修改房间信息</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>所属公寓</Label>
            <Input value={room?.apartment?.name || ''} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-room_number">房间号</Label>
              <Input id="edit-room_number" {...form.register('room_number')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-layout">户型</Label>
              <Select
                value={form.watch('layout') || ''}
                onValueChange={(value) => form.setValue('layout', value)}
              >
                <SelectTrigger className="min-w-[120px]">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-area">面积 (m²)</Label>
              <Input
                id="edit-area"
                type="number"
                step="0.01"
                {...form.register('area', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">状态</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value: RoomStatus) => form.setValue('status', value)}
              >
                <SelectTrigger className="min-w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">空置</SelectItem>
                  <SelectItem value="occupied">已租</SelectItem>
                  <SelectItem value="maintenance">维修中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-monthly_rent">月租 (元)</Label>
            <Input
              id="edit-monthly_rent"
              type="number"
              step="0.01"
              {...form.register('monthly_rent', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">备注</Label>
            <Input id="edit-notes" {...form.register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
