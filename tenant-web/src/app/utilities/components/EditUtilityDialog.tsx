'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Droplets, Zap } from 'lucide-react';
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
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { UtilityReading } from '@/types';

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
        water_previous: utility.water_previous || undefined,
        electricity_previous: utility.electricity_previous || undefined,
        reading_context: 'normal',
        notes: utility.notes || '',
      });
    }
  }, [utility, form]);

  const handleSubmit = (data: UtilityFormData) => {
    onSubmit({
      ...data,
      anomaly_reason: data.anomaly_reason?.trim() || undefined,
    });
  };

  const roomDisplay = utility?.room
    ? `${utility.room.apartment?.name || ''} - ${utility.room.room_number}`
    : '';
  const readingContext = form.watch('reading_context');

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
            <DateTimePicker
              id="edit-reading_date"
              mode="date"
              value={form.watch('reading_date')}
              onChange={(value) => form.setValue('reading_date', value)}
              placeholder="选择读数日期"
            />
          </div>
          <div className="space-y-2">
            <Label>录入场景</Label>
            <Select
              value={readingContext}
              onValueChange={(value: UtilityFormData['reading_context']) =>
                form.setValue('reading_context', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">正常抄表</SelectItem>
                <SelectItem value="initial">首次录入</SelectItem>
                <SelectItem value="meter_reset">更换新表</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {readingContext !== 'normal' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{readingContext === 'initial' ? '首次录入基线' : '更换新表说明'}</AlertTitle>
              <AlertDescription>
                {readingContext === 'initial'
                  ? '首次录入时会自动把上一读数同步为当前值，适合补录历史首期读数。'
                  : '换表后请改成新表当前值，并填写新表起始读数与原因。'}
              </AlertDescription>
            </Alert>
          )}
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
          {readingContext !== 'normal' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-water_previous">水表上一读数</Label>
                <Input
                  id="edit-water_previous"
                  type="number"
                  step="0.01"
                  placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '请输入新表起始值'}
                  {...form.register('water_previous', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-electricity_previous">电表上一读数</Label>
                <Input
                  id="edit-electricity_previous"
                  type="number"
                  step="0.01"
                  placeholder={readingContext === 'initial' ? '可留空，自动取当前值' : '请输入新表起始值'}
                  {...form.register('electricity_previous', { valueAsNumber: true })}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-anomaly_reason">
              {readingContext === 'normal'
                ? '异常说明（可选）'
                : readingContext === 'initial'
                  ? '说明（可选）'
                  : '更换原因 *'}
            </Label>
            <Input
              id="edit-anomaly_reason"
              placeholder={
                readingContext === 'normal'
                  ? '如遇到暴涨用量、人工核对等特殊情况，可在此说明'
                  : readingContext === 'initial'
                    ? '例如：补录本租约第一期读数'
                    : '例如：旧水表故障，本月已更换'
              }
              {...form.register('anomaly_reason')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">备注</Label>
            <Input id="edit-notes" placeholder="请输入备注" {...form.register('notes')} />
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
