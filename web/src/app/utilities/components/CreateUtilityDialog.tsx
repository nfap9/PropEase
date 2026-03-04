'use client';

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
import { Apartment, Room } from '@/types';
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

interface CreateUtilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UtilityFormData) => void;
  isPending: boolean;
  apartments: Apartment[] | undefined;
  rooms: Room[] | undefined;
  selectedApartmentId: string | null;
  onApartmentChange: (apartmentId: string) => void;
}

export function CreateUtilityDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  apartments,
  rooms,
  selectedApartmentId,
  onApartmentChange,
}: CreateUtilityDialogProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const form = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
    defaultValues: {
      room_id: '',
      period_year: currentYear,
      period_month: currentMonth,
      reading_date: today.toISOString().split('T')[0],
      water_reading: 0,
      electricity_reading: 0,
      notes: '',
    },
  });

  const occupiedRooms = rooms?.filter((r) => r.status === 'occupied');

  const handleSubmit = (data: UtilityFormData) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>录入水电读数</DialogTitle>
          <DialogDescription>录入房间的水电表读数</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>选择公寓</Label>
              <Select
                value={selectedApartmentId || ''}
                onValueChange={(value) => onApartmentChange(value)}
              >
                <SelectTrigger className="min-w-[140px]">
                  <SelectValue placeholder="选择公寓" />
                </SelectTrigger>
                <SelectContent>
                  {apartments?.map((apt) => (
                    <SelectItem key={apt.id} value={apt.id.toString()}>
                      {apt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_id">选择房间 *</Label>
              <Select
                value={form.watch('room_id') || ''}
                onValueChange={(value) => form.setValue('room_id', value)}
              >
                <SelectTrigger className="min-w-[140px]">
                  <SelectValue placeholder="选择房间" />
                </SelectTrigger>
                <SelectContent>
                  {occupiedRooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_year">年份</Label>
              <Select
                value={form.watch('period_year')?.toString() || currentYear.toString()}
                onValueChange={(value) => form.setValue('period_year', Number(value))}
              >
                <SelectTrigger className="min-w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_month">月份</Label>
              <Select
                value={form.watch('period_month')?.toString() || currentMonth.toString()}
                onValueChange={(value) => form.setValue('period_month', Number(value))}
              >
                <SelectTrigger className="min-w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {month}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reading_date">读数日期 *</Label>
            <Input id="reading_date" type="date" {...form.register('reading_date')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="water_reading">
                <span className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  水表读数 (m³)
                </span>
              </Label>
              <Input
                id="water_reading"
                type="number"
                step="0.01"
                {...form.register('water_reading', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity_reading">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  电表读数 (kWh)
                </span>
              </Label>
              <Input
                id="electricity_reading"
                type="number"
                step="0.01"
                {...form.register('electricity_reading', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Input id="notes" {...form.register('notes')} />
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
