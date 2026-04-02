'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { FormDialog } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { utilitiesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { Droplets, Zap } from 'lucide-react';

const schema = z.object({
  water_reading: z
    .union([z.number().min(0), z.nan()])
    .optional()
    .transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined)),
  electricity_reading: z
    .union([z.number().min(0), z.nan()])
    .optional()
    .transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined)),
  reading_date: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export interface InitialReadingDialogProps {
  orgId: string;
  roomId: string;
  roomDisplay: string;
  /** 签约开始日期，用于确定录入月份 */
  startDate: string;
  /** 是否为历史租约录入后的首次水电录入 */
  isHistoricalLeaseEntry?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InitialReadingDialog({
  orgId,
  roomId,
  roomDisplay,
  startDate,
  isHistoricalLeaseEntry = false,
  open,
  onOpenChange,
  onSuccess,
}: InitialReadingDialogProps) {
  const start = new Date(startDate);
  const periodYear = start.getFullYear();
  const periodMonth = start.getMonth() + 1;
  /** 读数日期默认签约日期 */
  const defaultReadingDate = isHistoricalLeaseEntry
    ? new Date().toISOString().split('T')[0]
    : startDate.includes('T')
      ? startDate.split('T')[0]
      : startDate;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      water_reading: undefined,
      electricity_reading: undefined,
      reading_date: defaultReadingDate,
    },
  });

  const queryClient = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      utilitiesApi.create(
        orgId,
        filterEmptyStrings({
          room_id: roomId,
          period_year: periodYear,
          period_month: periodMonth,
          reading_date: data.reading_date,
          water_reading: data.water_reading ?? undefined,
          electricity_reading: data.electricity_reading ?? undefined,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      onOpenChange(false);
      appToast.success('初始水电读数已录入');
      onSuccess?.();
    },
    onError: (error: unknown) => appToast.error(getErrorMessage(error, '录入失败，请重试')),
  });

  const handleSkip = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleSubmit = (data: FormData) => {
    if (data.water_reading == null && data.electricity_reading == null) {
      handleSkip();
      return;
    }
    saveMutation.mutate(data);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="录入初始水电读数"
      description={
        isHistoricalLeaseEntry ? (
          <>
            历史租约已创建，建议先记录当前表底数。历史月份数据可稍后前往
            <Link href="/utilities?tab=history" className="mx-1 underline underline-offset-4">
              历史水电记录
            </Link>
            继续补录。
          </>
        ) : (
          '签约后需记录初始水电表读数，便于后续出账计算。可填写后保存，或跳过稍后在水电录入页补录。'
        )
      }
      size="sm"
      onSubmit={form.handleSubmit(handleSubmit)}
      cancelLabel="跳过"
      cancelVariant="ghost"
      onCancel={handleSkip}
      submitLabel={saveMutation.isPending ? '保存中...' : '保存'}
      isPending={saveMutation.isPending}
    >
      <div className="space-y-2">
        <Label>房间</Label>
        <Input value={roomDisplay} disabled />
      </div>
      <div className="space-y-2">
        <Label>月份</Label>
        <Input value={`${periodYear}年${periodMonth}月`} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="initial-reading_date">读数日期</Label>
        <DateTimePicker
          id="initial-reading_date"
          mode="date"
          value={form.watch('reading_date')}
          onChange={(value) => form.setValue('reading_date', value)}
          placeholder="选择读数日期"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="initial-water">
            <span className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              水表读数 (m³)
            </span>
          </Label>
          <Input
            id="initial-water"
            type="number"
            step="0.01"
            placeholder="选填"
            {...form.register('water_reading', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="initial-electricity">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              电表读数 (kWh)
            </span>
          </Label>
          <Input
            id="initial-electricity"
            type="number"
            step="0.01"
            placeholder="选填"
            {...form.register('electricity_reading', { valueAsNumber: true })}
          />
        </div>
      </div>
    </FormDialog>
  );
}
