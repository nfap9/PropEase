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
import { Loader2, Zap } from 'lucide-react';
import { utilityConfigApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';

const utilityConfigSchema = z.object({
  water_price_per_unit: z.number().min(0, '单价不能为负'),
  electricity_price_per_unit: z.number().min(0, '单价不能为负'),
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
      water_price_per_unit: 0,
      electricity_price_per_unit: 0,
    },
  });

  // 当配置加载完成后，设置表单值
  useEffect(() => {
    if (config) {
      form.reset({
        water_price_per_unit: config.water_price_per_unit ?? 0,
        electricity_price_per_unit: config.electricity_price_per_unit ?? 0,
      });
    } else {
      form.reset({
        water_price_per_unit: 0,
        electricity_price_per_unit: 0,
      });
    }
  }, [config, form]);

  // 保存配置
  const saveMutation = useMutation({
    mutationFn: (data: UtilityConfigFormData) =>
      utilityConfigApi.createOrUpdate(orgId, apartmentId, {
        water_price_per_unit: data.water_price_per_unit,
        electricity_price_per_unit: data.electricity_price_per_unit,
      }),
    onSuccess: () => {
      toast.success('水电单价已保存');
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            水电配置
          </DialogTitle>
          <DialogDescription>配置 {apartmentName} 的水电单价</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default UtilityConfigDialog;
