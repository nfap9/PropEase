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
import { UtilityReading } from '@/types';
import { Droplets, Zap } from 'lucide-react';

const utilitySchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  period_year: z.number().min(2020).max(2100),
  period_month: z.number().min(1).max(12),
  reading_date: z.string().min(1, '请选择读数日期'),
  water_reading: z.number().min(0).optional(),
  electricity_reading: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type UtilityFormData = z.infer<typeof utilitySchema>;

interface EditUtilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UtilityFormData) => void;
  isPending: boolean;
  utility: UtilityReading | null;
}

export function EditUtilityDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  utility,
}: EditUtilityDialogProps) {
  const form = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
  });

  useEffect(() => {
    if (utility) {
      form.reset({
        room_id: utility.room_id,
        period_year: utility.period_year,
        period_month: utility.period_month,
        reading_date: utility.reading_date,
        water_reading: utility.water_reading || 0,
        electricity_reading: utility.electricity_reading || 0,
        notes: utility.notes || '',
      });
    }
  }, [utility, form]);

  const handleSubmit = (data: UtilityFormData) => {
    onSubmit(data);
  };

  const roomDisplay = utility?.room
    ? `${utility.room.apartment?.name || ''} - ${utility.room.room_number}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑水电读数</DialogTitle>
          <DialogDescription>修改水电表读数</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>年份</Label>
              <Input value={utility?.period_year} disabled />
            </div>
            <div className="space-y-2">
              <Label>月份</Label>
              <Input value={`${utility?.period_month}月`} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-reading_date">读数日期</Label>
            <Input
              id="edit-reading_date"
              type="date"
              {...form.register('reading_date')}
            />
          </div>
          <div className="space-y-2">
            <Label>房间</Label>
            <Input value={roomDisplay} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-water_reading">
                <span className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  水表读数 (m³)
                </span>
              </Label>
              <Input
                id="edit-water_reading"
                type="number"
                step="0.01"
                {...form.register('water_reading', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-electricity_reading">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  电表读数 (kWh)
                </span>
              </Label>
              <Input
                id="edit-electricity_reading"
                type="number"
                step="0.01"
                {...form.register('electricity_reading', { valueAsNumber: true })}
              />
            </div>
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
