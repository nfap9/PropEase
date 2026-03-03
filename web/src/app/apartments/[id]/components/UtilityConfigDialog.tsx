'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { Loader2, Settings } from 'lucide-react';
import { utilityConfigApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';

const utilityConfigSchema = z.object({
  water_price_per_unit: z.number().min(0, '单价不能为负').optional(),
  electricity_price_per_unit: z.number().min(0, '单价不能为负').optional(),
  internet_fee: z.number().min(0, '费用不能为负').optional(),
  management_fee: z.number().min(0, '费用不能为负').optional(),
  service_fee: z.number().min(0, '费用不能为负').optional(),
  effective_from: z.string().min(1, '请选择生效日期'),
  notes: z.string().optional(),
});

type UtilityConfigFormData = z.infer<typeof utilityConfigSchema>;

interface UtilityConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  apartmentId: string;
  apartmentName: string;
}

export function UtilityConfigDialog({
  open,
  onOpenChange,
  orgId,
  apartmentId,
  apartmentName,
}: UtilityConfigDialogProps) {
  const queryClient = useQueryClient();

  // 获取现有配置
  const { data: config, isLoading } = useQuery({
    queryKey: ['utility-config', orgId, apartmentId],
    queryFn: () => utilityConfigApi.get(orgId, apartmentId),
    enabled: !!orgId && !!apartmentId && open,
    retry: false,
  });

  // 表单
  const form = useForm<UtilityConfigFormData>({
    resolver: zodResolver(utilityConfigSchema),
    defaultValues: {
      water_price_per_unit: undefined,
      electricity_price_per_unit: undefined,
      internet_fee: undefined,
      management_fee: undefined,
      service_fee: undefined,
      effective_from: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // 当配置加载完成后，设置表单值
  useEffect(() => {
    if (config) {
      form.reset({
        water_price_per_unit: config.water_price_per_unit ?? undefined,
        electricity_price_per_unit: config.electricity_price_per_unit ?? undefined,
        internet_fee: config.internet_fee ?? undefined,
        management_fee: config.management_fee ?? undefined,
        service_fee: config.service_fee ?? undefined,
        effective_from: config.effective_from,
        notes: config.notes ?? '',
      });
    } else {
      form.reset({
        water_price_per_unit: undefined,
        electricity_price_per_unit: undefined,
        internet_fee: undefined,
        management_fee: undefined,
        service_fee: undefined,
        effective_from: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [config, form]);

  // 保存配置
  const saveMutation = useMutation({
    mutationFn: (data: UtilityConfigFormData) =>
      utilityConfigApi.createOrUpdate(orgId, apartmentId, {
        ...data,
        effective_from: data.effective_from,
      }),
    onSuccess: () => {
      toast.success('费用配置已保存');
      queryClient.invalidateQueries({ queryKey: ['utility-config', orgId, apartmentId] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '保存失败，请重试'));
    },
  });

  const onSubmit = (data: UtilityConfigFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            费用配置
          </DialogTitle>
          <DialogDescription>
            配置 {apartmentName} 的公用费用，将在生成账单时使用
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 水电单价 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="water_price">水费单价（元/吨）</Label>
                <Input
                  id="water_price"
                  type="number"
                  step="0.01"
                  placeholder="如: 5.00"
                  {...form.register('water_price_per_unit', { valueAsNumber: true })}
                />
                {form.formState.errors.water_price_per_unit && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.water_price_per_unit.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricity_price">电费单价（元/度）</Label>
                <Input
                  id="electricity_price"
                  type="number"
                  step="0.01"
                  placeholder="如: 1.00"
                  {...form.register('electricity_price_per_unit', { valueAsNumber: true })}
                />
                {form.formState.errors.electricity_price_per_unit && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.electricity_price_per_unit.message}
                  </p>
                )}
              </div>
            </div>

            {/* 固定费用 */}
            <div className="space-y-2">
              <Label>固定月费（元/月）</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="网费"
                    {...form.register('internet_fee', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">网费</p>
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="管理费"
                    {...form.register('management_fee', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">管理费</p>
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="服务费"
                    {...form.register('service_fee', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">服务费</p>
                </div>
              </div>
            </div>

            {/* 生效日期 */}
            <div className="space-y-2">
              <Label htmlFor="effective_from">生效日期</Label>
              <Input
                id="effective_from"
                type="date"
                {...form.register('effective_from')}
              />
              {form.formState.errors.effective_from && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.effective_from.message}
                </p>
              )}
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Input
                id="notes"
                placeholder="可选备注信息"
                {...form.register('notes')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存配置
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default UtilityConfigDialog;
