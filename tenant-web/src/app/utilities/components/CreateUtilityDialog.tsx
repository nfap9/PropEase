'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@apartment-ultra/shared-ui/components/ui';
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
import { RadioGroup, RadioGroupItem } from '@apartment-ultra/shared-ui/components/ui';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '@apartment-ultra/shared-ui/components/ui';
import { Apartment, Room, UtilityReading } from '@/types';
import { Droplets, Zap } from 'lucide-react';
import { utilitiesApi } from '@/lib/api';

const optionalNumberField = z
  .union([z.number().min(0), z.nan().transform(() => undefined)])
  .optional();

const utilitySchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  period_year: z.number().min(2020).max(2100),
  period_month: z.number().min(1).max(12),
  reading_date: z.string().min(1, '请选择读数日期'),
  water_reading: optionalNumberField,
  electricity_reading: optionalNumberField,
  water_previous: optionalNumberField,
  electricity_previous: optionalNumberField,
  notes: z.string().optional(),
  reading_context: z.enum(['normal', 'initial', 'meter_reset']),
  anomaly_reason: z.string().max(200, '异常说明请控制在 200 字内').optional(),
});

type UtilityFormData = z.infer<typeof utilitySchema>;

interface ApartmentRoomGroup {
  apartment: Apartment;
  rooms: Room[];
}

interface CreateUtilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UtilityFormData) => void;
  isPending: boolean;
  apartmentRooms: ApartmentRoomGroup[];
  orgId: string;
}

export function CreateUtilityDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  apartmentRooms,
  orgId,
}: CreateUtilityDialogProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [existingReading, setExistingReading] = useState<UtilityReading | null>(null);

  const form = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
    defaultValues: {
      room_id: '',
      period_year: currentYear,
      period_month: currentMonth,
      reading_date: today.toISOString().split('T')[0],
      water_reading: 0,
      electricity_reading: 0,
      reading_context: 'normal',
      notes: '',
    },
  });

  const readingContext = form.watch('reading_context');

  const { data: existingReadings = [] } = useQuery({
    queryKey: ['utilities', 'check', orgId, form.watch('room_id'), form.watch('period_year'), form.watch('period_month')],
    queryFn: () => utilitiesApi.list(orgId, {
      room_id: form.watch('room_id') || undefined,
      period_year: form.watch('period_year'),
      period_month: form.watch('period_month'),
    }),
    enabled: !!orgId && !!form.watch('room_id') && form.watch('period_year') > 0 && form.watch('period_month') > 0,
  });

  const handleSubmit = (data: UtilityFormData) => {
    // Check if there's an existing reading for the same room + year + month
    const existing = existingReadings.find((r) => r.room_id === data.room_id);
    if (existing) {
      setExistingReading(existing);
      return; // Don't submit yet, show confirmation
    }
    // No existing reading, proceed
    onSubmit({
      ...data,
      anomaly_reason: data.anomaly_reason?.trim() || undefined,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="utilities-entry-dialog">
        <DialogHeader>
          <DialogTitle>录入水电读数</DialogTitle>
          <DialogDescription>录入房间的水电表读数</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room_selector">公寓 - 房间</Label>
            <Select
              value={form.watch('room_id') || ''}
              onValueChange={(value) => form.setValue('room_id', value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择公寓和房间" />
              </SelectTrigger>
              <SelectContent>
                {apartmentRooms?.map(({ apartment, rooms }) =>
                  rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {apartment.name} - {room.room_number}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="period">账期（年月）</Label>
            <Select
              value={`${form.watch('period_year')}-${form.watch('period_month')}`}
              onValueChange={(value) => {
                const [year, month] = value.split('-').map(Number);
                form.setValue('period_year', year);
                form.setValue('period_month', month);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择年月" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 3 }, (_, i) => currentYear - 1 + i).flatMap((year) =>
                  Array.from({ length: 12 }, (_, monthIdx) => monthIdx + 1).map((month) => (
                    <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                      {year}年{month}月
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reading_date">读数日期 *</Label>
            <Input id="reading_date" type="date" {...form.register('reading_date')} />
          </div>
          <div className="space-y-2">
            <Label>录入场景</Label>
            <RadioGroup
              value={readingContext}
              onValueChange={(value: UtilityFormData['reading_context']) =>
                form.setValue('reading_context', value)
              }
              className="flex flex-row space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="ctx-normal" />
                <Label htmlFor="ctx-normal" className="font-normal cursor-pointer">正常抄表</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="initial" id="ctx-initial" />
                <Label htmlFor="ctx-initial" className="font-normal cursor-pointer">首次录入</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="meter_reset" id="ctx-meter_reset" />
                <Label htmlFor="ctx-meter_reset" className="font-normal cursor-pointer">更换新表</Label>
              </div>
            </RadioGroup>
          </div>
          {readingContext !== 'normal' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{readingContext === 'initial' ? '首次录入基线' : '更换新表说明'}</AlertTitle>
              <AlertDescription>
                {readingContext === 'initial'
                  ? '首次录入时，系统会把上一读数自动同步为当前值，避免当期误计费用。'
                  : '更换新表后，请填写更换后的起始读数，并补充原因，系统将按你填写的上一读数计算本期用量。'}
              </AlertDescription>
            </Alert>
          )}
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
          {readingContext !== 'normal' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="water_previous">水表上一读数</Label>
                <Input
                  id="water_previous"
                  type="number"
                  step="0.01"
                  placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '换表后请输入新表起始值'}
                  {...form.register('water_previous', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricity_previous">电表上一读数</Label>
                <Input
                  id="electricity_previous"
                  type="number"
                  step="0.01"
                  placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '换表后请输入新表起始值'}
                  {...form.register('electricity_previous', { valueAsNumber: true })}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="anomaly_reason">
              {readingContext === 'normal'
                ? '异常说明（可选）'
                : readingContext === 'initial'
                  ? '说明（可选）'
                  : '更换原因 *'}
            </Label>
            <Input
              id="anomaly_reason"
              placeholder={
                readingContext === 'normal'
                  ? '如遇到暴涨用量、人工核对等特殊情况，可在此说明'
                  : readingContext === 'initial'
                    ? '例如：新租客入住房间，首次建立读数基线'
                    : '例如：旧电表损坏，2026-03-17 更换新表'
              }
              {...form.register('anomaly_reason')}
            />
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
      {existingReading && (
        <AlertDialog open={!!existingReading} onOpenChange={() => setExistingReading(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>该账期已有读数</AlertDialogTitle>
              <AlertDialogDescription>
                {existingReading.room?.apartment?.name} - {existingReading.room?.room_number}
                {existingReading.period_year}年{existingReading.period_month}月已有读数记录。
                确定要覆盖吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExistingReading(null)}>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                // Proceed with overwrite
                onSubmit({
                  ...form.getValues(),
                  anomaly_reason: form.getValues('anomaly_reason')?.trim() || undefined,
                });
                form.reset();
                setExistingReading(null);
              }}>确认覆盖</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Dialog>
  );
}
