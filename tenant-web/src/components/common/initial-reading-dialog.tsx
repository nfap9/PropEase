
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, DatePicker, message } from 'antd';
import { Label } from '@/components/common/label';
import { utilitiesApi } from '@/api';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { toast } from 'sonner';
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
      toast.success('初始水电读数已录入');
      onSuccess?.();
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error, '录入失败，请重试')),
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
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="录入初始水电读数"
      footer={[
        <Button key="skip" variant="text" onClick={handleSkip}>
          跳过
        </Button>,
        <Button key="submit" type="primary" loading={saveMutation.isPending} onClick={form.handleSubmit(handleSubmit)}>
          {saveMutation.isPending ? '保存中...' : '保存'}
        </Button>,
      ]}
    >
      <div className="mb-4 text-sm text-gray-600">
        {isHistoricalLeaseEntry ? (
          <>
            历史租约已创建，建议先记录当前表底数。历史月份数据可稍后前往
            <Link to="/utilities?tab=history" className="mx-1 underline underline-offset-4">
              历史水电记录
            </Link>
            继续补录。
          </>
        ) : (
          '签约后需记录初始水电表读数，便于后续出账计算。可填写后保存，或跳过稍后在水电录入页补录。'
        )}
      </div>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
          <Controller
            name="reading_date"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                id="initial-reading_date"
                value={field.value || ''}
                onChange={(_, dateString) => field.onChange(dateString)}
                className="w-full"
              />
            )}
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
      </form>
    </Modal>
  );
}
