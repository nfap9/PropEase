'use client';

import { useState } from 'react';
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
import { Loader2, Plus, Settings, Trash2 } from 'lucide-react';
import { apartmentFeeConfigApi, feeTypesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import type { FeeType, FeeSpecification, ApartmentFeeConfig } from '@apartment-ultra/api-contract';

const feeConfigSchema = z.object({
  fee_type_id: z.string().min(1),
  specification_id: z.string().optional(),
  is_enabled: z.boolean().optional(),
  effective_from: z.string(),
  notes: z.string().optional(),
});

interface FeeConfigFormData {
  fee_type_id: string;
  specification_id?: string;
  is_enabled?: boolean;
  effective_from: string;
  notes?: string;
}

interface FeeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  apartmentId: string;
}

export function FeeConfigDialog({ open, onOpenChange, orgId, apartmentId }: FeeConfigDialogProps) {
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState<string | null>(null);

  const { data: feeTypes, isLoading: feeTypesLoading } = useQuery({
    queryKey: ['fee-types', orgId],
    queryFn: () => feeTypesApi.list(orgId),
    enabled: !!orgId,
  });

  const { data: existingConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['apartment-fee-configs', orgId, apartmentId],
    queryFn: () => apartmentFeeConfigApi.list(orgId, apartmentId),
    enabled: !!orgId && !!apartmentId,
  });

  const form = useForm<FeeConfigFormData>({
    resolver: zodResolver(feeConfigSchema),
    defaultValues: {
      fee_type_id: '',
      specification_id: undefined,
      effective_from: new Date().toISOString().split('T')[0],
      is_enabled: true,
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: (data: FeeConfigFormData) =>
      apartmentFeeConfigApi.create(orgId, apartmentId, data),
    onSuccess: () => {
      toast.success('费用配置已添加');
      queryClient.invalidateQueries({ queryKey: ['apartment-fee-configs', orgId, apartmentId] });
      setIsAddingNew(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(`添加失败: ${getErrorMessage(error)}`);
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (configId: string) =>
      apartmentFeeConfigApi.delete(orgId, apartmentId, configId),
    onSuccess: () => {
      toast.success('费用配置已删除');
      queryClient.invalidateQueries({ queryKey: ['apartment-fee-configs', orgId, apartmentId] });
    },
    onError: (error) => {
      toast.error(`删除失败: ${getErrorMessage(error)}`);
    },
  });

  const selectedFeeType = feeTypes?.find((ft) => ft.id === selectedFeeTypeId);
  const selectedSpec = selectedFeeType?.specifications?.find(
    (s) => s.id === form.watch('specification_id')
  );
  const isLoading = feeTypesLoading || configsLoading;
  if (isLoading) {
    return <Loader2 className="animate-spin" />;
  }
  const availableFeeTypes = feeTypes?.filter((ft) => !ft.organization_id || ft.organization_id === orgId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>费用配置</DialogTitle>
        <DialogDescription>为公寓启用可选费用项目</DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        {existingConfigs?.map((config) => {
          const ft = feeTypes?.find((f) => f.id === config.fee_type_id);
          const spec = ft?.specifications?.find((s) => s.id === config.specification_id);
          return (
            <div
              key={config.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex-1">
                <div className="font-medium">{ft?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {spec?.name || '默认规格'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteConfigMutation.mutate(config.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {feeTypesLoading || configsLoading ? (
          <div className="py-4 text-center text-muted-foreground">加载中...</div>
        ) : !isAddingNew ? (
          <Button variant="outline" onClick={() => setIsAddingNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加费用
          </Button>
        ) : (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Label>费用类型</Label>
              <select
                className="w-full rounded-md border p-2"
                {...form.register('fee_type_id')}
                onChange={(e) => {
                  form.setValue('fee_type_id', e.target.value);
                  setSelectedFeeTypeId(e.target.value);
                  form.setValue('specification_id', undefined);
                }}
              >
                <option value="">请选择费用类型</option>
                {availableFeeTypes?.map((ft) => (
                  <option key={ft.id} value={ft.id}>
                    {ft.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedFeeType?.specifications && selectedFeeType.specifications.length > 0 && (
              <div className="space-y-2">
                <Label>规格</Label>
                <select
                  className="w-full rounded-md border p-2"
                  {...form.register('specification_id')}
                >
                  <option value="">请选择规格</option>
                  {selectedFeeType.specifications.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name} - ¥{Number(spec.price_monthly)}/月
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="effective_from">生效日期</Label>
              <Input
                id="effective_from"
                type="date"
                {...form.register('effective_from')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  form.reset();
                }}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const data = form.getValues();
                  createConfigMutation.mutate(data);
                }}
                disabled={createConfigMutation.isPending}
              >
                {createConfigMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                确认添加
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          关闭
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
